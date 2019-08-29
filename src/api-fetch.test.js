const { compileHtml } = require('./api-fetch')
const cheerio = require('cheerio')

const testData = {
	score: 8743,
	author: 'Zero_dimension98',
	created_utc: 1565417531,
	edited: false,
	body_html: `<p>Mister <span class="no-censor">Dickerson</span> Dickerson test fucking acting words are great in the morning.</p>
	<p class="no-censor">Hello fuck ign</p>`,
	id: 'ewhqfme',
	all_awardings: [],
	replies: [
		{
			score: 176,
			author: 'aciddemons',
			created_utc: 1565420786,
			edited: false,
			body_html: '<p>Excuse me while I set up a fucking shrine in my closet dedicated to you.</p>',
			id: 'ewhsx26',
			all_awardings: [],
			replies: []
		}
	]
}

let tts = compileHtml(testData)
console.log(testData.body_html)
cheerio.load