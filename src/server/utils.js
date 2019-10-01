const { Song, File, User, Theme, Video } = require('./models')

const { render } = require('../rendering/render')

const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
require('dotenv').config()

const tokenSecret = process.env.TOKEN_SECRET

const filesLocation = path.join(__dirname, '../../files')
const toFilesDir = file => file ? path.join(filesLocation, file) : null
const uuidFileName = extension => extension ? uuid() + '.' + extension : uuid()

const vidExtension = 'mp4'

module.exports = {
	createToken(email) {
		return new Promise((res, rej) => {
			jwt.sign({ email }, tokenSecret, { expiresIn: '30d' }, (err, token) => {
				if (err) return rej(err)
				return res(token)
			})
		})
	},
	verifyToken(token) {
		return new Promise((res, rej) => {
			jwt.verify(token, tokenSecret, (err, payload) => {
				if (err) return rej(err)
				return res(payload)
			})
		})
	},

	vidExtension,
	uuidFileName,
	filesLocation,
	deleteFileCond(filename) {
		// Delete the file
		return new Promise((res, rej) => {
			if (filename) {
				fs.unlink(path.join(filesLocation, filename), (err) => {
					if (err) rej(err)
					else res()
				})
			}
		})
	},
	toFilesDir,
	async renderFromRequest({ options, questionData, commentData }, owner) {
		let theme
		try {
			console.log(options.theme)
			theme = await Theme.findById(options.theme)
				.populate('intro')
				.populate('transition')
				.populate('outro')
			if (!theme) {
				throw { error: "WRONG_THEME", status: 400 }
			}
		} catch (e) {
			throw { error: "NO_THEME", status: 400 }
		}

		let song = options.song ? await Song.findById(options.song, { file: 1 }).populate('file') : null

		let videoFile = await File.create({
			filename: uuidFileName(vidExtension),
		})

		let vid = new Video({
			theme: theme._id,
			name: questionData.title,
			file: videoFile._id,
			owner,
		})
		vid.save()

		let renderOptions = {
			outPath: toFilesDir(videoFile.filename),
			intro: toFilesDir(theme.intro && theme.intro.filename),
			transition: toFilesDir(theme.transition && theme.transition.filename),
			outro: toFilesDir(theme.outro && theme.outro.filename),
			song: song && toFilesDir(song.file.filename),
			voice: theme.voice,
		}

		return {
			renderPromise: await render(questionData, commentData, renderOptions),
			vid,
		}
	},
}