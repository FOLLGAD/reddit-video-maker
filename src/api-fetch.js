const env = require('../env.json')
const fetch = require('node-fetch')
const timeAgo = require('node-time-ago')
const fs = require('fs')
const cheerio = require('cheerio')
const { synthDaniel, foulSpanDictionary } = require('./synth')
const { launchComment, launchQuestion } = require('./puppet')
const { audioVideoCombine, combineVideos, copyVideo } = require('./video')

process.setMaxListeners(20)

const vidConfig = {
	start: 0,
	end: 100,
	sortBy: 'best',
}

let arr = [
	'../static',
	'../audio-output',
	'../for-compilation',
	'../images',
	'../video-output',
	'../video-temp',
	'../videolists',
	'../out',
]
arr.forEach(pth => {
	if (!fs.existsSync(pth)) {
		fs.mkdirSync(pth)
	}
})

// Fetch the auth token from reddit using credentials in .env
async function getAuth() {
	let response = await fetch('https://www.reddit.com/api/v1/access_token?grant_type=client_credentials', {
		headers: {
			'Authorization': `Basic ${env.Authorization}`, // Use Basic authentication
		},
		method: 'POST',
	})
		.then(res => res.json())
		.catch(console.error)
	return response.access_token
}

let access_token
async function updateAuth() {
	access_token = await getAuth()
}


