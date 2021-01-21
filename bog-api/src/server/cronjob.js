const { Video } = require('./models')
const cron = require('cron')

function deleteOldVideos() {
	Video.deleteMany({ preview: true, created: { $lt: Date.now() - 1000 * 60 * 60 } }).exec() // delete if older than one hour
	Video.deleteMany({ preview: false, created: { $lt: Date.now() - 1000 * 60 * 60 * 24 * 7 } }).exec() // delete if older than 7 days
}

cron.job('0 0 4 * * *', deleteOldVideos) // Run at 4 am every day

deleteOldVideos() // Run on startup