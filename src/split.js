function splitComment(str) {
	return str
		.split(/<br>|(.+?[.,?!]+[^\w\s]*\s+)/g)
		.filter(d => d.replace('\u200B', ' ').trim().length > 0)
}

function splitQuestion(str) {
	return str
		.split(/(.+?[^\w\s]+\s+)/g)
		.filter(d => d.replace('\u200B', ' ').trim().length > 0)
}

module.exports.splitComment = splitComment
module.exports.splitQuestion = splitQuestion