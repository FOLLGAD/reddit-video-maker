const { toFilesDir, deleteFileCond } = require('./utils')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const bcrypt = require('bcrypt')

const FileSchema = new Schema({
	filename: { type: String, select: 1 },
	origname: { type: String, select: 1 },
})

FileSchema.pre('deleteOne', async function (next) {
	console.log('Deleting file', this.filename, this.origname)
	await deleteFileCond(toFilesDir(this.filename)) // Delete the file (if it exists)
	next()
})

module.exports.File = mongoose.model('File', FileSchema)

const UserSchema = new Schema({
	email: { type: String, required: true, lowercase: true, unique: true, select: 1 },
	password: { type: String, set: val => bcrypt.hashSync(val, 10) },
	credits: { type: Number, default: 0, select: 1 },
	videoCount: { type: Number, default: 0, select: 1 },
	registered: { type: Date, default: Date.now },
	isAdmin: { type: Boolean, default: false, select: 1 },
})

UserSchema.method('comparePassword', function (password) {
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
	intro: { type: ObjectId, ref: 'File', select: 1 },
	transition: { type: ObjectId, ref: 'File', select: 1 },
	outro: { type: ObjectId, ref: 'File', select: 1 },

	voice: { type: String, enum: ['daniel', 'google-us', 'google-uk'], default: 'daniel', select: 1 },
	voiceSpeed: { type: Number, min: 0.2, max: 5, default: 1 },

	owner: { type: ObjectId, select: 0, ref: 'User' },
	updated: { type: Date, default: Date.now },
})

ThemeSchema.pre('deleteOne', async function (next) {
	module.exports.File.deleteOne({ _id: this.intro })
	module.exports.File.deleteOne({ _id: this.outro })
	module.exports.File.deleteOne({ _id: this.transition })
	next()
})

module.exports.Theme = mongoose.model('Theme', ThemeSchema)

const SongSchema = new Schema({
	public: { type: Boolean, default: false, select: 0 },
	file: { type: ObjectId, ref: 'File', select: 1 },
	owner: { type: ObjectId, select: 0, ref: 'User' },
	created: { type: Date, default: Date.now },
})

SongSchema.pre('deleteOne', async function (next) {
	module.exports.File.deleteOne({ _id: this.file })
	next()
})

module.exports.Song = mongoose.model('Song', SongSchema)

const VideoSchema = new Schema({
	file: { type: ObjectId, select: 1, ref: 'File' },
	name: { type: String, default: 'Video' },
	owner: { type: ObjectId, select: 0, ref: 'User' },
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
			videos.forEach(vid => {
				mongoose.model('File').deleteOne({ _id: vid.file })
			})
		})

	next()
})

module.exports.Video = mongoose.model('Video', VideoSchema)

const SwearwordDictSchema = new Schema({
	owner: ObjectId,
})

module.exports.SwearwordDict = mongoose.model('SwearwordDict', SwearwordDictSchema)

const VoiceSchema = new Schema({
	engine: { type: String, enum: ['daniel', 'google'] },
	googleSettings: {

	},
})

module.exports.Voice = mongoose.model('Voice', VoiceSchema)
