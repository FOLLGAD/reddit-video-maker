const { fetchSubreddit, updateAuth, fetchThread } = require("./reddit-api")
const { foulSpanArray } = require("./sanitize")

let options = {
    filterEdits: false,
    skipQuestion: false,
    start: 0,
    end: 100,
    sortBy: "top",
    t: "week", // one of (hour, day, week, month, year, all)
}

function countOccurances(regs, text) {
    let c = 0
    regs.forEach((reg) => {
        for (var rWord = new RegExp(reg, "gmi"); rWord.test(text); c++);
    })
    return c
}

updateAuth().then(() => {
    fetchSubreddit("askreddit", options).then(async (data) => {
        // console.log(data.data.children.map(d => d.data))
        let d = data.data.children
            .map((d) => d.data)
            .map((d) => {
                return {
                    comments: d.num_comments,
                    scorePerComment: d.score / d.num_comments,
                    score: d.score,
                    title: d.title,
                    gilded: d.gilded,
                    id: d.id,
                }
            })
            .slice(0, 20)
        let promises = []

        d.forEach((thread) => {
            let p = fetchThread(thread.id)
            promises.push(p)
        })

        let threads = (await Promise.all(promises)).map((d) => d[1]) // Wait for all to finish & extract into an array of comment-arrays

        let bodies = threads
            .slice(0, 20)
            .map((thread) => thread.map((d) => d.body))

        d.forEach(
            (e, i) =>
                (e.averageCommentLength =
                    bodies[i].reduce((a, c) => a + c.length, 0) / 20)
        )

        d.forEach((e, i) => {
            let totalSwears = bodies[i].reduce((acc, bod) => {
                let r = countOccurances(foulSpanArray, bod)
                return acc + r
            }, 0)
            e.averageBadWords = totalSwears / 20
        })
        d.sort((d, a) =>
            d.averageCommentLength > a.averageCommentLength ? 1 : -1
        )
        console.log(d)
    })
})
