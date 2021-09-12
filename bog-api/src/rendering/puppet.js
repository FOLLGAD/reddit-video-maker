const puppeteer = require("puppeteer"),
    handles = require("handlebars"),
    fs = require("fs"),
    tmp = require("tmp"),
    path = require("path")

// Handlebar helper needed for inline comparisons in templates
handles.registerHelper("ifgt", function (val1, val2, options) {
    if (val1 > val2) {
        return options.fn(this)
    }
})

const questionTemplate = (module.exports.questionTemplate = handles.compile(
    fs.readFileSync(path.join(__dirname, "./html/question-v2.html")).toString()
))
const commentTemplate = (module.exports.commentTemplate = handles.compile(
    fs.readFileSync(path.join(__dirname, "./html/comment-new.html")).toString()
))

let commentPartial = fs.readFileSync(
    path.join(__dirname, "./html/comment-partial.html"),
    { encoding: "utf-8" }
)
handles.registerPartial("comment", commentPartial)

let browser

const startBrowser = async () => {
    if (!browser) {
        browser = await puppeteer.launch({
            args: ["font-render-hinting=none"],
            // executablePath: "/opt/homebrew/bin/chromium",
        })
    }
    return browser
}

module.exports.startInstance = async function startInstance() {
    await startBrowser()

    let page = await browser.newPage()
    await page.setContent(questionTemplate({}))
    await page.setContent(commentTemplate({}))
    page.close()
}

module.exports.startInstance()

// dsf = device scale factor
async function launchComment(markup, dsf) {
    await startBrowser()

    const page = await browser.newPage()

    await page.setContent(markup)

    let screenWidth = 1920 / dsf,
        screenHeight = 1080 / dsf

    await page.setViewport({
        width: screenWidth,
        height: screenHeight,
        deviceScaleFactor: dsf,
    })

    let pageHeight = await page.$eval(".main-content", (e) => e.scrollHeight) // warning: 'body' doesn't work for some reason, gives the same value almost always

    await page.setViewport({
        width: screenWidth,
        height: pageHeight,
        deviceScaleFactor: dsf,
    })

    let file = tmp.fileSync({ postfix: ".png" })
    let filepath = file.name

    if (pageHeight * dsf > 1080) {
        // Expects there to be an element with class "center-elem", which is where it will put focus.
        let focus = { y: 0, height: 0 }
        try {
            focus = await page.$eval(".center-elem", (e) => {
                let rect = e.getBoundingClientRect()
                return {
                    y: rect.y,
                    height: rect.height,
                }
            })
        } catch (err) {
            // No .center-elem exists
        }

        let topPadding = focus.y + focus.height // top padding required to focus the current element

        let yCoord =
            topPadding -
            (topPadding % (screenHeight * 0.7)) -
            screenHeight * 0.05 * dsf // "Terrace" the top padding, causing it to only move when it needs to

        // Min, x, max
        let clamp = (min, x, max) => Math.min(max, Math.max(min, x))

        let y = clamp(0, yCoord, pageHeight - screenHeight)

        await page.screenshot({
            encoding: "binary",
            path: filepath,
            type: "png",
            clip: {
                x: 0,
                y: y,
                width: screenWidth,
                height: screenHeight,
            },
        })
    } else {
        let sc = await page.screenshot({
            encoding: "binary",
            type: "png",
            clip: {
                x: 0,
                y: -(screenHeight - pageHeight) / 2, // Center on screen
                width: screenWidth,
                height: screenHeight,
            },
        })
        fs.writeFileSync(filepath, sc, "binary")
    }

    page.close()

    return filepath
}

module.exports.launchPuppet = function launch(markup, dsf = 2.4) {
    return launchComment(markup, dsf)
}
