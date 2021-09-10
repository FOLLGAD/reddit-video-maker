require("../server/express")
let { renderFromRequest } = require("../server/utils")
let fs = require("fs")
const db = require("../server/db")

db.connect().then(async () => {
    let data = fs.readFileSync(__dirname + "/../../data.json", {
        encoding: "utf8",
    })
    let d = JSON.parse(data)

    renderFromRequest(d[0], "5d7e29d5ca695334e8e7919c")
})
