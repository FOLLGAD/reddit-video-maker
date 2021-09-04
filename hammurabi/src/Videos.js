import React from "react"
import { connect } from "react-redux"
import { Container, List, Loader } from "semantic-ui-react"
import { getVideos, jsonFetch } from "./api"

function formatDate(date) {
    let datePad = (date) => ("0" + date).slice(-2)
    let jsdate = new Date(date)
    return `${jsdate.getFullYear()}-${datePad(jsdate.getMonth() + 1)}-${datePad(
        jsdate.getDate()
    )} ${datePad(jsdate.getHours())}:${datePad(jsdate.getMinutes())}`
}

class VideosList extends React.Component {
    componentDidMount() {
        getVideos()
    }
    getVideos = () => {
        return isNaN(this.props.limit)
            ? this.props.videos
            : this.props.videos.slice(0, this.props.limit)
    }
    retry = async (videoId) => {
        await jsonFetch("/videos", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                rerenderVideo: videoId,
            }),
        })
        window.location.reload()
    }
    render() {
        return (
            <Container>
                <List selection>
                    {this.props.videos ? (
                        this.getVideos().map((video) => {
                            const Item = (props) =>
                                video.failed ? (
                                    <List.Item
                                        key={video._id}
                                        onClick={() => this.retry(video._id)}
                                        style={{ cursor: "pointer" }}
                                        {...props}
                                    />
                                ) : (
                                    <List.Item
                                        disabled={!video.finished}
                                        key={video._id}
                                        as="a"
                                        href={"/api/videos/" + video.file}
                                        {...props}
                                    />
                                )
                            return (
                                <Item>
                                    <List.Content>
                                        <List.Header>
                                            {video.name || "Unnamed video"}
                                        </List.Header>
                                        <List.Description>
                                            {video.failed
                                                ? "Failed rendering, click to retry"
                                                : video.finished
                                                ? formatDate(video.finished)
                                                : "Rendering..."}
                                        </List.Description>
                                    </List.Content>
                                </Item>
                            )
                        })
                    ) : (
                        <List.Item>
                            <Loader active />
                        </List.Item>
                    )}
                </List>
            </Container>
        )
    }
}

let mapStateToProps = (store) => {
    return {
        videos: store.videos,
    }
}

export default connect(mapStateToProps)(VideosList)
