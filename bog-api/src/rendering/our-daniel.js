const { fileSync } = require("tmp")
const fetch = require("node-fetch")
const fs = require("fs")

const insertBreaks = (string) =>
    string
        .replace(/(\.)\B/gi, "$1$1") // Dot turn into 2 dots, because daniel reads that as a full stop
        .replace(/\n/gi, "..$1") // newline turns into ..\n

// https://stackoverflow.com/a/7918944
function encodeXML(string) {
    return string
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")
}

function insertBookmarks(array) {
    const a = []
    for (let i = 0; i < array.length; i++) {
        a.push(array[i], `<mark name="${i}" />`)
    }
    return a.join(" ")
}

const wrapStringsInDanielSSML = (string) => `
    <speak version="1.0" xmlns="https://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
        <voice name="ScanSoft Daniel_Full_22kHz">
            <prosody volume="80">${string}<break time="210ms" /></prosody>
        </voice>
    </speak>
`

// Takes an array of strings
function makeInnerSSML(strings) {
    return encodeXML(strings)
    //     let xmlEscapedAndDashed = strings.map(insertBreaks).map((s) => encodeXML(s))
    //
    //     // Add breaks before & after double quotes
    //     let xmlWithBreaks = []
    //
    //     xmlEscapedAndDashed.forEach((string, i) => {
    //         let weakBreak = `<break strength="x-weak" />`
    //         xmlWithBreaks.push(
    //             string
    //                 .replace(/\b&quot;(\s|$)/g, weakBreak + "$&")
    //                 .replace(/(\s)&quot;\b/g, "$&" + weakBreak)
    //         )
    //         if (string.startsWith("&quot;") && i > 0) {
    //             // if first character is quote... push a break onto the ending of the previous reading
    //             xmlWithBreaks[i - 1] += weakBreak
    //         }
    //     })
    //
    //     return xmlWithBreaks
}

module.exports.synthDaniel = async function synthDaniel(text) {
    const ssml = makeInnerSSML(text)

    let f = fileSync({ postfix: ".wav" })

    let data

    let tries = 0
    while (true) {
        let url = process.env.TTS_URL
        let body = JSON.stringify({
            string: wrapStringsInDanielSSML(ssml),
        })
        try {
            data = await fetch(url, {
                method: "POST",
                body: body,
                headers: {
                    "Content-Type": "application/json",
                },
            }).then((r) => r.json())

            if (!data.base64audio || data.base64audio.length === 0) {
                console.error("Got base64audio length of ZERO")
                tries++
                if (tries > 10)
                    throw new Error("Got a lot of zero-length responses")
                continue
            }

            break
        } catch (error) {
            tries++
            if (tries > 5) throw new Error("Daniel failed a lot")

            console.error(
                "Daniel failed for some reason: ",
                { url, body },
                "\nwith error:",
                error
            )
            url = "http://tts.redditvideomaker.com/synthesize"
            await new Promise((r) => setTimeout(r, 500)) // wait 500ms before retrying
        }
    }

    let { base64audio } = data

    // Save audio as binary
    fs.writeFileSync(
        f.name,
        Buffer.from(
            base64audio.replace("data:audio/wav; codecs=opus;base64,", ""),
            "base64"
        )
    )

    return { path: f.name }
}
