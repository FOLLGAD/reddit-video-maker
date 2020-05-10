const { splitQuestion, splitComment, compileHtml } = require('./utils')

test('split question', () => {
	let res = splitQuestion('You have one chance. What do you do? test 123')
	// let shouldBe = ['You have one chance. ', 'What do you do? ', 'test 123']
	let shouldBe = ['You have one chance. What do you do? test 123']
	res.forEach((v, i) => {
		expect(v)
			.toBe(shouldBe[i])
	})
})

test('split comment', () => {
	let res = splitComment('I was in juvenile detention for a few weeks when I was 14, I had a third degree "misdemeanor." "It" was basically just jail (but for "teenagers".). The only major difference I can think of is that we mostly had our own cells. I came out suicidal and would get panic attacks for years at the smallest things that reminded me of the place.')
	let shouldBe = ['I was in juvenile detention for a few weeks when I was 14, ',
		'I had a third degree "misdemeanor." ',
		'"It" was basically just jail (but for "teenagers".). ',
		'The only major difference I can think of is that we mostly had our own cells. ',
		'I came out suicidal and would get panic attacks for years at the smallest things that reminded me of the place.']

	res.forEach((v, i) => {
		expect(v)
			.toBe(shouldBe[i])
	})
})

let compileData1 = {
	"body_html": "<p>I have an aunt that <strong>faked having <i><span class='no-censor'>fuck</span> cer</i> hey my.</strong> for 10 years so she could use her fundraising money for drugs. She’s now in prison for credit card fraud and possession</p>",
	"replies": [
		{
			"body_html": "<p>I also have an aunt who faked this weird \"illness\" last year and started a go fund me account and raised like 15K. It was so bizarre. My family distanced ourselves from her years prior. I saw on social media that she was raising money and even had this whole long video made about it. Now she has this weird life coaching \"business\" and sales a bunch of garbage. Her bio on all her social media etc. has these really gross over exaggerations and flat out lies about her life and experiences as a \"business\" woman. Her kids who are in their 20s believe it all and actively help her.</p>",
			"replies": []
		}
	]
}

let compileData2 = {
	"body_html": "<p>my gf is related to a <em>tattoo</em> <strong>artist</strong> she calls Uncle <strong>Spider</strong>. he sleeps in a coffin.</p>",
	"replies": [
		{
			"body_html": "<p>I want to meet this uncle spider</p>",
			"replies": []
		}
	]
}
let correctData2 = {
	tts: ["my gf is related to a tattoo artist she calls Uncle Spider ", "he sleeps in a coffin.", "I want to meet this uncle spider"],
	html: {
		body_html: `<p class="text"><span id="0" class="hide">my gf is related to a <em>tattoo</em> <strong>artist</strong> she calls Uncle <strong>Spider</strong>. </span><span id="1" class="hide">he sleeps in a coffin.</span></p>`
	}
}

// TODO: Write tests
// test('compile with space between tags', () => {
// 	let res = compileHtml(compileData2)
// 	cheerio.load(compileData2.body_html)
// })



// let tts = module.exports.compileHtml(inobj)

// console.log(inobj.body_html)
// console.log(tts)
