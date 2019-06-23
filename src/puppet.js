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

async function launchComment(name, markup) {
	const browser = await puppeteer.launch({
		args: [
			'font-render-hinting=none'
		]
	})
	const page = await browser.newPage()
	const filename = `${name}.png`

	await page.setContent(markup);

	let dsf = 2.4
	page.setViewport({
		width: 1920 / dsf,
		height: 1080 / dsf,
		deviceScaleFactor: dsf,
	})

	const height = await page.$eval('.DIV_1', e => e.scrollHeight) // warning: 'body' doesn't work for some reason, gives the same value almost always

	if (height * dsf > 1080) {
		// Crash
		console.error("Too tall:", height * dsf)
		throw new Error("Comment output image was too tall.")
	}

	page.setViewport({
		width: 1920 / dsf,
		height: height,
		deviceScaleFactor: dsf,
	})

	await page.screenshot({ encoding: 'binary', path: `../images/${filename}` })
	await browser.close()

	return filename
}

async function launchQuestion(name, context) {
	const browser = await puppeteer.launch()
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
	await browser.close()

	return filename
}

module.exports.launch = function launch(name, type, context) {
	if (type == 'question') {
		return launchQuestion(name, context)
	}
	return launchComment(name, context)
}