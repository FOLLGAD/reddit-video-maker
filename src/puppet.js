const puppeteer = require('puppeteer'),
    handles = require('handlebars'),
    fs = require('fs')

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

    const height = await page.$eval('#DIV_1', e => e.scrollHeight)
    page.setViewport({
        width: 1600 / 2,
        height,
        deviceScaleFactor: 2,
    })

    let filename = `${name}.png`

    await page.screenshot({ encoding: 'binary', path: `../images/${filename}` })

    await browser.close()

    return filename
}

module.exports.launchQuestion = async function launchQuestion({ username, score, time, body_html, golds, silvers, platina, comments }) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()

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

    await page.setContent(markup)

    const height = await page.$eval('#DIV_1', e => e.scrollHeight)
    page.setViewport({
        width: 1600 / 2,
        height,
        deviceScaleFactor: 2,
    })

    await page.screenshot({ encoding: 'binary', path: '../images/Q.png' })

    await browser.close()

    return 'Q.png'
}

module.exports.launchComment = launchComment