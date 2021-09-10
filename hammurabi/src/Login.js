import React from "react"
import { Grid, Header, Segment, Form, Message } from "semantic-ui-react"
import { authorize } from "./api"
import { Link, redirectTo } from "@reach/router"

class App extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            email: "",
            password: "",
            error: null,
            loading: false,
        }

        this.login = this.login.bind(this)
    }
    login() {
        this.setState({ error: null, loading: true })
        authorize(this.state.email, this.state.password)
            .catch((err) => {
                this.setState({ loading: false })
                if (typeof err === "string") {
                    this.setState({ error: err })
                } else {
                    console.error(err)
                }
            })
            .then((d) => {
                redirectTo("/dashboard")
            })
    }
    render() {
        return (
            <Grid
                textAlign="center"
                style={{ height: "100vh" }}
                verticalAlign="middle"
            >
                <Grid.Column style={{ maxWidth: 450 }}>
                    <Header as="h2">Log in</Header>
                    <Form onSubmit={this.login}>
                        <Segment>
                            <Form.Input
                                fluid
                                placeholder="Email or username"
                                disabled={this.state.loading}
                                type="text"
                                value={this.state.email}
                                onChange={(d) =>
                                    this.setState({ email: d.target.value })
                                }
                            ></Form.Input>
                            <Form.Input
                                fluid
                                placeholder="Password"
                                disabled={this.state.loading}
                                type="password"
                                value={this.state.password}
                                onChange={(d) =>
                                    this.setState({ password: d.target.value })
                                }
                            ></Form.Input>
                            <Form.Button
                                fluid
                                type="submit"
                                size="large"
                                disabled={this.state.loading}
                                color="teal"
                            >
                                Log in
                            </Form.Button>
                            <div>
                                <Link to="/register">Register</Link>
                            </div>
                        </Segment>
                    </Form>
                    <Message size="small">Forgot password?</Message>
                    {this.state.error && (
                        <Message error>{this.state.error}</Message>
                    )}
                </Grid.Column>
            </Grid>
        )
    }
}

export default App
