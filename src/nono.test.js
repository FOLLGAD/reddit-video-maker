const { sanitizeSynth } = require('./nono')

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
	},
]

test('all swear words', () => {
	for (let i = 0; i < synthTestCases.length; i++) {
		expect(sanitizeSynth(synthTestCases[i].in))
			.toBe(synthTestCases[i].out)
	}
})