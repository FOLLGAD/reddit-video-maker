const { renderFromRequest } = require('./utils')

const initRoutes = require('./express')
const { connect } = require('./db')
const fs = require('fs')

connect()
	.then(() => {
		initRoutes()
	})