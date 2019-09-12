Payment
Stripe?

Node web token for auth

# Routes
/index:
	Get simple dashboard if authed, otherwise login page.
/dashboard:
	Can create themes, edit themes, buy credits, change password.
/themes/:themeId/intro:
/themes/:themeId/transition:
/themes/:themeId/outro:
	Upload new intro/transition/outro. Checks for ownership ofc.
/themes/:themeId/style:
	Json object with lots of style options.
/sweardict/:sweardictId:
	Sweardict endpoint
/login:
	Simple login page. Reset pass as well?
/logout:
	Clear login-token.
/videos/:videoId:
	Download video. Checks for ownership as well.


Dataset

User:
`json
{
	"_id": ObjectId,
	"email": "reddit_channel@gmail.com",
	"password": "{hashed+salted pass}",
	"credits": {
		"normal": 5,
		"premium": 1
	},
	"videoCount": 12,
	"registered": Date
}
`
Theme:
`json
{
	"intro": null,
	"transition": "/path.mkv",
	"outro": "/path.mkv",
	"stylesheet": "/path.css",
	"owner": ObjectId,
	"updated": Date
}
`

Video:
`json
{
	"file": "/path.mkv",
	"owner": ObjectId,
	"theme": ObjectId,
	"created": Date,
	"expiration": Date,
	"downloads": 2
}
`

Swearword Dictionary:
`json
{
	"owner": ObjectId,
	// Todo
}
`
