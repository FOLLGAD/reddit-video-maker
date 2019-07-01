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
	regex: /\.com/,
	replace: " dot com",
}, {
	regex: /(?:\W|^)asses(?!\w)/,
	replace: "ay",
}, {
	regex: /(\W|^)ass(?=\W|$)/,
	replace: "$1ay",
}, {
	regex: /ass(hat|face|head|burger|hole)/,
	replace: "a-$1",
}, {
	regex: /penis/,
	replace: "peepee",
}, {
	regex: /vagina/,
	replace: "vajayjay",
}]

// Sanitize tts text.
module.exports.sanitizeSynth = function (text) {
	text = text.replace(/&/g, ' and ') // '&' doesn't work for Daniel, he says &amp instead
	text = text.replace('\n', '').trim()
	text = text.replace(/([^\w\s\d])[^\w\s\d]+/g, '$1') // Turns repeated punctuation into one
	text = text.replace(/(\s|^)[^\w\d\s]+(\s|$)/g, '$1$2') // Turns ` :) `, ` " ` into `  `
	foulDict2.forEach(elem => {
		// Replaces every occurance with the the corresponding value in the dictionary
		text = text.replace(new RegExp(elem.regex, 'gmi'), elem.replace)
	})
	return text
}

// What the html will display instead
const foulSpanArray = [
	/(f)(uck)()/,
	/(sh)(it)()/,
	/(b)(it)(ch)/,
	/(c)(un)(t)/,
	/(ni)(gg)(a)/,
	/(ni)(gge)(r)/,
	/(p)(o)(rn)/,
	/((?:\W|^)d)(ic)(k)/,
	/((?:\W|^)a)(ss)(es)(?!\w)/,
	/((?:\W|^)a)(ss)(\W|$)/,
	/((?:\W|^)r)(ap)(e|ist)/,
	/((?:\W|^)c)(u)(m)/,
	/((?:\W|^)t)(i)(ts)/,
	/(t)(it)(ties)/,
	/(c)(o)(ck[^an])/, // doesnt match 'cockney', 'cockatrice'
	/(wh)(or)(e)/,
	/(p)(us)(sy)/,
	/(s)(e)(x)/,
	/(d)(ic)(k)/,
	/(ret)(ar)(d)/,
	/(a)(ss)(hat|face|head|burger|hole)/,
	/((?:\W|^)a)(n)(al[^y])/,
	/(pe)(n)(is)/,
	/(va)(gi)(na)/,
]

module.exports.sanitizeHtml = function (str) {
	foulSpanArray.forEach(reg => {
		str = str.replace(new RegExp(reg, 'gmi'), '$1<span class="blur">$2</span>$3')
	})
	return str
}

const sanitizeUsenameArray = [
	/(a)(ss)()/, // HAS TO BE FIRST
	...foulSpanArray,
	/(d)(ic)(k)/,
	/(r)(ap)(e|ist)/,
	/(c)(u)(m)/,
	/(t)(i)(ts)/,
	/(a)(n)(al)/,
]

module.exports.sanitizeUsername = function (username) {
	sanitizeUsenameArray.forEach(reg => {
		username = username.replace(new RegExp(reg, 'gi'), '$1<span class="blur">$2</span>$3')
	})
	return username
}