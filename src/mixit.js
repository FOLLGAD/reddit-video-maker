const fs = require('fs')
const { renderFromComments, addTransitions } = require('./render')

const options = {
	theme: 'thinkingstories',
	song: 'NORMAL-POIGNANT-sincerely-by-kevin-macleod.mp3',
}

let files = fs.readdirSync('../for-compilation')
	.map(d => '../for-compilation/' + d)

renderFromComments('../video-output/Q.mkv', addTransitions(files, options), options)