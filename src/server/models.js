const { deleteFileCond } = require('./utils')

const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const bcrypt = require('bcrypt')
const uuid = require('uuid')

const UserSchema = new Schema({
	email: { type: String, required: true, lowercase: true, unique: true },
	password: { type: String, set: val => bcrypt.hashSync(val, 10) },
	credits: { type: Number, default: 0 },
	videoCount: { type: Number, default: 0 },
	registered: { type: Date, default: Date.now },
})

UserSchema.method("comparePassword", function (password) {
	// Compare password with current
	return bcrypt.compare(password, this.password)
})

UserSchema.statics.findByEmailPass = function (email, password) {
	return this.findOne({ email })
		.then(async user => {
			let passed = await user.comparePassword(password)
			if (passed) {
				return user
			}
		})
}

module.exports.User = mongoose.model('User', UserSchema)

// const getExt = filename => filename.split('.').pop()
// const PathSchema = { type: String, set: original => `${uuid()}.${getExt(original)}` }

const ThemeSchema = new Schema({
	name: { type: String, default: 'Untitled Theme', select: 1 },
	public: { type: Boolean, default: false, select: 0 },

	// Filenames:
	intro: { type: String, select: 1 },
	transition: { type: String, select: 1 },
	outro: { type: String, select: 1 },

	songs: { type: [String], select: 0 },

	voice: { type: String, enum: ["daniel", "google-us", "google-uk"], default: "daniel", select: 1 },

	owner: { type: ObjectId, select: 0 },
	updated: { type: Date, default: Date.now },
})

ThemeSchema.pre('save', next => {
	this.wasNew = this.isNew
	if (this.isNew) {
		this.path = `${this.name.toLowerCase}-${uuid}`
	}
	next()
})

module.exports.Theme = mongoose.model('Theme', ThemeSchema)

const SongSchema = new Schema({
	public: { type: Boolean, default: false, select: 0 },
	name: { type: String, select: 1 },
	file: { type: String, select: 0 },
	owner: { type: ObjectId, select: 0 },
	created: { type: Date, default: Date.now },
})

module.exports.Song = mongoose.model('Song', SongSchema)

const VideoSchema = new Schema({
	name: { type: String, default: "Video" },
	file: { type: String, select: 1 },
	owner: { type: ObjectId, select: 0 },
	theme: { type: ObjectId, select: 1 },
	finished: { type: Date, select: 1 },
	created: { type: Date, default: Date.now, select: 1 },
	expiration: { type: Date, default: Date.now() + 1000 * 60 * 60 * 24, select: 1 }, // 24 hours before expiration
	downloads: { type: Number, default: 0 },
	preview: { type: Boolean, default: false },
})

VideoSchema.pre('deleteMany', async function (next) {
	let query = this.getQuery()

	// Must await, otherwise the videos will already be gone
	await mongoose.model('Video')
		.find(query)
		.then(videos => {
			videos.forEach(vid => deleteFileCond(vid.file))
		})

	next()
})

module.exports.Video = mongoose.model('Video', VideoSchema)

const SwearwordDictSchema = new Schema({
	owner: ObjectId,
})

module.exports.SwearwordDict = mongoose.model('SwearwordDict', SwearwordDictSchema)

const VoiceSchema = new Schema({
	engine: { type: String, enum: ["daniel", "google"] },
	googleSettings: {

	},
})

module.exports.Voice = mongoose.model('Voice', VoiceSchema)
