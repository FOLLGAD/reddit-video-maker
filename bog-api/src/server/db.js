const mongoose = require("mongoose")

require("dotenv").config()

let connected = false

module.exports.connect = () => {
    if (connected) return Promise.resolve(mongoose)
    connected = true

    mongoose.set("useCreateIndex", true)

    return mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
}
