const handles = require('handlebars')
const timeAgo = require('node-time-ago')
const fs = require('fs')
const { updateAuth, fetchThread } = require('./reddit-api')
const { renderComment } = require('./api-fetch')

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
				{{#if showBottom}}
			<div class="DIV_31 dark-mode-bottom">
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
				{{ else}}
				<div class="DIV_31 hide">
					<button class="BUTTON_32">
						<i class="I_33"></i>Reply
				</button>
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
				{{/if}}
			{{#each replies as |reply|}}
				{{> comment reply}}
			{{/ each}}
		</div>
		</div>
	</div>
</div>
`)

let commentTemplate = handles.compile(fs.readFileSync('../html/comment-new.html').toString())

function formatNum(num) {
	let d = parseInt(num)
	if (num >= 1000) {
		return Math.round(num / 100) / 10 + 'k'
	}
	return d
}

let hydrate = comment => {
	comment.score = formatNum(comment.score)
	comment.created = timeAgo(comment.created_utc * 1000)
	if (comment.edited) {
		comment.edited = timeAgo(comment.edited * 1000)
	}
	if (comment.num_comments) {
		comment.num_comments = formatNum(comment.num_comments)
	}
	comment.silvers = comment.gildings.gid_1
	comment.golds = comment.gildings.gid_2
	comment.platina = comment.gildings.gid_3
	if (comment.replies) {
		comment.replies = comment.replies.slice(0, 1).map(hydrate)
	}
	comment.showBottom = true
	return comment
}

async function test() {
	await updateAuth()

	let [question, comments] = await fetchThread('c21myf')
	let comment = comments[1]
	comment.replies = comment.replies.slice(0, 1)

	console.log(comment)

	renderComment(comment, 'test-lol')

	// let markup = commentTemplate(comment)
	// fs.writeFileSync('./testcomment.html', markup)
}

test()