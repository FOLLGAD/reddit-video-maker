const jwt = require('jsonwebtoken')
const { tokenSecret } = require('../../env.json')

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
	}
}