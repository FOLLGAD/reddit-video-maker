const fetch = require("node-fetch")

const translate = (text, lang) => {
    const details = {
        text,
        auth_key: process.env.DEEPL_KEY,
        target_lang: lang,
    }

    let formBody = []
    for (const property in details) {
        const encodedValue = encodeURIComponent(details[property])
        formBody.push(property + "=" + encodedValue)
    }
    formBody = formBody.join("&")
    return fetch("https://api-free.deepl.com/v2/translate?auth_key=", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": "Reddit Video Maker",
        },
        body: formBody,
    })
}

module.exports.translateText = function translateText(text, lang) {
    return translate(text, lang)
}
