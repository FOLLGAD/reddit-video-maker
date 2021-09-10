import { navigate } from "@reach/router"
import React, { Component } from "react"
import { connect } from "react-redux"
import { Form, Header, Segment } from "semantic-ui-react"
import { setTitle } from "../redux/actions"

class Question extends Component {
    onSubmit = (e) => {
        e.preventDefault()

        navigate("selftext")
    }
    onChange = (e) => {
        this.props.setTitle(e.target.value)
    }
    render() {
        return (
            <Segment>
                <Form onSubmit={this.onSubmit}>
                    <Header size="large">Edit question</Header>
                    <Form.Input
                        value={this.props.title}
                        onChange={this.onChange}
                    />
                    <Form.Button primary type="submit">
                        Continue
                    </Form.Button>
                </Form>
            </Segment>
        )
    }
}

export default connect(
    (state) => ({
        title: state.question.title,
    }),
    { setTitle }
)(Question)
