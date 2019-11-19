const { User, Theme, Video, Song, File } = require('./models')
const { createToken, verifyToken, uuidFileName, vidExtension, renderFromRequest, toFilesDir } = require('./utils')
const express = require('express')
const multer = require('multer')
const path = require('path')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const { normalizeSong, normalizeVideo } = require('../rendering/video')
const { fetchThread, initAuth } = require('../rendering/reddit-api')

require('dotenv').config()
const {
	STRIPE_WEBHOOK_SECRET,
	STRIPE_API_KEY,
	PORT,
} = process.env

const stripe = require('stripe')(STRIPE_API_KEY)

const verifyTokenMiddleware = async (req, res, next) => {
	if (req.cookies && req.cookies.token) {
		try {
			const payload = await verifyToken(req.cookies.token)

			if (!payload.email) {
				throw "INVALID_TOKEN"
			}

			const user = await User.findOne({ $or: [{ email: payload.email }, { username: payload.email }] })

			if (!user) {
				throw "INVALID_TOKEN"
			}

			req.user = user
			next()
		} catch (e) {
			return res.status(401).json({ error: "INVALID_TOKEN" })
		}
	} else {
		res.status(401).json({ error: "NO_TOKEN" })
	}
}

const verifyAdminMiddleware = async (req, res, next) => {
	if (req.user.isAdmin) {
		next()
	} else {
		res.status(403).json({ code: 403, error: "NOT_ALLOWED" })
	}
}

// Credit price in euros
const creditPrice = 8

const multerStorage = multer.diskStorage({
	filename(req, file, cb) {
		let ext = file.originalname.split('.').pop()

		cb(null, uuidFileName(ext))
	},
	// destination(req, file, cb) {
	// 	cb(null, filesLocation)
	// }
})

function getVideoPrice(length) {
	return 1
}

let renderQueue = []

