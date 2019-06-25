// What synth will say instead
const foulDict2 = [{
	regex: /fuck/,
	replace: "f ",
}, {
	regex: /shit/,
	replace: "sh ",
}, {
	regex: /bitch/,
	replace: "b ",
}, {
	regex: /cunt/,
	replace: "c ",
}, {
	regex: /nigg(a|er)/,
	replace: "n-word",
}, {
	regex: /pornography/,
	replace: "p graphy",
}, {
	regex: /porn/,
	replace: "p rn",
}, {
	regex: /(\W|^)rape/,
	replace: "$1r e",
}, {
	regex: /(\W|^)rapist/,
	replace: "$1r pist",
}, {
	regex: /cock/,
	replace: "c k",
}, {
	regex: /whore/,
	replace: "girl",
}, {
	regex: /pussy/,
	replace: "p s y",
}, {
	regex: /dick/,
	replace: "d ",
}, {
	regex: /tits/,
	replace: "t ts",
}, {
	regex: /titties/,
	replace: "t ts",
}, {
	regex: /(\W|^)cum/,
	replace: "$1c m",
}, {
	regex: /sex/,
	replace: "s ",
}, {
	regex: /retard/,
	replace: "ree",
}, {
	regex: /damn/,
	replace: "darn",
}, {
	regex: /\.com/,
	replace: " dot com",
}, {
	regex: /(\W|^)ass(?=\W|$)/,
	replace: "$1ay",
}, {
	regex: /ass(hat|face|head|burger|hole)/,
	replace: "a-$1",
}]

// Sanitize tts text.
module.exports.sanitizeSynth = function (text) {
	text = text.replace(/([^\w\s\d])[^\w\s\d]+/g, '$1') // Turns repeated punctuation into one
	text = text.replace(/(\s|^)[^\w\d\s]+(\s|$)/g, '$1$2') // Turns ` :) `, ` " ` into `  `
	foulDict2.forEach(elem => {
		// Replaces every occurance with the the corresponding value in the dictionary
		text = text.replace(new RegExp(elem.regex, 'gi'), elem.replace)
	})
	return text
}

// What the html will display instead
const foulSpanArray = module.exports.foulSpanArray = [
	/(f)(uck)()/,
	/(sh)(it)()/,
	/(b)(it)(ch)/,
	/(c)(un)(t)/,
	/(ni)(gg)(a)/,
	/(ni)(gge)(r)/,
	/(p)(o)(rn)/,
	/((?:\W|^)a)(ss)(\W|$)/,
	/((?:\W|^)r)(ap)(e|ist)/,
	/((?:\W|^)c)(u)(m)/,
	/((?:\W|^)t)(i)(ts)/,
	/(t)(it)(ties)/,
	/(c)(o)(ck[^an])/, // doesnt match 'cockney', 'cockatrice'
	/((?:\W)d)(ic)(k)/,
	/(wh)(or)(e)/,
	/(p)(us)(sy)/,
	/(d)(a)(mn)/,
	/(s)(e)(x)/,
	/(d)(ic)(k)/,
	/(ret)(ar)(d)/,
	/(a)(ss)(hat|face|head|burger|hole)/,
]

module.exports.sanitizeHtml = function (str) {
	foulSpanArray.forEach(reg => {
		str = str.replace(new RegExp(reg, 'gi'), '$1<span class="blur">$2</span>$3')
	})
	return str
}