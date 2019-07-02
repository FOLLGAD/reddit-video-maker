const puppeteer = require('puppeteer'),
	handles = require('handlebars'),
	fs = require('fs')

handles.registerHelper('ifgt', function (val1, val2, options) {
	if (val1 > val2) {
		return options.fn(this);
	}
})

let commentPartial = fs.readFileSync('../html/comment-partial.html', { encoding: 'utf-8' })

handles.registerPartial('comment', commentPartial)

const commentTemplate = module.exports.commentTemplate = handles.compile(fs.readFileSync('../html/comment-new.html').toString())
const questionTemplate = module.exports.questionTemplate = handles.compile(fs.readFileSync('../html/question.html').toString())

let browser

module.exports.startInstance = async function startInstance() {
	console.log('Starting puppeteer instance')
	browser = await puppeteer.launch({
		args: [
			'font-render-hinting=none'
		]
	})
	
	return
}

module.exports.startInstance()

async function launchComment(name, markup) {
	const page = await browser.newPage()
	const filename = `${name}.png`

	await page.setContent(markup);

	let dsf = 2.4
	page.setViewport({
		width: 1920 / dsf,
		height: 1080 / dsf,
		deviceScaleFactor: dsf,
	})

	let height = await page.$eval('.DIV_1', e => e.scrollHeight) // warning: 'body' doesn't work for some reason, gives the same value almost always

	page.setViewport({
		width: 1920 / dsf,
		height: height,
		deviceScaleFactor: dsf,
	})

	await page.screenshot({
		encoding: 'binary', path: `../images/${filename}`,
	})
	page.close()

	return filename
}

async function launchQuestion(name, context) {
	const page = await browser.newPage()
	const filename = `${name}.png`

	let markup = questionTemplate(context)

	await page.setContent(markup)

	page.setViewport({
		width: 1920 / 3,
		height: 1080,
		deviceScaleFactor: 3,
	})

	const height = await page.$eval('#DIV_1', e => e.scrollHeight)

	page.setViewport({
		width: 1920 / 3,
		height: height,
		deviceScaleFactor: 3,
	})

	await page.screenshot({ encoding: 'binary', path: `../images/${filename}` })
	page.close()

	return filename
}

module.exports.launch = function launch(name, type, context) {
	if (type == 'question') {
		return launchQuestion(name, context)
	}
	return launchComment(name, context)
}