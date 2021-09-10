import React from "react"
import { connect } from "react-redux"
import { Container, Divider, Icon, List, Loader } from "semantic-ui-react"
import { deleteSong, getSongs, uploadSong } from "../api"
import FileInput from "../FileInput"
import "./index.css"

class ThemesList extends React.Component {
    uploadSong = async (e) => {
        let file = e.target.files[0]
        let formData = new FormData()
        formData.append("song", file)
        await uploadSong(formData)
    }
    deleteSong = async (song) => {
        await deleteSong(song._id)
        getSongs()
    }
    handleChange = (e, { name, value }) => this.setState({ [name]: value })
    handleFileChange = (e, { name }) =>
        this.setState({ [name]: e.target.files[0] })
    componentDidMount() {
        getSongs()
    }
    render() {
        return (
            <Container textAlign="left">
                <List relaxed verticalAlign="middle">
                    {this.props.songs ? (
                        this.props.songs.map((song) => (
                            <List.Item className="song-item" key={song._id}>
                                <List.Content
                                    className="song-icon"
                                    floated="right"
                                    as="a"
                                    onClick={() => this.deleteSong(song)}
                                    title="Delete song"
                                >
                                    <Icon name="delete" />
                                </List.Content>
                                <List.Content>
                                    <List.Header>
                                        {song.file.origname}
                                    </List.Header>
                                </List.Content>
                            </List.Item>
                        ))
                    ) : (
                        <Loader active />
                    )}
                </List>
                <Divider></Divider>

                <FileInput
                    icon="music"
                    accept="audio/*"
                    buttonOnly
                    name="song"
                    label="Upload song"
                    onChange={this.uploadSong}
                />
                {/* <Popup trigger={<Button>Upload song</Button>}
                    on="click"
                    position="bottom center">
                    <Container fluid textAlign="center">
                        <Form onSubmit={this.uploadSong}>
                            <Header>Upload song</Header>
                            <Form.Input name="name" onChange={this.handleChange} placeholder="Name" />
                            <Form.Button type="submit">Upload</Form.Button>
                            <Message size="tiny" color="yellow">
                                Songs that are too short will be repeated
                            </Message>
                        </Form>
                    </Container>
                </Popup> */}
            </Container>
        )
    }
}

let mapStateToProps = (store) => {
    return {
        songs: store.songs,
    }
}

export default connect(mapStateToProps)(ThemesList)
