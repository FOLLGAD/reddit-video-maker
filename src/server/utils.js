const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const tokenSecret = process.env.TOKEN_SECRET

const filesLocation = path.join(__dirname, '../../files')

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
	toFilesDir: file => file ? path.join(filesLocation, file) : null,
}