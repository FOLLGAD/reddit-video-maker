import React, { Component } from 'react'
import { CardElement, injectStripe } from 'react-stripe-elements'
import { Form, Header, Segment } from 'semantic-ui-react'

class StripeInput extends Component {
    state = {
        error: null,
    }
    submit = async ev => {
        let { token, error } = await this.props.stripe.createToken({ name: "Name" })
        this.setState({ error: null })

        if (error) {
            console.error(error)
            this.setState({ error })
        } else {
            this.props.onPurchase(token)
        }
    }
    render() {
        return (
            <Form onSubmit={this.submit}>
                <Segment raised>
                    <CardElement id="card-element" />
                </Segment>
                {this.state.error && <Header style={{ marginTop: 15 }} color="red" size="small">{this.state.error.message}</Header>}
                <Form.Button>Proceed</Form.Button>
            </Form>
        )
    }
}

export default injectStripe(StripeInput)