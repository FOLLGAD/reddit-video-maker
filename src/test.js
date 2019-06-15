const { fetchThread, updateAuth, getInfo } = require('./reddit-api')

updateAuth().then(() => {
	// fetchThread('bxgldm').then(vals => {
	// 	console.log(vals[1][0].replies.data.children[0])
	// })
	getInfo([ 'eqavep5', 'eq8e8to', 'er0cfgv', 'eqiel6c', 'eqovthl', 'eq9khx4' ])
})