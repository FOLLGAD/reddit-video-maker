const open = require('open')
const http = require('http')
const fs = require('fs')
const url = require('url')
const querystring = require('querystring')
const { fetchThread, updateAuth, getInfo } = require('./reddit-api')
const { render } = require('./render')
const port = 5566

let contentTypeDict = {
	"html": "text/html",
	"css": "text/css",
	"xml": "text/xml",
	"gif": "image/gif",
	"jpeg": "image/jpeg",
	"js": "application/javascript",
	"atom": "application/atom+xml",
	"rss": "application/rss+xml",
	"mml": "text/mathml",
	"txt": "text/plain",
	"jad": "text/vnd.sun.j2me.app-descriptor",
	"wml": "text/vnd.wap.wml",
	"htc": "text/x-component",
	"png": "image/png",
	"svg": "image/svg+xml",
	"tif": "image/tiff",
	"wbmp": "image/vnd.wap.wbmp",
	"webp": "image/webp",
	"ico": "image/x-icon",
	"jng": "image/x-jng",
	"bmp": "image/x-ms-bmp",
	"woff": "font/woff",
	"woff2": "font/woff2",
	"jar": "application/java-archive",
	"json": "application/json"
}

// No rendering, just web server!

// Start web server, open api.
// Open localhost:XXXX in browser, and there serve a web page which interacts with said api

updateAuth()
setInterval(() => updateAuth(), 1000 * 60 * 60) // Update access token every hour

function readJsonBody(req) {
	return new Promise((res, rej) => {
		let body = ''
		req.on('data', chunk => {
			body += chunk
		})
		req.on('end', () => {
			let json = JSON.parse(body)
			res(json)
		})
	})
}

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

	let parsedUrl = url.parse(req.url)
	let pathnames = parsedUrl.pathname.split('/').slice(1)

	if (pathnames[0] !== 'api') {
		res.setHeader('Content-Type', 'text/html')

		let togo = pathnames.join('/')
		if (togo === '') togo = 'index.html'

		let ext = togo.split('.').pop()
		if (ext && contentTypeDict[ext]) {
			res.setHeader('Content-Type', contentTypeDict[ext])
		}

		let stream = fs.createReadStream('../hammurabi-build/' + togo) // return with the url (TODO: fix obvious security issue)

		stream.pipe(res)
	} else {
		switch (pathnames[1]) {
			case 'get-thread': {
				let thread = pathnames[2]
				let data = await fetchThread(thread)

				let jso = JSON.stringify(data)

				res.end(jso)
			} break
			case 'get-info': {
				// Currently unused
				// http://localhost:8000/get-info?comments=cmnt1,cmnt2,cmnt3
				let comments = querystring.parse(parsedUrl.query).comments.split(',')
				let commentData = await getInfo(comments) // Should return an array of comment data

				res.end(JSON.stringify(commentData))
			} break
			case 'get-songs': {
				let mp3s = fs.readdirSync('../static').filter(d => d.split('.').pop() == 'mp3')
				res.end(JSON.stringify(mp3s))
			} break
			case 'render-video': {
				let body = await readJsonBody(req)
				// TODO: Bearbeta innan skicka till render, beroende på options (ta bort edits osv)

				let question = body.questionData
				let comments = body.commentData
				let { song } = body.options

				render(question, comments, song)

				res.statusCode = 201
				res.end(JSON.stringify({ message: 'Rendering' }))
			} break
			default: {
				res.statusCode = 404
				res.end(JSON.stringify({ error: 404, message: 'Wrong url bro' }))
			}
		}
	}

})

server.listen(port, () => {
	console.log('server is up!')
	open('http://localhost:' + port)
})