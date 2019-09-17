const { User, Theme, Video, Song } = require('./models')
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

const filesLocation = path.join(__dirname, '../../files')
const toFilesDir = file => file ? path.join(filesLocation, file) : null

const uuidFileName = extension => extension ? uuid() + '.' + extension : uuid()

const multerStorage = multer.diskStorage({
	filename(req, file, cb) {
		let ext = file.originalname.split('.').pop()
		if (ext) {
			cb(null, `${uuid()}.${ext}`)
		} else {
			cb(null, uuid())
		}
	},
	destination(req, file, cb) {
		cb(null, filesLocation)
	}
})

const deleteFileCond = filename => {
	// Delete the file
	return new Promise((res, rej) => {
		if (filename) {
			fs.unlink(path.join(filesLocation, filename), (err) => {
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
		limits: { fileSize: 50000000, files: 5 }, // 50MB file size limit
	})

	app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

	// if (process.env.NODE_ENV === "development") {
	// Enable cors for development mode
	app.use(cors({
		credentials: true,
		origin(a, b) { b(null, true) }
	}))

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
			let songs = await Song.find({ owner: req.user._id })

			res.json(songs)
		})
		.post('/songs', upload.single('song'), async (req, res) => {
			const song = req.file

			let songDoc = new Song({
				name: song.originalname,
				file: song.filename,
				owner: req.user._id,
			})
			await songDoc.save()

			res.json({ song: songDoc._id })
		})
		.delete('/songs/:songId', async (req, res) => {
			const songId = req.params.songId

			await Song.deleteOne({ owner: req.user._id, _id: songId })

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

			const intro = req.files['intro'] && req.files['intro'][0]
			const transition = req.files['transition'] && req.files['transition'][0]
			const outro = req.files['outro'] && req.files['outro'][0]

			let theme = await Theme.findOne({
				_id: themeId,
				owner: req.user._id,
			})

			let toDelete = []

			if (intro) {
				theme.intro && toDelete.push(theme.intro)
				theme.intro = intro.filename
			}
			if (transition) {
				theme.transition && toDelete.push(theme.transition)
				theme.transition = transition.filename
			}
			if (outro) {
				theme.outro && toDelete.push(theme.outro)
				theme.outro = outro.filename
			}

			await theme.save()

			res.json({})

			// Remove all the files
			toDelete.forEach(file => deleteFileCond(file))
		})
		.delete('/themes/:theme', async (req, res) => {
			await Theme.deleteOne({ _id: req.params.theme, owner: req.user._id })

			res.json({})
		})
		.delete('/themes/:theme/files', async (req, res) => {
			let { intro, outro, transition } = req.body

			let theme = await Theme.findOne({
				_id: req.params.theme,
				owner: req.user._id,
			})

			let toDelete = []

			if (intro) {
				toDelete.push(theme.intro)
				theme.intro = null
			}
			if (transition) {
				toDelete.push(theme.transition)
				theme.transition = null
			}
			if (outro) {
				toDelete.push(theme.outro)
				theme.outro = null
			}

			await Theme.updateOne({ _id: req.params.theme, owner: req.user._id }, deltaObj)

			res.json({})
		})

		// RENDER VIDEO
		.post('/videos', async (req, res) => {
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

			let song = options.song ? await Song.findById(options.song, { file: 1 }) : null

			let vid = new Video({
				theme: theme._id,
				owner: req.user._id,
				file: toFilesDir(uuidFileName('mkv'))
			})
			vid.save()

			let renderPromise = render(question, comments, {
				transition: toFilesDir(theme.transition),
				outro: toFilesDir(theme.outro),
				intro: toFilesDir(theme.intro),
				song: toFilesDir(song.file),
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
		.get('/videos', async (req, res) => {
			let vids = await Video.find({ owner: req.user._id })
			res.json(vids)
		})
		.get('/videos/:videoId', async (req, res) => {
			let videoId = req.params.videoId

			let vid = await Video.findById(videoId)

			res.sendFile(toFilesDir(vid.file))

			// Increment downloads by one
			Video.updateOne({ _id: videoId }, { $inc: { downloads: 1 } })
		})

	app.use('/api', apiRouter)

	app.use('/files', verifyTokenMiddleware, express.static('files')) // Serve files
	app.use(express.static('hammurabi-build')) // Serve hammurabi client

	app.listen(8000)
}

module.exports = init