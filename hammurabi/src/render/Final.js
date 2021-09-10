import React, { Component } from "react"
import { Button, Divider, Segment } from "semantic-ui-react"
import { postRender } from "../api"
import Settings from "./Settings"

class Final extends Component {
    state = { loading: false, done: false }
    send = async () => {
        this.setState({ loading: true, done: false })
        await postRender()
        this.setState({ loading: false, done: true })
    }
    render() {
        return (
            <Segment>
                {this.state.done ? (
                    <p>The video is now rendering.</p>
                ) : (
                    <>
                        <p>
                            Change settings if needed and then send to render
                            video.
                        </p>
                        <Settings />
                        <Divider />
                        <Button
                            primary
                            size="large"
                            loading={this.state.loading}
                            onClick={this.send}
                        >
                            Render
                        </Button>
                    </>
                )}
            </Segment>
        )
    }
}

export default Final
