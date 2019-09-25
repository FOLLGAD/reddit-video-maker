const { Video } = require('./models')
const cron = require('cron')

function deleteOldVideos() {
	Video.deleteMany({ preview: true, created: { $lt: Date.now() - 1000 * 60 * 60 } }).exec() // delete if older than one hour
	Video.deleteMany({ created: { $lt: Date.now() - 1000 * 60 * 60 * 6 } }).exec() // delete if older than six hours
}

cron.job('0 0 4 * * *', deleteOldVideos)

deleteOldVideos()