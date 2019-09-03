const open = require('open')
const http = require('http')
const fs = require('fs')
const url = require('url')
const querystring = require('querystring')
const { fetchThread, updateAuth, getInfo } = require('./reddit-api')
const { render } = require('./render')
const port = 5566
const path = require('path')
const { getBestName, readJsonBody, getFolderNames } = require('./utils')
const contentTypes = require('./content-types.json')

const outputDir = path.join(__dirname, '../video-output/') // Where all final videos go

http.ServerResponse.prototype.endJson = function (data, ...args) {
	return this.end(JSON.stringify(data), ...args)
}


// No rendering, just web server!

// Start web server, open api.
// Open localhost:XXXX in browser, and there serve a web page which interacts with said api

updateAuth()
setInterval(() => updateAuth(), 1000 * 60 * 60) // Update access token every hour

const server = http.createServer(async (req, res) => {
	// PREFLIGHT CORS FIX
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
	if (req.method === 'OPTIONS') {
		res.writeHead(200);
		res.end();
		return;
	}

	res.setHeader('Content-Type', 'application/json')

	res.statusCode = 200

	let parsedUrl = url.parse(req.url, true)
	let pathnames = parsedUrl.pathname.split('/').slice(1)
	let query = parsedUrl.query

	if (pathnames[0] !== 'api') {
		res.setHeader('Content-Type', 'text/html')

		let togo = pathnames.join('/')
		if (togo === '') togo = 'index.html'

		let ext = togo.split('.').pop()
		if (ext && contentTypes[ext]) {
			res.setHeader('Content-Type', contentTypes[ext]) // Set the appropriate response header
		}

		let stream = fs.createReadStream(path.join(__dirname, '../hammurabi-build/', togo)) // return with the url (TODO: fix obvious security issue)

		stream.pipe(res)
	} else {
		switch (pathnames[1]) {
			case 'get-last-edit': {
				try {
					let editJson = require('./render-data.log.json')
					let str = JSON.stringify(editJson)
					res.endJson(str)
				} catch (err) {
					res.statusCode = 400
					res.endJson({
						error: 400,
						message: `Couldn't fetch edit`,
					})
				}
			} break
			case 'get-thread': {
				let thread = pathnames[2]

				let options = {
					filterEdits: false,
					skipQuestion: false,
					sort: query.sort || 'best',
				}

				fetchThread(thread, options)
					.catch(err => {
						res.statusCode = 404
						res.endJson({
							error: 404,
							message: `Couldn't fetch thread`,
						})
					})
					.then(data => {
						res.endJson(data)
					})
			} break
			case 'get-info': {
				// Currently unused
				// http://localhost:8000/get-info?comments=cmnt1,cmnt2,cmnt3
				let comments = querystring.parse(parsedUrl.query).comments.split(',')
				let commentData = await getInfo(comments) // Should return an array of comment data

				res.endJson(commentData)
			} break
			case 'get-themes': {
				let themes = getFolderNames(path.join(__dirname, '../themes'))
					.map(name => ({ name: name }))

				let data = themes.map(th => {
					let mp3s = fs.readdirSync(path.join(__dirname, '../themes/', th.name))
						.filter(d => d.split('.').pop() == 'mp3')
					return {
						name: th.name,
						songs: mp3s,
					}
				})

				res.endJson(data)
			} break
			case 'render-video': {
				let body = await readJsonBody(req)
				// TODO: Bearbeta innan skicka till render, beroende på options (ta bort edits osv)

				fs.writeFile(path.join(__dirname, './render-data.log.json'), JSON.stringify(body, null, '\t'), () => { })

				let question = body.questionData
				let comments = body.commentData
				let options = body.options

				options.theme = Object.assign({}, require(path.join(__dirname, `../themes/${options.theme}/settings.json`)), { name: options.theme })

				if (!options.theme) console.error("No theme selected")
				if (!options.song) console.error("No song selected")

				// let vidTitle = question.id
				let vidTitle = "video"

				options.outPath = () => getBestName(vidTitle + '.mkv', outputDir)

				render(question, comments, options)

				res.statusCode = 201
				res.endJson({ message: 'Rendering' })
			} break
			case 'render-last': {
				const { questionData, commentData, options } = require('./render-data.log.json')

				if (!options.theme) console.error("No theme selected")
				if (!options.song) console.error("No song selected")

				options.outputName = questionData.id

				render(questionData, commentData, options)
			} break
			default: {
				res.statusCode = 404
				res.endJson({ error: 404, message: 'Wrong url bro' })
			}
		}
	}

})

server.listen(port, () => {
	console.log('Project BOG started')
	open('http://localhost:' + port)
})