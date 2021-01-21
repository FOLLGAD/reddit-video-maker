const initRoutes = require('./express')
const { connect } = require('./db')

connect()
	.then(() => {
		initRoutes()
	})