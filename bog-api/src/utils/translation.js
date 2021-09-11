const fetch = require("node-fetch")

const translate = (text, lang) => {
    const details = {
        text,
        auth_key: process.env.DEEPL_KEY,
        target_lang: lang,
        tag_handling: "xml",
        preserve_formatting: "1",
    }

    return fetch("https://api-free.deepl.com/v2/translate?auth_key=", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": "Reddit Video Maker",
        },
        body: new URLSearchParams(details).toString(),
    })
}

module.exports.translateText = function translateText(text, lang) {
    return translate(text, lang)
}
