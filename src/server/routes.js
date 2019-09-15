const { User, Theme, Video } = require('./models')
const { createToken, verifyToken } = require('./utils')
const { render } = require('../render')
const express = require('express')
const multer = require('multer')
const fs = require('fs')
const uuid = require('uuid')
const path = require('path')
const morgan = require('morgan')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const { fetchThread, initAuth } = require('../reddit-api')

const verifyTokenMiddleware = async (req, res, next) => {
	if (req.cookies && req.cookies.token) {
		const payload = await verifyToken(req.cookies.token)
		const user = await User.findOne({ email: payload.email })
		req.user = user
		next()
	} else {
		res.status(401).json({ error: "NO_TOKEN" })
	}
}

const multerStorage = multer.diskStorage({
	filename(req, file, cb) {
		let ext = file.originalname.split('.').pop()
		if (ext) {
			cb(null, `${uuid()}.${ext}`)
		} else {
			cb(null, uuid())
		}
	}
})

const deleteFileCond = filename => {
	// Delete the file
	return new Promise((res, rej) => {
		if (filename) {
			fs.unlink(path.join(__dirname, '../../files', filename), (err) => {
				if (err) rej(err)
				else res()
			})
		}
	})
}

let renderQueue = []

const init = () => {
	const app = express()
	const upload = multer({
		storage: multerStorage,
		dest: 'files/',
		limits: { fileSize: 50000000, files: 5 }, // 50MB file size limit
	})

	app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

	// if (process.env.NODE_ENV === "development") {
	// Enable cors for development mode
	app.use(cors({
		credentials: true,
		origin: 'http://localhost:3000'
	}))
	// }

	app.use(express.json()) // Use json body parsing
	app.use(cookieParser())

	initAuth() // Start the reddit api

	// API router for all api calls
	const apiRouter = express.Router()
		.post('/register', (req, res) => {
			let { password, email } = req.body
			if (!password) {
				return res.status(400).json({ error: "NO_PASSWORD" })
			} else if (password.length < 8) {
				return res.status(400).json({ error: "PASSWORD_TOO_SHORT" })
			}
			if (!email) {
				return res.status(400).json({ error: "NO_EMAIL" })
			}

			new User({ email, password }).save()
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
			const authHeader = req.headers.authorization || ''
			let str = Buffer.from(authHeader.split(' ')[1], 'base64').toString()
			let [email, password] = str.split(':')

			User.findByEmailPass(email, password)
				.then(user => {
					return createToken(user.email)
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
		// .post('/get-info', (req, res) => {
		// 	// Currently unused
		// 	// http://localhost:8000/get-info?comments=cmnt1,cmnt2,cmnt3
		// 	let comments = querystring.parse(parsedUrl.query).comments.split(',')
		// 	let commentData = await getInfo(comments) // Should return an array of comment data

		// 	res.endJson(commentData)
		// })
		.get('/voices', async (req, res) => {
			let themes = await Theme.find(
				{ $or: [{ public: 'true' }, { owner: req.user._id }] },
				{ name: 1, songs: 1, _id: 1 }
			)

			res.json(themes)
		})
		.get('/themes', async (req, res) => {
			let themes = await Theme.find(
				{ $or: [{ public: 'true' }, { owner: req.user._id }] },
				{ name: 1, songs: 1, _id: 1 }
			)

			res.json(themes)
		})
		.get('/theme/:themeId', async (req, res) => {
			let themes = await Theme.findOne(
				{ _id: req.params.themeId, $or: [{ public: 'true' }, { owner: req.user._id }] },
				{ name: 1, songs: 1, _id: 1, public: 1 }
			)

			res.json(themes)
		})
		// Create new theme
		.post('/themes', async (req, res) => {
			let theme = new Theme({
				name: req.body.name || 'Untitled theme',
				owner: req.user._id,
				voice: req.body.voice,
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

			await Theme.updateOne({ _id: themeId, owner: req.user._id }, req.body)

			res.json({})
		})
		// Upload theme transition
		.post('/themes/:theme/transition', upload.single('file'), async (req, res) => {
			let themeId = req.params.theme

			let theme = await Theme.findOne({
				_id: themeId,
				owner: req.user._id,
			})

			let oldfile = theme.transition
			theme.transition = req.file.filename

			await theme.save()

			res.json({})

			deleteFileCond(oldfile)
		})
		.delete('/themes/:theme', async (req, res) => {
			await Theme.deleteOne({ _id: themeId, owner: req.user._id })

			res.json({})
		})
		.post('/render-video', async (req, res) => {
			let body = req.body

			let question = body.questionData
			let comments = body.commentData
			let options = body.options

			let theme
			try {
				theme = await Theme.findById(options.theme)
			} catch (e) {
				return res.status(400).json({ error: "NO_THEME" })
			}

			if (!options.song) console.error("No song selected")

			const toFilesPath = filename => filename ? path.join(__dirname, '../files', filename) : null

			let vid = new Video({ theme: theme._id, owner: req.user._id, file: toFilesPath(uuid()) })
			vid.save()

			let renderPromise = render(question, comments, {
				transition: toFilesPath(theme.transition),
				outro: toFilesPath(theme.outro),
				intro: toFilesPath(theme.intro),
				voice: theme.voice,
				outPath: vid.file,
			})

			renderQueue.push({
				promise: renderPromise,
				id: vid._id,
			})
			renderPromise.then(() => {
				let index = renderQueue.findIndex(r => r.id === vid._id)
				if (index >= 0) {
					renderQueue.splice(index, 1)
				}
			})

			res.json({ message: 'Rendering', id: vid._id })
		})
		.post('/check-on-video/:videoId', async (req, res) => {
			// Long polling for getting the video state
			let id = req.params.videoId

			let vid
			if (vid = renderQueue.find(q => q.id == id)) {
				await vid.promise
				res.json({})
				return
			}

			res.json({})
		})

	app.use('/api', apiRouter)

	app.use(express.static('hammurabi-build'))

	app.listen(8000)
}

module.exports = init