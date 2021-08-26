let { connect } = require("../server/db")
let { User } = require("../server/models")

let email = process.argv[2]
let password = process.argv[3]

connect().then(async (conn) => {
    await User.create({
        email,
        password,
        isAdmin: true,
    })
    conn.disconnect()
})
