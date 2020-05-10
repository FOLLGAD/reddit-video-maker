import React from 'react';
import { Grid, Header, Segment, Form, Comment } from 'semantic-ui-react'
import { register } from './api'
import { Link } from '@reach/router'

class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            email: "",
            password: "",
        }

        this.register = this.register.bind(this)
    }
    register() {
        register(this.state.email, this.state.password)
    }
    render() {
        return (
            <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
                <Grid.Column style={{ maxWidth: 450 }}>
                    <Header as="h2">Register</Header>
                    <Form onSubmit={this.register}>
                        <Segment>
                            <Form.Input
                                fluid
                                placeholder="Email"
                                type="email"
                                value={this.state.email}
                                onChange={d => this.setState({ email: d.target.value })}>
                            </Form.Input>
                            <Form.Input
                                fluid
                                placeholder="Password"
                                type="password"
                                value={this.state.password}
                                onChange={d => this.setState({ password: d.target.value })}>
                            </Form.Input>
                            <Form.Button
                                fluid
                                type="submit"
                                size="large"
                                color="teal">
                                Register
                            </Form.Button>
                            <Comment><Link to="/login">Log in</Link></Comment>
                        </Segment>
                    </Form>
                </Grid.Column>
            </Grid>
        )
    }
}

export default App;