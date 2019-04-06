const puppeteer = require('puppeteer')
const handles = require('handlebars')
const fs = require('fs')

const template = handles.compile(fs.readFileSync('../comment.html').toString())

async function launch({ username, score, time, body_html, edited, upvoted }, name = "image") {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.setViewport({
        width: 600,
        height: 800,
        deviceScaleFactor: 2,
    })

    let markup = template({
        username,
        score,
        time,
        body_html,
        edited,
        upvoted,
    })

    await page.setContent(markup);
    await page.screenshot({ path: `../images/${name}.png`, fullPage: true })

    await browser.close()
}

module.exports.launch = launch