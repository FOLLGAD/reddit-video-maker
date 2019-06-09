const puppeteer = require('puppeteer'),
    handles = require('handlebars'),
    fs = require('fs')

handles.registerHelper('ifgt', function (val1, val2, options) {
    if (val1 > val2) {
        return options.fn(this);
    }
});

const commentTemplate = handles.compile(fs.readFileSync('../html/comment.html').toString())
const questionTemplate = handles.compile(fs.readFileSync('../html/question.html').toString())

module.exports.launchComment = async function launchComment(name, { username, score, time, body_html, edited, upvoted, showBottom, golds, silvers, platina }) {
    const browser = await puppeteer.launch({
        args: [
            'font-render-hinting=none'
        ]
    })
    const page = await browser.newPage()
    const filename = `${name}.png`

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
        width: 1920 / 2.4,
        height: height + 15,
        deviceScaleFactor: 2.4,
    })

    await page.screenshot({ encoding: 'binary', path: `../images/${filename}` })
    await browser.close()

    return filename
}

module.exports.launchQuestion = async function launchQuestion(name, { username, score, time, body_html, golds, silvers, platina, comments }) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    const filename = `${name}.png`

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
        width: 1920 / 3,
        height: height + 15,
        deviceScaleFactor: 3,
    })

    await page.screenshot({ encoding: 'binary', path: `../images/${filename}` })
    await browser.close()

    return filename
}