const init = () => {
	const app = express()
	const upload = multer({
		storage: multerStorage,
		limits: { fileSize: 50000000, files: 5 }, // 50MB file size limit
	})

	app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

	if (process.env.NODE_ENV !== "production") {
		// Enable cors for development mode
		app.use(require('cors')({
			credentials: true,
			origin(a, b) { b(null, true) }
		}))
	}

	initAuth() // Start the reddit api

	app
		.post('/api/stripe-webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
			const sig = req.headers['stripe-signature'];

			let event

			try {
				event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
			} catch (err) {
				console.error(err)
				return res.status(400).send(`Webhook Error: ${err.message}`);
			}

			// Handle the checkout.session.completed event
			if (event.type === 'checkout.session.completed') {
				const session = event.data.object;

				// Fulfill the purchase...
				let userId = session.client_reference_id
				console.log(session)
				if (!userId) {
					throw new Error("No client reference Id gotten! Can't match payment with payer.")
				}
				session.display_items.forEach(product => {
					if (product.custom.name === "Credits") {
						User.updateOne({ _id: userId }, { $inc: { credits: product.quantity } }).exec()
					} else {
						console.error("Unknown product name", product.custom.name)
						User.updateOne({ _id: userId }, { $inc: { credits: product.quantity } }).exec()
					}
				})
			}

			// Return a response to acknowledge receipt of the event
			res.json({ received: true })
		})

	app.use(cookieParser())
	app.use(bodyParser.json()) // Use json body parsing

	const adminRouter = express.Router()
		.use(verifyTokenMiddleware)
		.use(verifyAdminMiddleware)
		.get('/users', async (req, res) => {
			let users = await User.find().select({ password: 0 })
			res.json(users)
		})
		.get('/users/:userId', async (req, res) => {
			let user = await User.findOne({ _id: req.params.userId }).select({ password: 0 })
			res.json(user)
		})
		.post('/users', async (req, res) => {
			let { password, email, username } = req.body

			let emailUsername = {}
			if (username) {
				emailUsername.username = username
				let nm = await User.countDocuments({ username })
				if (nm > 0) {
					return res.status(400).json({ error: "USERNAME_IN_USE" })
				}
			}

			if (email) {
				emailUsername.email = email
				let nm = await User.countDocuments({ email })
				if (nm > 0) {
					return res.status(400).json({ error: "EMAIL_IN_USE" })
				}
			}

			let user = await User.create({ password, ...emailUsername })
			res.json(user)
		})
		.put('/users/:userId/change-password', async (req, res) => {
			let user = await User.updateOne({ _id: req.params.userId }, { password: req.body.password })
			res.json(user)
		})
		.put('/users/:userId/add-credits', async (req, res) => {
			if (isNaN(req.body.quantity)) return res.status(400).json({ error: "QUANTITY_NAN" })

			let user = await User.updateOne({ _id: req.params.userId }, { $inc: { credits: req.body.quantity } })
			res.json(user)
		})
		.put('/users/:userId/set-multiplier', async (req, res) => {
			let user = await User.updateOne({ _id: req.params.userId }, { multiplier: req.body.multiplier })
			res.json(user)
		})

	// API router for all api calls
	const apiRouter = express.Router()
		.post('/register', async (req, res) => {
			let { password, email, username } = req.body
			if (!password) {
				return res.status(400).json({ error: "NO_PASSWORD" })
			} else if (password.length < 8) {
				return res.status(400).json({ error: "PASSWORD_TOO_SHORT" })
			}
			if (!email && !username) {
				return res.status(400).json({ error: "NO_EMAIL_OR_USERNAME" })
			}

			let emailUsername = {}
			if (username) {
				emailUsername.username = username
				let nm = await User.countDocuments({ username })
				if (nm > 0) {
					return res.status(400).json({ error: "USERNAME_IN_USE" })
				}
			}

			if (email) {
				emailUsername.email = email
				let nm = await User.countDocuments({ email })
				if (nm > 0) {
					return res.status(400).json({ error: "EMAIL_IN_USE" })
				}
			}

			new User({ password, ...emailUsername }).save()
				.then(() => {
					res.status(200).json({})
				})
				.catch(err => {
					res.status(400).json({ error: "EMAIL_IN_USE" })
				})
		})
		// Authorization route expects email & pass encoded 
		// in the Authorization header using the 'Basic' scheme
		// If successful, results in client getting the 'token' cookie (httpOnly)
		.post('/auth', (req, res) => {
			if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
				return res.status(401).json({ error: "NO_AUTH_HEADER" })
			}

			const authHeader = req.headers.authorization || ''
			let str = Buffer.from(authHeader.split(' ')[1], 'base64').toString()
			let [email, password] = str.split(':')

			User.findByEmailPass(email, password)
				.then(user => {
					let tokenBase = user.email ? user.email : user.username

					if (tokenBase) {
						return createToken(tokenBase)
					} else {
						throw "No username or email"
					}
				})
				.then(token => {
					res.cookie('token', token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 365 })
					res.status(200).json({})
				})
				.catch(err => {
					res.status(400).json({ error: "NO_MATCH" })
				})
		})
		.get('/logout', (req, res) => {
			res.clearCookie('token').status(200).json({})
		})

		.use(verifyTokenMiddleware)
		.get('/test', (_, res) => {
			res.json({})
		})

		.get('/me', async (req, res) => {
			let user = await User.findOne({ _id: req.user._id }).select({ password: 0 })
			res.json(user)
		})
		.put('/me/change-password', async (req, res) => {
			let { passwordCurrent, passwordNew } = req.body

			// Find the user
			User.findByEmailPass(req.user.email || req.user.username, passwordCurrent)
				.then(async user => {
					// Auth succeeded

					// Change password
					user.password = passwordNew
					// Save user
					await user.save()
					// Return success
					res.json({})
				})
				.catch(err => {
					res.status(400).json({ error: 'WRONG_PASS' })
				})
		})
		.get('/credits', (req, res) => {
			res.json({ credits: req.user.credits })
		})
		.post('/credits/check-price', (req, res) => {
			let quantity = req.body.quantity
			if (!quantity) {
				return res.status(400).json({ error: 'NO_QUANTITY' })
			}

			// Calculate price (2 digits after decimal point)
			let total = Math.round((quantity * creditPrice * req.user.multiplier) * 100) / 100

			res.json({ total })
		})
		.post('/credits/buy', async (req, res) => {
			if (!req.body.quantity) {
				return res.status(400).json({ error: 'NO_QUANTITY' })
			}

			let adjustedPrice = (creditPrice * 100) * req.user.multiplier
			// Times hundred to make into cents (stripe expects amount to be in cents)

			const session = await stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: [{
					name: 'Video credits',
					description: 'Video credits for Reddit Video Maker',
					// images: ['https://example.com/t-shirt.png'],
					currency: 'eur',
					quantity: req.body.quantity,
					amount: adjustedPrice, // TODO: make amount depend on how many you buy (mängdrabatt)
				}],
				client_reference_id: req.user._id.toString(),
				success_url: process.env.DOMAIN_URL + '/credits-success',
				cancel_url: process.env.DOMAIN_URL + '/credits-cancel',
			})

			res.json({ session })
		})

		// THREAD GET
		.get('/thread/:thread', (req, res) => {
			let thread = req.params.thread

			let options = {
				filterEdits: false,
				skipQuestion: false,
				sort: req.query.sort || 'top',
			}

			fetchThread(thread, options)
				.then(data => {
					res.json(data)
				})
				.catch(err => {
					res.status(404).json({
						error: `Couldn't fetch thread`,
					})
				})
		})

		// VOICE
		// NOT IMPLEMENTED
		.get('/voices', async (req, res) => {
			res.status(500).json({})
		})

		// SONGS
		/////////////
		.get('/songs', async (req, res) => {
			let songs = await Song.find({ owner: req.user._id }).populate('file')

			res.json(songs)
		})
		.post('/songs', upload.single('song'), async (req, res) => {
			const origSong = req.file

			let newFileName = uuidFileName('mp3') // Force mp3
			let newFilePath = toFilesDir(newFileName)
			await normalizeSong(origSong.path, newFilePath)

			// Song is now normalized and at "newFilePath"

			let songFile = await File.create({
				filename: newFileName,
				origname: origSong.originalname,
			})

			let songDoc = new Song({
				file: songFile._id,
				owner: req.user._id,
			})
			await songDoc.save()

			res.json({})
		})
		.delete('/songs/:songId', async (req, res) => {
			const songId = req.params.songId

			await Song.findOne({ owner: req.user._id, _id: songId }).then(s => s.remove())

			res.json({ song: songId })
		})

		// THEMES
		/////////////
		.get('/themes', async (req, res) => {
			let themes = await Theme.find(
				{ $or: [{ public: 'true' }, { owner: req.user._id }] }
			)

			res.json(themes)
		})
		.get('/themes/:themeId', async (req, res) => {
			let themes = await Theme.findOne({
				_id: req.params.themeId,
				$or: [{ public: 'true' }, { owner: req.user._id }]
			})
				.populate('intro')
				.populate('outro')
				.populate('transition')

			res.json(themes)
		})
		// Create new theme
		.post('/themes', async (req, res) => {
			let theme = new Theme({
				name: req.body.name || 'Untitled theme',
				owner: req.user._id,
				voice: req.body.voice,
				voiceSpeed: req.body.voiceSpeed,
			})
			await theme.save()

			res.json({ theme: theme._id })
		})
		// Update theme
		.put('/themes/:theme', async (req, res) => {
			let themeId = req.params.theme

			let obj = {}
			if (req.body.name) {
				obj.name = req.body.name
			}
			if (req.body.voice) {
				obj.voice = req.body.voice
			}
			if (req.body.voiceSpeed) {
				obj.voiceSpeed = req.body.voiceSpeed
			}

			await Theme.updateOne({ _id: themeId, owner: req.user._id }, obj)

			res.json({ theme: themeId })
		})
		// Upload theme transition
		.post('/themes/:theme/files', upload.fields([
			{ name: 'intro' },
			{ name: 'transition' },
			{ name: 'outro' },
		]), async (req, res) => {
			let themeId = req.params.theme

			let theme = await Theme.findOne({
				_id: themeId,
				owner: req.user._id,
			})

			for (const vidPart of ['intro', 'transition', 'outro']) {
				if (!req.files[vidPart] || !req.files[vidPart][0]) {
					continue
				}

				const filePath = req.files[vidPart][0].path
				const originalName = req.files[vidPart][0].originalname


				let newFileName = uuidFileName(vidExtension) // Force correct extension
				let newFilePath = toFilesDir(newFileName)

				await normalizeVideo(filePath, newFilePath)

				if (theme[vidPart]) {
					// If there already exists a video of this type on this theme,
					// delete it.
					File.findOne({ _id: theme[vidPart] }).then(d => d.remove)
				}

				let file = await File.create({
					filename: newFileName,
					origname: originalName,
				})

				theme[vidPart] = file._id
			}

			await theme.save()

			res.json({})
		})
		.delete('/themes/:theme', async (req, res) => {
			await Theme.findOne({ _id: req.params.theme, owner: req.user._id }).then(d => d.remove)

			res.json({})
		})
		.delete('/themes/:theme/files', async (req, res) => {
			let { intro, outro, transition } = req.body

			let theme = await Theme.findOne({
				_id: req.params.theme,
				owner: req.user._id,
			})

			if (intro) {
				File.findOne({ _id: theme.intro }).then(d => d.remove)
				theme.intro = null
			}
			if (transition) {
				File.findOne({ _id: theme.transition }).then(d => d.remove)
				theme.transition = null
			}
			if (outro) {
				File.findOne({ _id: theme.outro }).then(d => d.remove)
				theme.outro = null
			}

			theme.save()

			res.json({})
		})

		// RENDER VIDEO
		.post('/videos', async (req, res) => {
			// Take credit from user

			if (req.user.credits < 1) {
				return res.status(400).json({ error: "NOT_ENOUGH_CREDITS" })
			}

			let cost = getVideoPrice()
			User.updateOne({ _id: req.user._id }, { $inc: { credits: -cost, videoCount: 1 } }).exec()

			try {
				let { renderPromise, vid } = await renderFromRequest(req.body, req.user._id)

				renderQueue.push({
					promise: renderPromise,
					file: vid.file,
				})
				renderPromise.then(() => {
					let index = renderQueue.findIndex(r => r.file === vid.file)
					if (index >= 0) {
						renderQueue.splice(index, 1)
					}
					Video.updateOne({ _id: vid._id }, { $set: { finished: new Date() } }).exec()
				})

				res.json({ message: 'Rendering', file: vid.file })
			} catch (error) {
				console.error(error)
				User.updateOne({ _id: req.user._id }, { $inc: { credits: cost } }).exec() // Refund credits
			}
		})
		.post('/preview', async (req, res) => {
			// Same as [POST /videos], except the question data and comment
			// data is pre-set and calling this doesn't cost credits.
			// Used to give the user a good idea of the music & intro, outro
			// and videos they have chosen.

			// Should wait until rendering is done and then return a link to
			// where the video is found.

			// $type: "null" to not break older models which did not have the "finished" prop
			let amountOfPreviewsInOrder = await Video.findOne({ finished: { $type: "null" }, preview: true }).countDocuments().exec()

			if (amountOfPreviewsInOrder > 0) {
				return res.status(400).json({ error: 'ALREADY_RENDERING_PREVIEW' })
			}

			let { questionData, commentData } = require('../example-data.json') // Warning: require(...) caches the content of this file

			try {
				let options = { ...req.body, questionData, commentData, name: 'Preview', preview: true }
				let { renderPromise, vid } = await renderFromRequest(options, req.user._id)

				renderQueue.push({
					promise: renderPromise,
					file: vid.file,
				})
				renderPromise
					.then(() => {
						let index = renderQueue.findIndex(r => r.file === vid.file)
						if (index >= 0) {
							renderQueue.splice(index, 1)
						}
						Video.updateOne({ _id: vid._id }, { $set: { finished: new Date() } }).exec()
					})

				res.json({ message: 'Rendering', file: vid.file })
			} catch (error) {
				console.error(error)
			}

		})
		.get('/long-poll-video/:videoFileId', async (req, res) => {
			// Long polling for getting the video state
			let file = req.params.videoFileId

			let vid
			if (vid = renderQueue.find(q => q.file == file)) {
				await vid.promise
			}

			// Download the file
			res.json({ url: '/api/videos/' + file })
		})
		.get('/videos', async (req, res) => {
			let vids = await Video.find({ owner: req.user._id }).sort({ created: -1 })
			res.json(vids)
		})
		.get('/videos/:videoName', async (req, res) => {
			let videoName = req.params.videoName

			Video
				.findOne({ file: videoName, owner: req.user._id })
				.populate('file')
				.catch(err => {
					res.status(404).json({})
				})
				.then(vid => {
					if (vid) {
						res.download(toFilesDir(vid.file.filename))

						// Increment downloads by one
						Video.updateOne({ file: videoName, owner: req.user._id }, { $inc: { downloads: 1 } }).exec()
					} else {
						res.sendStatus(404)
					}
				})
		})

	app.use('/api/admin', adminRouter)
	app.use('/api', apiRouter)
	app.use('/api/*', (req, res) => {
		res.status(404).json({ error: "NOT_FOUND" })
	})

	app.use('/videos', verifyTokenMiddleware, express.static('files')) // Serve files

	app.use(express.static('hammurabi-build')) // Serve hammurabi client
	app.use('*', (req, res) => {
		// Serve hammurabi
		res.sendFile(path.join(__dirname, '../../hammurabi-build/index.html'))
	})

	app.listen(PORT)
}

module.exports = init
