const tmp = require("tmp")
const cheerio = require("cheerio")
const { synthSpeech } = require("./synth")
const { launchPuppet, commentTemplate, questionTemplate } = require("./puppet")
const { combineImageAudio, simpleConcat } = require("./video")
const { compileHtml, hydrate, compileQuestion } = require("./utils")
const { fetchAboutSubreddit } = require("./reddit-api")

const vidExtension = "mp4"

async function sequentialWork(works, { voice, dsf = 2.4 }) {
    let arr = []
    for (const workObject of works) {
        const [markup, text] = workObject
        try {
            const puppet = launchPuppet(markup, dsf)
            const daniel = synthSpeech({ text, voice })
            // .then(filepath => {
            // 	// Speed up by a factor
            // 	let { name } = tmp.fileSync({ postfix: '.mp3' })
            // 	return new Promise(res => {
            // 		ffmpeg(filepath)
            // 			.audioFilter('atempo=1.15')
            // 			.output(name)
            // 			.on('end', () => res(name))
            // 			.exec()
            // 	})
            // })

            let todo = [puppet, daniel]

            let file = tmp.fileSync({ postfix: "." + vidExtension })
            let path = file.name
            let [imgPath, audioPath] = await Promise.all(todo)

            await combineImageAudio(imgPath, audioPath, path, -0.35, text)
            arr.push(path)
        } catch (e) {
            // Do nothing, skips frame
            console.log("Failed frame")
            console.error(e)
        }
    }

    if (arr.length === 0) {
        // If no part succeeded, fuck it.
        throw new Error("Comment: No segments succeeded.")
    }
    return arr
}

// Should return the path of video of the created comment
module.exports.renderComment = async function ({
    commentData,
    voice,
    commentIndex,
    callToAction,
}) {
    let rootComment = hydrate(commentData, 0.5)
    if (callToAction && commentIndex % 5 == 4) {
        // on the 5th comment and every 5 after, make a "call to action"
        rootComment.call_to_action = true // Set the parent-most comment to have a call to action
    }

    let tts = compileHtml(rootComment)
    let markup = commentTemplate(rootComment)

    let workLine = createBodyWorkLine(markup, tts)

    let videos = await sequentialWork(workLine, { voice, dsf: 3 })
    let file = tmp.fileSync({ postfix: "." + vidExtension })
    let path = file.name
    await simpleConcat(
        videos.filter((v) => v != null),
        path
    )
    return path
}

module.exports.renderQuestion = async function ({ questionData, voice }) {
    let hydrated = hydrate(questionData, 1)

    let subredditInfo = await fetchAboutSubreddit(hydrated.subreddit)

    hydrated.subredditName = hydrated.subreddit
    hydrated.subredditColor = subredditInfo.iconBg
    hydrated.subredditIcon = subredditInfo.icon

    let $_title = cheerio.load(hydrated.title)
    let titleTts = compileQuestion($_title)
    hydrated.title_html = $_title("body").html()

    let workLine = []

    let bodyTts
    if (hydrated.selftext_html) {
        let fauxComment = { body_html: hydrated.selftext_html }
        bodyTts = compileHtml(fauxComment)

        hydrated.selftext_html = fauxComment.body_html // set selftext_html as the now-updated body
    }

    let markup = questionTemplate(hydrated) // Full question html

    // Create question-title workline
    let $ = cheerio.load(markup)
    $("span.hide.question").each((i) => {
        $(`#q-${i}`).removeClass("hide")
        let toRender = $.html()

        let toSay = cheerio.load(titleTts[i]).text()

        let obj = [toRender, toSay]

        workLine.push(obj)
    })

    if (hydrated.selftext_html) {
        let newMarkup = $.html()
        // Create question-body workline
        let bodyWorks = createBodyWorkLine(newMarkup, bodyTts)
        // Mutate workLine by pushing new tts
        workLine.push(...bodyWorks)
    }

    let videos = await sequentialWork(workLine, { voice, dsf: 3 })

    let file = tmp.fileSync({ postfix: "." + vidExtension })
    await simpleConcat(
        videos.filter((v) => v != null),
        file.name
    )

    return file.name
}

// Takes in the markup of the question/comment and the tts
function createBodyWorkLine(markup, tts) {
    let $ = cheerio.load(markup)

    let workline = []

    $("span.hide.body").each((i) => {
        let curr = $(".hide.body#" + i)

        curr.removeClass("hide")
        curr.parents(".hide-until-active").removeClass("hide-until-active") // Activate parent elements

        let div_28 = curr.closest(".DIV_28")
        if (div_28.length > 0) {
            let hiddenRemaining = div_28.find("span.hide").length
            if (hiddenRemaining === 0) {
                div_28.siblings(".DIV_31").removeClass("hide-until-active")
            }
        }

        // Save a snapshot of the html where the current element has class .center-elem
        curr.addClass("center-elem")
        let html = $.html()
        curr.removeClass("center-elem")

        let toSay = cheerio.load(tts[i]).text()

        let obj = [html, toSay]

        workline.push(obj)
    })

    return workline
}
