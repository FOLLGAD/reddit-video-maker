const querystring = require('querystring')
const fetch = require('node-fetch')
const env = require('../env.json')

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
module.exports.updateAuth = async function updateAuth() {
	access_token = await getAuth()
}

let defaultOpts = {
	filterEdits: false,
	skipQuestion: false,
	start: 0,
	end: 100,
	sort: 'best',
	t: 'day', // one of (hour, day, week, month, year, all)
}

module.exports.fetchSubreddit = function (subreddit, options = defaultOpts) {
	let query = querystring.stringify({
		api_type: 'json',
		raw_json: 1,
		sort: options.sortBy,
		limit: options.end,
		t: options.t,
		depth: 2,
		context: 2,
		showmore: true,
		threaded: true,
	})
	
	console.log(options.sortBy)

	return fetch(`https://oauth.reddit.com/r/${subreddit}/${options.sortBy}?${query}`, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		}
	}).then(r => {
		return r.json()
	})
}

// An array of all comments of which you want data
module.exports.getInfo = async function getInfo(children) {
	let data = {
		api_type: 'json',
		raw_json: 1,
		id: children.map(d => 't1_' + d).join(','),
	}
	let query = querystring.stringify(data)

	let p = await fetch(`https://oauth.reddit.com/api/info.json?${query}`, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		}
	}).then(r => {
		return r.json()
	})

	return p.data.children
}

module.exports.fetchThread = async function (threadId, options = defaultOpts) {
	let parseComments = commentData => {
		return commentData[1].data.children.slice(0, -1)
	}
	let parseQuestion = commentData => {
		return commentData[0].data.children[0].data
	}

	let query = querystring.stringify({
		api_type: 'json',
		raw_json: 1,
		sort: options.sort,
		limit: options.end,
		t: options.t,
		depth: 2,
		context: 2,
		showmore: true,
		threaded: true,
	})

	let p = await fetch(`https://oauth.reddit.com/comments/${threadId}?${query}`, {
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	})
		.catch(console.error)
		.then(r => {
			if (r.ok) {
				return r.json()
			} else {
				console.log("Failed to fetch thread")
				return Promise.reject(r)
			}
		})

	let extractComment = commD => {
		let comm = commD.data
		return {
			score: comm.score,
			author: comm.author,
			created_utc: comm.created_utc,
			edited: comm.edited,
			body_html: comm.body_html,
			body: comm.body,
			id: comm.id,
			all_awardings: comm.all_awardings,

			replies: comm.replies && comm.replies.data && comm.replies.data.children.slice(0, -1).map(extractComment),
		}
	}

	let extractQuestion = question => {
		return {
			score: question.score,
			author: question.author,
			created_utc: question.created_utc,
			num_comments: question.num_comments,
			all_awardings: question.all_awardings,
			title: question.title,
			id: question.id,
			nsfw: question.thumbnail === 'nsfw',
			flair: {
				text: question.link_flair_text || null,
				bgColor: question.link_flair_background_color,
			},
		}
	}

	let parsedC = parseComments(p).map(extractComment)
	let parsedQ = extractQuestion(parseQuestion(p))

	return { questionData: parsedQ, commentData: parsedC }
}