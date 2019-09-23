const mongoose = require('mongoose')

module.exports.connect = () => {
	mongoose.set('useCreateIndex', true)

	return mongoose
		.connect('mongodb://localhost/project_bog', {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		})
}