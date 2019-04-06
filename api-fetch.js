const env = require('../env.json')
const { synth } = require('./synth')
const { launch } = require('./puppet')

const fetch = require('node-fetch')
const timeAgo = require('node-time-ago')
const unescape = require('unescape')

let access_token

async function getAuth() {
    let response = await fetch('https://www.reddit.com/api/v1/access_token?grant_type=client_credentials', {
        headers: {
            'Authorization': `Basic ${env.Authorization}`, // Use Basic authentication
        },
        method: 'POST',
    }).then(res => res.json())
    return response.access_token
}

async function updateAuth() {
    access_token = await getAuth()
}

async function fetchComments(articleId) {
    return await fetch('https://oauth.reddit.com/r/AskReddit/comments/' + articleId, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    }).catch(console.error).then(r => r.json())
}

async function renderComment(commentData, name) {
    let upvoted = Math.random() > 0.9 // 10% of the posts will randomly be seen as upvoted

    let items = {
        username: commentData.author,
        score: commentData.score,
        body_html: unescape(commentData.body_html),
        time: timeAgo(commentData.created_utc * 1000), // Timezones are unimportant
        edited: commentData.edited ? timeAgo(commentData.edited * 1000) : null,
        gildings: commentData.gildings,
        upvoted,
    }

    let pos = 50

    // Split at every (.!?\n) or even (.!?,-)

    // items.body_html = items.body_html.slice(0,50) + '<span class="invis">' + items.body_html.slice(20) + '</span>'

    // let bodyParagraphs = commentData.body.split('\n')

    launch(items, name)
}

setInterval(updateAuth, 55 * 60 * 1000) // Update every 55 minutes (expires in 60 minutes)

async function main() {
    await updateAuth()
    fetchComments('7e8r3x')
        .then(r => r[1].data.children.slice(0, 10))
        .then(r => r.map(d => d.data))
        .then(r => r.map(renderComment))
}

main()