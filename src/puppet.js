const puppeteer = require('puppeteer'),
	handles = require('handlebars'),
	fs = require('fs')

handles.registerHelper('ifgt', function (val1, val2, options) {
	if (val1 > val2) {
		return options.fn(this);
	}
})

handles.registerPartial('comment', `
<div class="DIV_1 hide-until-active">
	<div class="DIV_2">
		<div class="DIV_3">
			<div class="DIV_4">
				<div class="DIV_5">
					<i class="I_6 dark-mode-thread"></i>
				</div>
			</div>
		</div>
		<div class="DIV_7">
		<!-- Upvote/downvote -->
		<div class="DIV_8">
			<button class="BUTTON_UPVOTE">
				<div class="DIV_UPVOTE">
					<i class="I_UPVOTE {{#if upvoted}}is_upvoted{{/if}}"></i>
				</div>
			</button>
			<button class="BUTTON_12">
				<div class="DIV_13">
					<i class="I_14"></i>
				</div>
			</button>
		</div>
		<!-- Body -->
		<div class="DIV_15">
			<div class="DIV_17 dark-mode-meta">
				<div class="DIV_18">
					<a href="/user/bdkrzy" class="A_19 dark-mode-user">{{ author }}</a>
					<div class="DIV_20">
					</div>
				</div><span class="SPAN_21">{{ score }} points</span> <span class="SPAN_22">·</span> <a
					href="/r/AskReddit/comments/ba30oe/whats_a_video_game_you_dislike_that_everybody/ek8p9mu/"
					class="A_23" rel="nofollow"><span class="SPAN_24">{{ created }}</span></a>{{#if edited}} <span
						class="SPAN_25">·</span>
				<span class="SPAN_26">edited {{ edited }}</span>{{/if}}
			<div class="DIV_27">
				</div>
				<div class="DIV_GILDS">
					{{#if silvers}}
				<span class="SPAN_SILVER">
					<i class="I_SILVER">
						<img src="https://www.redditstatic.com/desktop2x/img/gold/badges/award-silver-cartoon.png"
							class="IMG_SILVER" alt='' />
					</i>
					{{#ifgt silvers 1}}
						{{ silvers }}
					{{/ ifgt}}
				</span>
					{{/if}}
				{{#if golds}}
				<span class="SPAN_GOLD">
					<i class="I_GOLD">
						<img src="https://www.redditstatic.com/desktop2x/img/gold/badges/award-gold-cartoon.png"
							class="IMG_GOLD" alt='' />
					</i>
					{{#ifgt golds 1}}
						{{ golds }}
					{{/ ifgt}}
				</span>
				{{/if}}
				{{#if platina}}
				<span class="SPAN_GOLD">
						<i class="I_GOLD">
							<img src="https://www.redditstatic.com/desktop2x/img/gold/badges/award-platinum-cartoon.png"
								class="IMG_GOLD" alt='' />
						</i>
						{{#ifgt platina 1}}
					{{ golds }}
						{{/ ifgt}}
				</span>
					{{/if}}
			</div>
			</div>
			<div class="DIV_28">
				<div class="DIV_29 dark-mode-text">
					{{{body_html}}}
				</div>
			</div>
			<div class="DIV_31 dark-mode-bottom hide-until-active">
					<button class="BUTTON_32" style="display: inline-block;">
						<i class="I_33"></i>Reply
				</button>
					<div class="DIV_34">
						<button class="BUTTON_35">
							Give Award
					</button>
					</div>
					<div class="DIV_34">
						<button class="BUTTON_35">
							Share
					</button>
					</div>
					<button class="BUTTON_36">
						Report
				</button>
					<button class="BUTTON_37">
						Save
				</button>
			</div>
			{{#each replies as |reply|}}
				{{> comment reply}}
			{{/ each}}
		</div>
		</div>
	</div>
</div>
`)

const commentTemplate = module.exports.commentTemplate = handles.compile(fs.readFileSync('../html/comment-new.html').toString())
const questionTemplate = module.exports.questionTemplate = handles.compile(fs.readFileSync('../html/question.html').toString())

async function launchComment(name, markup) {
	const browser = await puppeteer.launch({
		args: [
			'font-render-hinting=none'
		]
	})
	const page = await browser.newPage()
	const filename = `${name}.png`

	await page.setContent(markup);

	let dsf = 2.4
	page.setViewport({
		width: 1920 / dsf,
		height: 1080 / dsf,
		deviceScaleFactor: dsf,
	})

	const height = await page.$eval('.DIV_1', e => e.scrollHeight) // warning: 'body' doesn't work for some reason, gives the same value almost always

	if (height * dsf > 1080) {
		// Crash
		console.error("Too tall:", calcHeight)
		throw new Error("Comment output image was too tall.")
	}

	page.setViewport({
		width: 1920 / dsf,
		height: height,
		deviceScaleFactor: dsf,
	})

	await page.screenshot({ encoding: 'binary', path: `../images/${filename}` })
	await browser.close()

	return filename
}

async function launchQuestion(name, context) {
	const browser = await puppeteer.launch()
	const page = await browser.newPage()
	const filename = `${name}.png`

	let markup = questionTemplate(context)

	await page.setContent(markup)

	page.setViewport({
		width: 1920 / 3,
		height: 1080,
		deviceScaleFactor: 3,
	})

	const height = await page.$eval('#DIV_1', e => e.scrollHeight)

	page.setViewport({
		width: 1920 / 3,
		height: height,
		deviceScaleFactor: 3,
	})

	await page.screenshot({ encoding: 'binary', path: `../images/${filename}` })
	await browser.close()

	return filename
}

module.exports.launch = function launch(name, type, context) {
	if (type == 'question') {
		return launchQuestion(name, context)
	}
	return launchComment(name, context)
}