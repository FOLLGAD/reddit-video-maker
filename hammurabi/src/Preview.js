import React from "react"
import { connect } from "react-redux"
import { Form, Header } from "semantic-ui-react"
import { longPollVideo, postPreview, getVideos } from "./api"
import { toast } from "react-toastify"

class Preview extends React.Component {
    handleChange = (e, { name, value }) => this.setState({ [name]: value })
    state = {
        song: null,
        theme: null,
        rendering: false,
    }
    preview = () => {
        this.setState({ rendering: true })

        postPreview(this.state.theme, this.state.song)
            .then((res) => {
                getVideos()
                return longPollVideo(res.file)
            })
            .then((res) => {
                toast.info("Preview is ready", {
                    onClick: () => window.open(res.url, "_blank"),
                })
            })
    }
    render() {
        let songOptions = this.props.songs.map((song) => ({
            value: song._id,
            key: song._id,
            text: song.file.origname,
        }))
        let themeOptions = this.props.themes.map((theme) => ({
            value: theme._id,
            key: theme._id,
            text: theme.name,
        }))
        songOptions.unshift({ value: null, key: "", text: "No song" })
        return (
            <Form>
                <Header>Preview</Header>
                <p>
                    You can render a preview of a theme and song. It will take
                    about 20 seconds to render, and will not cost any credits.
                    It will show up in your videos.{" "}
                </p>
                <Form.Select
                    label="Theme"
                    required
                    disabled={this.state.rendering}
                    placeholder="Select a theme"
                    value={this.props.theme}
                    name="theme"
                    options={themeOptions}
                    onChange={this.handleChange}
                />
                <Form.Select
                    label="Song"
                    clearable
                    disabled={this.state.rendering}
                    placeholder="No song"
                    value={this.props.song}
                    name="song"
                    options={songOptions}
                    onChange={this.handleChange}
                />
                <Form.Button
                    disabled={this.state.rendering || !this.state.theme}
                    onClick={this.preview}
                >
                    Preview
                </Form.Button>
            </Form>
        )
    }
}

let mapStateToProps = (state) => ({
    songs: state.songs,
    themes: state.themes,
})

export default connect(mapStateToProps)(Preview)
