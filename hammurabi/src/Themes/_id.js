import { navigate } from "@reach/router"
import React from "react"
import { connect } from "react-redux"
import { Container, Divider, Form, Header, Segment } from "semantic-ui-react"
import {
    deleteTheme,
    deleteThemeFile,
    editTheme,
    getTheme,
    uploadThemeFiles,
} from "../api"
import FileInput from "../FileInput"
import FrontNav from "../FrontNav"

let voices = [
    {
        value: "daniel",
        text: "Daniel UK",
    },
    {
        value: "google-us",
        text: "Google US",
    },
]

class Theme extends React.Component {
    state = {
        form: {},

        // Files
        intro: null,
        transition: null,
        outro: null,

        loading: true,

        previewSong: false,
    }
    componentDidMount() {
        getTheme(this.props.themeId).then((theme) => {
            this.setState(theme)
            this.setState({ form: theme })
        })
    }
    delete = async () => {
        await deleteTheme(this.props.themeId)
        navigate("/", { replace: true })
    }
    handleChange = (_, { name, value }) =>
        this.setState({ form: { ...this.state.form, [name]: value } })
    handleCheckboxChange = (_, { name, checked }) =>
        this.setState({ form: { ...this.state.form, [name]: checked } })
    handleFileChange = (e) => {
        e.preventDefault()
        this.setState({ [e.target.name]: e.target.files[0] })
    }
    submit = () => {
        this.setState({ loading: true })
        editTheme(this.props.themeId, this.state.form).then(async () => {
            const { intro, transition, outro } = this.state

            // If at least one file has been selected, upload it/them.
            if (intro || transition || outro) {
                const data = new FormData()

                intro && data.append("intro", intro)
                outro && data.append("outro", outro)
                transition && data.append("transition", transition)

                await uploadThemeFiles(this.props.themeId, data)

                this.setState({ loading: false })
            } else {
                this.setState({ loading: false })
            }
        })
    }
    removeFile = (type) => {
        deleteThemeFile(this.props.themeId, { [type]: true })
    }
    render() {
        return (
            <Container>
                <FrontNav />
                <Form onSubmit={(e) => e.preventDefault()}>
                    <Segment>
                        <Header>Edit theme</Header>
                        <p>
                            Themes consist of an intro, a transition, an outro,
                            and a voice. You can have several themes on one
                            account. The files can be a maximum of 25MB each.
                            All files are optional.{" "}
                        </p>
                        <p>
                            <b>
                                Important: Make sure all files are 1920x1080 in
                                size.
                            </b>
                        </p>
                        <Divider />
                        {/* <Form.Group> */}
                        <Form.Input
                            name="name"
                            type="text"
                            label="Theme name"
                            placeholder="Name"
                            value={this.state.form.name}
                            onChange={this.handleChange}
                        ></Form.Input>
                        <Form.Select
                            name="voice"
                            placeholder="Voice"
                            label="TTS voice engine"
                            value={this.state.form.voice}
                            options={voices}
                            onChange={this.handleChange}
                        ></Form.Select>
                        <Form.Input
                            name="volume"
                            type="number"
                            placeholder="Volume"
                            label="Music volume while tts is reading (in percent)"
                            min={0}
                            max={100}
                            step={1}
                            value={this.state.form.volume}
                            onChange={this.handleChange}
                        />
                        {this.props.isAdmin && (
                            <Form.Checkbox
                                name="callToAction"
                                placeholder="Call to action?"
                                label="Call to action"
                                checked={this.state.form.callToAction}
                                onChange={this.handleCheckboxChange}
                            ></Form.Checkbox>
                        )}

                        {/* </Form.Group> */}
                        <Form.Group grouped>
                            <Header>Intro</Header>
                            <Form.Field inline>
                                <FileInput
                                    accept="video/*"
                                    name="intro"
                                    buttonOnly
                                    label={
                                        this.state.intro
                                            ? "Change intro"
                                            : "No intro"
                                    }
                                    onChange={this.handleFileChange}
                                />
                                <label>
                                    {this.state.intro &&
                                        this.state.intro.origname}
                                </label>
                            </Form.Field>
                        </Form.Group>
                        <Form.Group grouped>
                            <Header>Transition</Header>
                            <Form.Field inline>
                                <FileInput
                                    accept="video/*"
                                    name="transition"
                                    buttonOnly
                                    label={
                                        this.state.transition
                                            ? "Change transition"
                                            : "No transition"
                                    }
                                    onChange={this.handleFileChange}
                                />
                                <label>
                                    {this.state.transition &&
                                        this.state.transition.origname}
                                </label>
                                {/* {this.state.transition.origname && <Button icon="trash" secondary size="mini" onClick={() => this.removeFile('transition')}></Button>} */}
                            </Form.Field>
                        </Form.Group>
                        <Form.Group grouped>
                            <Header>Outro</Header>
                            <Form.Field inline>
                                <FileInput
                                    accept="video/*"
                                    name="outro"
                                    buttonOnly
                                    label={
                                        this.state.outro
                                            ? "Change outro"
                                            : "No outro"
                                    }
                                    onChange={this.handleFileChange}
                                />
                                <label>
                                    {this.state.outro &&
                                        this.state.outro.origname}
                                </label>
                            </Form.Field>
                        </Form.Group>
                        <Divider />
                        <Form.Group inline>
                            <Form.Button
                                floated="right"
                                onClick={this.submit}
                                type="submit"
                            >
                                Save
                            </Form.Button>
                            <Form.Button
                                floated="right"
                                type="button"
                                color="red"
                                onClick={this.delete}
                            >
                                Delete
                            </Form.Button>
                        </Form.Group>
                    </Segment>
                </Form>
            </Container>
        )
    }
}

let mapStateToProps = (state, props) => ({
    theme: state.themes.find((th) => th._id === props.themeId),
    isAdmin: state.user.isAdmin,
})

export default connect(mapStateToProps)(Theme)
