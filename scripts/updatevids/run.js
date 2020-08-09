const fs = require("fs/promises")
const { updatePrivacy } = require("../update-privacy.js")

fs.readFile(__dirname + "/data.txt", { encoding: "utf-8" }).then(
	async (data) => {
		const vals = data.split("\n")

		for (const val of vals) await updatePrivacy(val, "public")

		console.log("Finished!")
	}
)
