import React from "react"
import { connect } from "react-redux"
import { Container, Form, Segment, Header, Message } from "semantic-ui-react"
import FrontNav from "./FrontNav"
import { changePassword } from "./api"
import { toast } from "react-toastify"

class Account extends React.Component {
    handleChange = (e, { name, value }) => this.setState({ [name]: value })
    state = {
        current: "",
        password: "",
        passwordConfirm: "",
        changedPass: false,
        loading: false,
    }
    changePass = async () => {
        this.setState({ loading: true })
        await changePassword(this.state.current, this.state.password).catch(
            (err) => {
                toast.error("Something went wrong")
            }
        )
        this.setState({ changePass: true, loading: false })
    }
    render() {
        let inputerror =
            this.state.passwordConfirm.length > 0 &&
            this.state.password !== this.state.passwordConfirm
        return (
            <Container>
                <FrontNav />
                <Segment>
                    <Header>Change password</Header>
                    {this.state.changedPass ? (
                        <p>Password updated!</p>
                    ) : (
                        <Form onSubmit={this.changePass}>
                            <Form.Input
                                label="Email"
                                name="email"
                                value={this.props.user.email}
                                disabled
                            />
                            {this.props.user.username && (
                                <Form.Input
                                    label="Username"
                                    name="username"
                                    value={this.props.user.username}
                                    disabled
                                />
                            )}
                            <Form.Input
                                placeholder="Current password"
                                label="Current password"
                                name="current"
                                type="password"
                                onChange={this.handleChange}
                                required
                            />
                            <Form.Input
                                placeholder="New password"
                                label="New password"
                                name="password"
                                type="password"
                                onChange={this.handleChange}
                                required
                            />
                            <Form.Input
                                placeholder="Confirm password"
                                label="Confirm password"
                                name="passwordConfirm"
                                type="password"
                                onChange={this.handleChange}
                                required
                            />
                            {inputerror && (
                                <Message negative>
                                    Passwords do not match
                                </Message>
                            )}
                            <Form.Button
                                primary
                                type="submit"
                                disabled={
                                    !this.state.current ||
                                    !this.state.passwordConfirm ||
                                    inputerror
                                }
                            >
                                Change password
                            </Form.Button>
                        </Form>
                    )}
                </Segment>
            </Container>
        )
    }
}

const mapStateToProps = (state) => ({
    user: state.user,
})

export default connect(mapStateToProps)(Account)
