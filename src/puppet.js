const puppeteer = require('puppeteer')
const handles = require('handlebars')
const fs = require('fs')

handles.registerHelper('ifgt', function (val1, val2, options) {
    if (val1 > val2) {
        return options.fn(this);
    }
});

const commentTemplate = handles.compile(fs.readFileSync('../comment.html').toString())
const questionTemplate = handles.compile(fs.readFileSync('../question.html').toString())

async function launchComment(name, { username, score, time, body_html, edited, upvoted, showBottom, golds, silvers, platina }) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.setViewport({
        width: 1600 / 2,
        height: 1080 / 2,
        deviceScaleFactor: 2,
    })

    let markup = commentTemplate({
        username,
        score,
        time,
        body_html,
        edited,
        upvoted,
        showBottom,
        golds,
        silvers,
        platina,
    })

    await page.setContent(markup);

    let filename = `${name}.png`

    let buf = await page.screenshot({ encoding: 'binary', path: `../images/${filename}` })

    await browser.close()

    return filename
}

module.exports.launchQuestion = async function launchQuestion({ username, score, time, body_html, golds, silvers, platina, comments }) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.setViewport({
        width: 1600 / 2,
        height: 1080 / 2,
        deviceScaleFactor: 2,
    })

    let markup = questionTemplate({
        username,
        score,
        time,
        body_html,
        comments,
        golds,
        silvers,
        platina,
    })

    await page.setContent(markup);

    let buf = await page.screenshot({ encoding: 'binary', path: '../images/Q.png' })
    await page.screenshot({ encoding: 'binary', path: './question.png', fullPage: true })

    await browser.close()

    // Return buffer with image
    return buf
}

module.exports.launchComment = launchComment