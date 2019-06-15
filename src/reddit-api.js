const env = require('../env.json')
const fetch = require('node-fetch')
const querystring = require('querystring')

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
	sortBy: 'best',
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

module.exports.fetchThread = async function fetchComments(threadId, options = defaultOpts) {
	let parseComments = commentData => {
		return commentData[1].data.children.slice(0, -1).map(d => d.data)
	}
	let parseQuestion = commentData => {
		return commentData[0].data.children[0].data
	}

	let query = querystring.stringify({
		api_type: 'json',
		raw_json: 1,
		sort: options.sortBy,
		limit: options.end,
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
			if (r.status >= 200 && r.status < 300) {
				return r.json()
			} else {
				console.log("Failed to fetch thread")
				throw new Error(r.status)
			}
		})

	return [parseQuestion(p), parseComments(p)]
}