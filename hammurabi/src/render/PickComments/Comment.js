import React from 'react'
import { EditorState, ContentState, convertFromHTML } from 'draft-js'
import Editor from 'draft-js-plugins-editor'
import { stateToHTML } from 'draft-js-export-html'
import { foulSpanArray } from '../sanitize'
import createLinkPlugin from 'draft-js-anchor-plugin'
import createInlineToolbarPlugin from 'draft-js-inline-toolbar-plugin'
import { ItalicButton, BoldButton, UnderlineButton } from 'draft-js-buttons'

import './Comment.css'

function handleStrategy(contentBlock, callback) {
	foulSpanArray.forEach(reg => {
		findWithRegex(new RegExp(reg, 'ig'), contentBlock, callback)
	})
}

function editStrategy(contentBlock, callback) {
	findWithRegex(/(?:^|\W)edit/img, contentBlock, callback)
}

let handleSpan = props => {
	return <span className="highlight-danger">{props.children}</span>
}

let editSpan = props => {
	return <span className="highlight-warn">{props.children}</span>
}

function findWithRegex(regex, contentBlock, callback) {
	const text = contentBlock.getText()
	let matchArr, start
	while ((matchArr = regex.exec(text)) !== null) {
		start = matchArr.index
		callback(start, start + matchArr[0].length)
	}
}

let decorators = [
	{
		strategy: handleStrategy,
		component: handleSpan,
	},
	{
		strategy: editStrategy,
		component: editSpan,
	},
]

class Comment extends React.Component {
	constructor(p) {
		super(p)

		this.inlineToolbarPlugin = createInlineToolbarPlugin()
		this.linkPlugin = createLinkPlugin()
		this.plugins = [
			this.inlineToolbarPlugin,
			this.linkPlugin,
		]

		let d = convertFromHTML(p.comment.data.body_html)
		this.state = { editor: EditorState.createWithContent(ContentState.createFromBlockArray(d.contentBlocks, d.entityMap)) }
	}
	handlePress(e) {
		e.stopPropagation()
	}
	propagateHtmlChange = () => {
		let html = stateToHTML(this.state.editor.getCurrentContent())

		this.props.comment.data.body_html = html

		this.props.onChange()
	}
	onBlur = e => {
		this.propagateHtmlChange()
	}
	onStateChange = editor => this.setState({ editor })
	propagateEnableChange = () => {
		this.props.comment.enabled = !this.props.comment.enabled
		this.props.onChange()
	}
	componentWillUnmount() {
		this.propagateHtmlChange()
	}
	render() {
		let { comment, onChange } = this.props

		return (
			<div className="Comment">
				<input className="left-box" type="checkbox" checked={comment.enabled} onChange={this.propagateEnableChange} />
				<div onKeyDown={this.handlePress}>
					<div onClick={this.propagateEnableChange}>
						<span style={{ color: "blue", marginRight: 5 }}>{comment.data.author}</span>
						<span>{comment.data.score >= 1e3 ? Math.round(comment.data.score / 1e2) / 1e1 + 'k' : comment.data.score} points</span>
						<span>
							{comment.data.all_awardings.map(award => <span key={award.count + award.icon_url}><img src={award.icon_url} alt="award" width={16} />{award.count > 1 && award.count}</span>)}
						</span>
					</div>
					<Editor
						editorState={this.state.editor}
						onChange={this.onStateChange}
						onBlur={this.onBlur}
						decorators={decorators}
						plugins={this.plugins}
					/>
					<this.inlineToolbarPlugin.InlineToolbar>
						{extProps => <>
							<BoldButton {...extProps} />
							<ItalicButton {...extProps} />
							<UnderlineButton {...extProps} />
							<this.linkPlugin.LinkButton {...extProps} />
						</>}
					</this.inlineToolbarPlugin.InlineToolbar>
					{Array.isArray(comment.data.replies) && comment.data.replies.map(d => <Comment key={d.data.id} comment={d} onChange={onChange} />)}
				</div>
			</div>
		)
	}
}

export default Comment;