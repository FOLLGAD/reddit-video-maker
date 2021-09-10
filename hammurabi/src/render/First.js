import { navigate } from "@reach/router"
import React, { Component } from "react"
import { connect } from "react-redux"
import { Button, Segment } from "semantic-ui-react"

class First extends Component {
    onSubmit = (e) => {
        navigate("/video/thread")
    }
    render() {
        return (
            <Segment>
                <Button
                    type="submit"
                    disabled={!this.props.theme}
                    onClick={this.onSubmit}
                >
                    Continue
                </Button>
            </Segment>
        )
    }
}

export default connect((state) => ({
    theme: state.theme,
}))(First)
