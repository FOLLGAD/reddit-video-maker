const mongoose = require('mongoose')

require('dotenv').config()

module.exports.connect = () => {
	mongoose.set('useCreateIndex', true)

	return mongoose
		.connect(process.env.DB_URL, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
}