const mongoose = require('mongoose')

const initRoutes = require('./express')

mongoose.set('useCreateIndex', true)
mongoose
	.connect('mongodb://localhost/project_bog', {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => {
		initRoutes()
	})