const { render } = require('./render')
const { startInstance } = require('./puppet')
const { questionData, commentData, options } = require('./render-data.log.json')

if (!options.theme) console.error("No theme selected")
if (!options.song) console.error("No song selected")

options.outputName = questionData.id

startInstance()
	.then(() => {
		render(questionData, commentData, options)
	})