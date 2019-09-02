const { sanitizeSynth, sanitizeHtml, sanitizeUsername } = require('./sanitize')

let synthTestCases = [
	{
		in: 'fucking shit.',
		out: 'f ing sh .'
	}, {
		in: 'bitch-cunt',
		out: 'b -c '
	}, {
		in: 'nigga nigger',
		out: 'n-word n-word'
	}, {
		in: 'porn pornography',
		out: 'p rn p graphy'
	}, {
		in: 'ass-rape and rapist',
		out: 'ay-r e and r pist'
	}, {
		in: 'cock and whore',
		out: 'c k and girl'
	}, {
		in: 'dick or pussy',
		out: 'd  or p s y'
	}, {
		in: 'tits, titties and s-cum',
		out: 't ts, t ts and s-c m'
	}, {
		in: 'retard sex lol',
		out: 'ree s  lol'
	}, {
		in: 'audible.com',
		out: 'audible dot com'
	}, {
		in: 'you are ass.',
		out: 'you are ay.'
	}, {
		in: 'ass ass-lick-ass ass',
		out: 'ay ay-lick-ay ay'
	}, {
		in: 'assface asshat assumption',
		out: 'a-face a-hat assumption'
	}, {
		in: 'asshole assburgers ass-grass',
		out: 'a-hole a-burgers ay-grass'
	}, {
		in: 'asses assessment asses basses lasses',
		out: 'a-es assessment a-es basses lasses'
	},
]

test('all tts swear words', () => {
	for (let i = 0; i < synthTestCases.length; i++) {
		expect(sanitizeSynth(synthTestCases[i].in))
			.toBe(synthTestCases[i].out)
	}
})

let htmlTestCases = [
	{
		in: 'fucking shit.',
		out: 'f<span class="blur">uck</span>ing sh<span class="blur">it</span>.'
	}, {
		in: 'bitch-cunt',
		out: 'b<span class="blur">it</span>ch-c<span class="blur">un</span>t'
	}, {
		in: 'nigga nigger',
		out: 'ni<span class="blur">gg</span>a ni<span class="blur">gge</span>r'
	}, {
		in: 'porn pornography',
		out: 'p<span class="blur">o</span>rn p<span class="blur">o</span>rnography'
	}, {
		in: 'ass-rape and rapist',
		out: 'a<span class="blur">ss</span>-r<span class="blur">ap</span>e and r<span class="blur">ap</span>ist'
	}, {
		in: 'cock and whore',
		out: 'c<span class="blur">o</span>ck and wh<span class="blur">or</span>e'
	}, {
		in: 'dick or pussy',
		out: 'd<span class="blur">ic</span>k or p<span class="blur">us</span>sy'
	}, {
		in: 'tits, titties and s-cum',
		out: 't<span class="blur">i</span>ts, t<span class="blur">it</span>ties and s-c<span class="blur">u</span>m'
	}, {
		in: 'retard sex lol',
		out: 'ret<span class="blur">ar</span>d s<span class="blur">e</span>x lol'
	}, {
		in: 'you are ass.',
		out: 'you are a<span class="blur">ss</span>.'
	}, {
		in: 'ass lick-ass and ass',
		out: 'a<span class="blur">ss</span> lick-a<span class="blur">ss</span> and a<span class="blur">ss</span>'
	}, {
		in: 'assface asshat assumption',
		out: 'a<span class="blur">ss</span>face a<span class="blur">ss</span>hat assumption'
	}, {
		in: 'asshole assburgers ass-grass',
		out: 'a<span class="blur">ss</span>hole a<span class="blur">ss</span>burgers a<span class="blur">ss</span>-grass'
	}, {
		in: 'asses assessment asses basses lasses',
		out: 'a<span class="blur">ss</span>es assessment a<span class="blur">ss</span>es basses lasses'
	},
]

test('sanitize html', () => {
	for (let i = 0; i < htmlTestCases.length; i++) {
		expect(sanitizeHtml(htmlTestCases[i].in))
			.toBe(htmlTestCases[i].out)
	}
})

let usernameTestCases = [
	{
		in: 'PM_me_big_dicks_',
		out: '<span class="blur">PM_me_big_dicks_</span>'
	}, {
		in: 'bitch-cunt',
		out: '<span class="blur">bitch-cunt</span>'
	}, {
		in: 'raperrapist',
		out: '<span class="blur">raperrapist</span>'
	}, {
		in: 'innocentusername32',
		out: 'innocentusername32'
	},
]

test('sanitize username', () => {
	for (let i = 0; i < usernameTestCases.length; i++) {
		expect(sanitizeUsername(usernameTestCases[i].in))
			.toBe(usernameTestCases[i].out)
	}
})