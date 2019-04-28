const env = require('../env.json')
const { synthDaniel, foulSpanDictionary } = require('./synth')
const { launchComment, launchQuestion } = require('./puppet')
const { audioVideoCombine, combineVideos } = require('./video')

const vidConfig = {
    start: 0,
    end: 100,
    sortBy: 'best',
}

const fetch = require('node-fetch')
const timeAgo = require('node-time-ago')

process.setMaxListeners(20)

const fs = require('fs')

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

let access_token

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

async function updateAuth() {
    access_token = await getAuth()
}

async function fetchComments(articleId) {
    // then(r => [r[1].data.children.slice(0, -1)])

    let parseComments = commentData => {
        return commentData[1].data.children.slice(0, -1).map(d => d.data)
    }
    let parseQuestion = commentData => {
        return commentData[0].data.children[0].data
    }

    let to = vidConfig.end

    let p = await fetch(`https://oauth.reddit.com/comments/${articleId}?sort=${vidConfig.sortBy}&depth=1&limit=100&raw_json=1`, {
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

async function renderCommentImgs(commentData, name) {
    if (!commentData) return console.error("Didnt work")
    let upvoted = Math.random() > 0.9 // 10% of the posts will randomly be seen as upvoted

    let items = {
        username: commentData.author,
        score: commentData.score,
        time: timeAgo(commentData.created_utc * 1000), // Timezones are unimportant
        edited: commentData.edited ? timeAgo(commentData.edited * 1000) : null,
        upvoted,

        silvers: commentData.gildings.gid_1,
        golds: commentData.gildings.gid_2,
        platina: commentData.gildings.gid_3,
    }

    items.score = formatNum(items.score)

    let bod = commentData.body
        .trim()
        .replace(/\[.*\]\(.*\)($|\s)/g, d => {
            let s = d.match(/(?!\[)(.*)(?=\]\(.*\)(?=$|\s))/)[0]
            return d.replace(/\[(.*)\]\(.*?\)(?=$|\s)/, s)
        })
        .replace(/&amp;#x200B;/g, '')
        .replace(/[_\\]/g, '')

    let paragraphs = bod.trim().split('\n').filter(d => d.length !== 0)

    let ps = paragraphs.map(block => {
        let reg = /(,|\.|\?|!)+( |\n)+"?/g
        let array = []
        let result
        let lastIndex = 0
        let to, from
        while ((result = reg.exec(block)) != null) {
            from = lastIndex
            to = result.index + result[0].length
            lastIndex = to
            array.push(block.slice(from, to))
        }
        array.push(block.slice(to))

        return array.filter(d => d.trim().length > 0)
    })

    let totalSections = ps.map(d => d.length).reduce((a, b) => a + b, 0)

    let vids = []

    for (let i = 0; i < totalSections; i++) {
        let counter = 0
        let tts = ""

        let formattedText = ps.map(p => {
            return p.map(str => {
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
        })

        let instanceName = name + '-' + i

        let imgPromise = launchComment(instanceName, { ...items, showBottom: i == totalSections - 1, body_html: formattedText.map(m => '<p>' + m.join('') + '</p>').join('').replace(/\*/g, '') })
        let audioPromise = synthDaniel(instanceName + '.mp3', tts)

        let v = Promise.all([imgPromise, audioPromise])
            .then(([img, audio]) => {
                return audioVideoCombine(instanceName, audio, img)
            })
            .catch(() => {
                Promise.resolve(null)
            })

        vids.push(v)
    }

    await Promise.all(vids).then(videos => {
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

async function main() {
    console.log("Started BOG")
    await updateAuth()
    console.log("AUTH completed")

    let { start, end } = vidConfig

    let thread = process.argv[2]
    if (!thread) throw new Error("Must enter a thread ID")
    thread = thread.trim()
    console.log("Fetching from thread", thread)

    let maxchars = 1250

    let [question, commentData] = await fetchComments(thread)

    let comments = commentData.filter(d => d.body.length < maxchars).slice(start)
    console.log('New filtered length:', comments.length)

    await renderQuestion(question)
    console.log("Rendered", "Q")

    for (let i = 0; i < comments.length; i++) {
        await renderCommentImgs(comments[i], i + start)
        console.log("Rendered", i + start)
    }

    console.log("Finished!")
}

main()