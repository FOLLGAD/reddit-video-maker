// ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 transition.mkv

// Outro 13.163 s
// Transition bright 0.843 s
// Transition 0.741 s
// Number of splits * X
// Number of words * Y

let outroLen = 13.163
let transitionLen = 0.741

function splitString(str) {
    return str
        .split(/<br>|(.+?[\.,?!]+["'\)\s]+)/g) // eslint-disable-line no-useless-escape
        .filter((d) => d.replace("\u200B", " ").trim().length > 0)
}

export function getFull(commentTimes) {
    let comments = commentTimes.reduce((a, b) => a + b, 0)
    return comments + outroLen + transitionLen * commentTimes.length
}

export function estimateComment(splits, words) {
    return (splits * 0.38152203637725923 + words * 0.2767486833003453) * 0.98
}

export function estimateCommentHtml(comment) {
    let noTags = comment.replace(/<.+?>/g, "").trim()
    let splits = splitString(noTags).length
    let words = noTags.replace(/<.+?>/g, "").split(/\s+/g).length
    let estimate = estimateComment(splits, words)

    return {
        words,
        splits,
        estimate,
    }
}

export function calculateCommentList(commentArr) {
    let total = []
    let recAdd = (comment) => {
        total.push(estimateCommentHtml(comment.data.body_html).estimate)

        if (Array.isArray(comment.data.replies)) {
            comment.data.replies.filter((r) => r.enabled).map(recAdd)
        }
    }
    commentArr.filter((d) => d.enabled).map(recAdd)

    return Math.round(1e2 * getFull(total)) / 1e2
}
