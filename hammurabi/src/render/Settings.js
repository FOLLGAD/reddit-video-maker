import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Form } from 'semantic-ui-react';
import { setSong, setTheme } from '../redux/actions';

class Settings extends Component {
	handleTheme = (e, { value }) => {
		this.props.setTheme(value)
	}
	handleSong = (e, { value }) => {
		this.props.setSong(value)
	}
	render() {
		let themeOptions = this.props.themes.map(theme => ({ value: theme._id, key: theme._id, text: theme.name }))
		let songOptions = this.props.songs.map(song => ({ value: song._id, key: song._id, text: song.file.origname }))
		songOptions.unshift({ value: null, key: "", text: "No song" })

		return (
			<Form onSubmit={this.props.onSubmit}>
				<Form.Select
					label="Theme"
					required
					placeholder="Select a theme"
					value={this.props.theme}
					name="theme"
					options={themeOptions}
					onChange={this.handleTheme}
				/>
				<Form.Select
					label="Song"
					clearable
					placeholder="No song"
					value={this.props.song}
					name="song"
					options={songOptions}
					onChange={this.handleSong}
				/>
			</Form>
		)
	}
}

export default connect(state => ({
	theme: state.theme,
	song: state.song,
	themes: state.themes,
	songs: state.songs,
}), { setTheme, setSong })(Settings);