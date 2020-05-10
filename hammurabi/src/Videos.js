import React from 'react'
import { connect } from 'react-redux'
import { Container, List, Loader } from 'semantic-ui-react'
import { getVideos } from './api'

function formatDate(date) {
    let datePad = date => ("0" + date).slice(-2)
    let jsdate = new Date(date)
    return `${jsdate.getFullYear()}-${datePad(jsdate.getMonth() + 1)}-${datePad(jsdate.getDate())} ${datePad(jsdate.getHours())}:${datePad(jsdate.getMinutes())}`
}

class VideosList extends React.Component {
    componentDidMount() {
        getVideos()
    }
    getVideos = () => {
        return isNaN(this.props.limit) ? this.props.videos : this.props.videos.slice(0, this.props.limit)
    }
    render() {
        return (
            <Container>
                <List selection>
                    {this.props.videos ? this.getVideos().map(video => {
                        return (
                            <List.Item disabled={!video.finished || video.failed} key={video._id} as="a" href={"/api/videos/" + video.file}>
                                <List.Content>
                                    <List.Header>{video.name || "Unnamed video"}</List.Header>
                                    {video.failed ? "Failed rendering" : (video.finished ? formatDate(video.finished) : "Rendering...")}
                                </List.Content>
                            </List.Item>
                        )
                    }) : <List.Item><Loader active /></List.Item>}
                </List>
            </Container>
        )
    }
}

let mapStateToProps = store => {
    return {
        videos: store.videos,
    }
}

export default connect(mapStateToProps)(VideosList);