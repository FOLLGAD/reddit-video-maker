import { navigate } from '@reach/router'
import React from 'react'
import { connect } from 'react-redux'
import { Divider, Form, Icon, Message, Segment } from 'semantic-ui-react'
import { getThread } from '../api'
import { setComments, setQuestion, resetVideoState } from '../redux/actions'
import Settings from './Settings'

class Thread extends React.Component {
	state = {
		input: '',
		sort: 'top',
		loading: null,
		error: null,
	}
	componentWillMount() {
		this.props.resetVideoState()
	}
	fetchThread = (thread, sort) => {
		this.setState({ error: null, loading: true })

		getThread(thread, sort)
			.then(() => {
				this.setState({ loading: false })
				navigate('/video/post')
			})
			.catch(err => {
				this.setState({ error: err, loading: false })
			})
	}
	onSubmit = e => {
		e.preventDefault()

		let thread = this.state.input

		if (thread.indexOf('comments') !== -1) {
			let pattern = /\/comments\/([\w]+)/
			let match = thread.match(pattern)

			if (match) {
				thread = match[1]
			}
		}

		let onlythread = thread.replace(/[^\w\d]/g, '')

		this.fetchThread(onlythread, this.state.sort)
	}
	handle = (e, { name, value }) => this.setState({ [name]: value })
	render() {
		let sortOptions = [
			{ text: 'Top', value: 'top' },
			{ text: 'Best', value: 'best' },
			{ text: 'New', value: 'new' },
		]
		return (
			<Segment>
				<Settings />
				<Divider />
				<Form onSubmit={this.onSubmit}>
					<Form.Input label="Thread" required value={this.state.input} onChange={this.handle} name="input" placeholder="Type a reddit thread ID or paste its URL" autoFocus />
					<Form.Select label="Sort by" required value={this.state.sort} onChange={this.handle} name="sort" options={sortOptions} />
					<Form.Button primary loading={this.state.loading} disabled={!this.props.theme || !this.state.input}>OK<Icon name="angle right" /></Form.Button>
					{this.state.error && <Message negative>{this.state.error}</Message>}
				</Form>
			</Segment>
		)
	}
}

export default connect(state => ({
	theme: state.theme,
}), {
	setComments,
	setQuestion,
	resetVideoState,
})(Thread);