const fs = require("fs")
const path = require("path")
const readline = require("readline")
const { google } = require("googleapis")
const OAuth2 = google.auth.OAuth2

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
const SCOPES = [
	"https://www.googleapis.com/auth/youtube.force-ssl",
	"https://www.googleapis.com/auth/youtube",
]
const TOKEN_DIR =
	(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) +
	"/.credentials/"
const TOKEN_PATH = TOKEN_DIR + "youtube-nodejs-quickstart.json"

function authC() {
	return new Promise((res) => {
		// Load client secrets from a local file.
		fs.readFile(path.join(__dirname, "../secrets/client_secret.json", (err, content) => {
			if (err) {
				console.log("Error loading client secret file: " + err)
				return
			}
			// Authorize a client with the loaded credentials, then call the YouTube API.
			authorize(JSON.parse(content), res)
		})
	})
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
	const clientSecret = credentials.installed.client_secret
	const clientId = credentials.installed.client_id
	const redirectUrl = credentials.installed.redirect_uris[0]
	const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl)

	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, function (err, token) {
		if (err) {
			getNewToken(oauth2Client, callback)
		} else {
			oauth2Client.credentials = JSON.parse(token)
			callback(oauth2Client)
		}
	})
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: "offline",
		scope: SCOPES,
	})
	console.log("Authorize this app by visiting this url: ", authUrl)
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	})
	rl.question("Enter the code from that page here: ", function (code) {
		rl.close()
		oauth2Client.getToken(code, function (err, token) {
			if (err) {
				console.log("Error while trying to retrieve access token", err)
				return
			}
			oauth2Client.credentials = token
			storeToken(token)
			callback(oauth2Client)
		})
	})
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
	try {
		fs.mkdirSync(TOKEN_DIR)
	} catch (err) {
		if (err.code != "EEXIST") {
			throw err
		}
	}
	fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
		if (err) throw err
		console.log("Token stored to " + TOKEN_PATH)
	})
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
module.exports.getChannel = async function () {
	const auth = await authC()

	const service = google.youtube("v3")
	service.channels.list(
		{
			auth: auth,
			part: "snippet,contentDetails,statistics",
			forUsername: "Redditors",
		},
		function (err, response) {
			if (err) {
				console.log("The API returned an error: " + err)
				return
			}
			const channels = response.data.items
			if (channels.length == 0) {
				console.log("No channel found.")
			} else {
				console.log(
					"This channel's ID is %s. Its title is '%s', and " +
						"it has %s views.",
					channels[0].id,
					channels[0].snippet.title,
					channels[0].statistics.viewCount
				)
			}
		}
	)
}
/**
 *
 * @param {string} vidId Video ID
 * @param {"private"|"unlisted"|"public"} privacySetting
 */
module.exports.updatePrivacy = async (vidId, privacySetting) => {
	const auth = await authC()

	const service = google.youtube("v3")

	return await service.videos
		.update({
			auth: auth,
			part: "status",
			requestBody: {
				id: vidId,
				status: {
					privacyStatus: privacySetting,
					madeForKids: false,
				},
			},
		})
		.then((res) => {
			console.log("successfully updated vid", vidId)
			return res
		})
		.catch((err) => {
			console.error("Error on vid", vidId)
			console.error(err)
		})
}
