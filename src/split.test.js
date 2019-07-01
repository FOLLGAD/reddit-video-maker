const { splitQuestion, splitComment } = require('./split')

test('split question', () => {
	let res = splitQuestion('You have one chance. What do you do? test 123')
	let shouldBe = ['You have one chance. ', 'What do you do? ', 'test 123']
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