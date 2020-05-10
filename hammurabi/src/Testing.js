import React from 'react';
import { Container, Form, Message, Segment } from 'semantic-ui-react';
import { _postRender } from './api';

class Testing extends React.Component {
    state = { text: "", message: null }
    onChange = (_, { name, value }) => this.setState({ [name]: value })
    sendRender = () => {
        let json = JSON.parse(this.state.text) // Parse the text as json
        _postRender(json) // Send it to render
            .then(() => {
                this.setState({ message: "Rendering..." })
            })
    }
    render() {
        return (
            <Container>
                <Segment>
                    <Form>
                        <Form.TextArea value={this.state.text} name="text" onChange={this.onChange} />
                        <Form.Button onClick={this.sendRender}>Render</Form.Button>
                        {this.state.message && <Message>{this.state.message}</Message>}
                    </Form>
                </Segment>
            </Container>
        )
    }
}

export default Testing