async function fetchComments(articleId, options) {
	let parseComments = commentData => {
		return commentData[1].data.children.slice(0, -1).map(d => d.data)
	}
	let parseQuestion = commentData => {
		return commentData[0].data.children[0].data
	}

	let p = await fetch(`https://oauth.reddit.com/comments/${articleId}?sort=${options.sortBy}&depth=1&limit=${options.end}&raw_json=1`, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.catch(console.error)
		.then(r => {
			return r.json()
		})

	let totalComments = parseComments(p)

	return [parseQuestion(p), totalComments]
}

let sanitizeHtml = str => {
	for (key in foulSpanDictionary) {
		str = str.replace(new RegExp(key, 'gi'), foulSpanDictionary[key])
	}
	return str
}

function splitString(str) {
	return str
		.split(/(.+?[\.,?!]+["'\)\s]+)/g)
		.filter(d => d.replace('\u200B', ' ').trim().length > 0)
}

async function renderCommentImgs(commentData, name) {
	let items = {
		upvoted: Math.random() > 0.9, // 10% of the posts will randomly be seen as upvoted
		score: formatNum(commentData.score),
		username: commentData.author,
		time: timeAgo(commentData.created_utc * 1000), // Timezones are unimportant
		edited: commentData.edited ? timeAgo(commentData.edited * 1000) : null,
		silvers: commentData.gildings.gid_1,
		golds: commentData.gildings.gid_2,
		platina: commentData.gildings.gid_3,
		body: commentData.body_html,
	}

	let $ = cheerio.load(items.body)

	$('p').addClass('text')

	// Removes .text class from all <p> with <li> children
	$('p li').parent('p').removeClass('text')

	let id = 0,
		tts = []
	$('p.text,li').each((_, e) => {
		let lastWasTag = false

		let arr = [],
			contents = $(e).contents()

		// Splits string on punctuation
		for (let i = 0; i < contents.length; i++) {
			let h = contents[i]
			if (h.type == 'text') {
				let data = splitString(h.data)
				if (lastWasTag) {
					arr[arr.length - 1] += data.shift()
				}
				lastWasTag = false

				arr.push(...data)
			} else {
				lastWasTag = true
				let text = cheerio.load(h).html()
				if (text.indexOf('.') !== -1) lastWasTag = false
				arr[arr.length - 1] += text
			}
		}
		tts.push(...arr)
		let html = arr.map(d => `<span id="${id++}" class="hide">${d}</span>`).map(sanitizeHtml).join('')

		$(e).html(html)
	})

	let vids = []
	let ln = $('span.hide').length

	$('span.hide').each((i, _) => {
		$('.hide#' + i).removeClass('hide')
		let toRender = $.html()

		let instanceName = name + '-' + i
		let imgPromise = launchComment(instanceName, { ...items, body_html: toRender, showBottom: i == ln - 1 })
		let audioPromise = synthDaniel(instanceName + '.mp3', cheerio.load(tts[i]).text())

		let v = new Promise((res) => {
			Promise.all([imgPromise, audioPromise])
				.then(([img, audio]) => {
					res(audioVideoCombine(instanceName, audio, img))
				})
				.catch(() => {
					// Daniel probably fucked up
					// Therefore, omit the frame by returning null.
					res(null)
				})
		})
		vids.push(v)
	})

	await Promise.all(vids)
		.then(videos => {
			combineVideos(videos.filter(v => v != null), name)
		})
}

function renderQuestion(questionData) {
	let items = {
		username: questionData.author,
		score: formatNum(questionData.score),
		time: timeAgo(questionData.created_utc * 1000), // Timezones are unimportant
		comments: formatNum(questionData.num_comments),

		body_html: questionData.title,

		silvers: questionData.gildings.gid_1,
		golds: questionData.gildings.gid_2,
		platina: questionData.gildings.gid_3,
	}
	let body = items.body_html

	let reg = /(,|\.|\?|!)+( |\n)+/g
	let array = []
	let result
	let lastIndex = 0
	let to, from
	while ((result = reg.exec(body)) != null) {
		from = lastIndex
		to = result.index + result[0].length
		lastIndex = to
		array.push(body.slice(from, to))
	}
	array.push(body.slice(to))

	let vids = []

	let name = 'Q'

	for (let i = 0; i < array.length; i++) {
		let counter = 0
		let tts = ""

		let formattedText = array.map(str => {
			if (counter == i) {
				tts = str
			}
			if (counter++ > i) {
				return hideSpan(str)
			} else {
				for (key in foulSpanDictionary) {
					str = str.replace(new RegExp(key, 'gi'), foulSpanDictionary[key])
				}
				return str
			}
		})

		let instanceName = name + '-' + i

		let imgPromise = launchQuestion(instanceName, { ...items, body_html: formattedText.join("") })
		let audioPromise = synthDaniel(instanceName + '.mp3', tts)

		let v = Promise.all([imgPromise, audioPromise])
			.then(([img, audio]) => {
				return audioVideoCombine(instanceName, audio, img)
			})
		vids.push(v)
	}

	return Promise.all(vids)
		.then(videos => combineVideos(videos, name))
		.then(() => {
			copyVideo('../video-output/Q.mkv', '../Q.mp4')
		})
}

function hideSpan(str) {
	return '<span class="invis">' + str + '</span>'
}

function formatNum(num) {
	let d = parseInt(num)
	if (num >= 1000) {
		return Math.round(num / 100) / 10 + 'k'
	}
	return d
}

setInterval(updateAuth, 55 * 60 * 1000) // Update every 55 minutes (expires in 60 minutes)

function getOptions(optionsArray) {
	optsArray = optionsArray.slice()

	let opts = {
		filterEdits: false,
		start: vidConfig.start,
		end: vidConfig.end,
		sortBy: vidConfig.sortBy,
	}

	editsInd = optionsArray.indexOf('-x') != -1
	if (editsInd) {
		opts.filterEdits = true
		optsArray.splice(editsInd, 1)
	}

	startInd = optionsArray.indexOf('-start')
	if (startInd != -1) {
		opts.start = Number(optionsArray[startInd+1])
		optsArray.splice(startInd, 2)
	}

	endInd = optionsArray.indexOf('-end')
	if (endInd != -1) {
		opts.end = Number(optionsArray[endInd+1])
		optsArray.splice(endInd, 2)
	}

	sortInd = optionsArray.indexOf('-sort')
	if (sortInd != -1) {
		opts.sortBy = optionsArray[sortInd+1]
		optsArray.splice(sortInd, 2)
	}

	opts.thread = optsArray[0]

	return opts
}

async function main() {
	console.log("Started BOG")
	await updateAuth()
	console.log("AUTH completed")

	let options = getOptions(process.argv.slice(2))

	let thread = process.argv[2]
	if (!thread) throw new Error("Must enter a thread ID")
	thread = thread.trim()
	console.log("Fetching from thread", thread)

	let [question, commentData] = await fetchComments(thread, options)

	let maxchars = 1250

	let comments = commentData.filter(d => d.body.length < maxchars && d.body != '[deleted]' && d.body != '[removed]').slice(options.start)

	if (options.filterEdits) {
		let reg = /^edit/im
		comments = comments.filter(d => {
			return !reg.test(d.body)
		})
	}
	console.log('Comments fetched:', comments.length)

	await renderQuestion(question)
	console.log("Rendered", "Q")

	for (let i = 0; i < comments.length; i++) {
		await renderCommentImgs(comments[i], i + options.start)
		console.log("Rendered", i + options.start)
	}

	console.log("Finished!")
}

main()
