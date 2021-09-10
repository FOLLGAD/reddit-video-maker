import React from "react"
import { connect } from "react-redux"
import {
    Container,
    Form,
    Grid,
    Header,
    Message,
    Segment,
} from "semantic-ui-react"
import { buyCredits, checkPrice } from "../api"
import Credits from "../Credits"
import FrontNav from "../FrontNav"

let stripekey =
    process.env.NODE_ENV === "production"
        ? "pk_live_Dh8aRBNWH73HfNvlOVb4cOJE00eX9d9CAv"
        : "pk_test_L7TCDB8LinfbSK3OzvaoaXEj00z2dt6HgK"

class BuyCredits extends React.Component {
    state = {
        credits: 10,
        custom: false,
        currentPrice: null,
        stripe: null,

        timeout: null,
        perCredit: null,
    }
    handleChange = (e, { name, value }) => this.setState({ [name]: value })
    componentDidMount() {
        // getCredits()
        this.setState({ stripe: window.Stripe(stripekey) })
        this.changeQuantity(null, { value: this.state.credits })
    }
    onPurchase = async () => {
        let { session } = await buyCredits(this.state.credits)
        this.state.stripe
            .redirectToCheckout({
                sessionId: session.id,
            })
            .then((res) => {
                console.log(res)
            })
    }
    changeQuantity = (_, { value }) => {
        this.setState({ credits: value })

        if (this.state.timeout !== null) {
            clearTimeout(this.state.timeout)
        }
        let timeout = setTimeout(async () => {
            let { total } = await checkPrice(value)
            this.setState({
                currentPrice: total,
                perCredit: total / value,
                timeout: null,
            })
        }, 200)
        this.setState({ timeout })
    }
    render() {
        return (
            <Container>
                <FrontNav />
                <Credits />
                <Grid>
                    <Grid.Column>
                        <Segment>
                            <Header>Buy credits</Header>
                            <Message>
                                Credits are a one-time purchase. We do not save
                                your payment information after your purchase.
                            </Message>
                            <p>One credit can be used to create one video.</p>
                            <Form>
                                <Form.Radio
                                    name="credits"
                                    label="10 Credits"
                                    value={10}
                                    checked={this.state.credits === 10}
                                    onChange={this.changeQuantity}
                                />
                                <Form.Radio
                                    name="credits"
                                    label="25 Credits"
                                    value={25}
                                    checked={this.state.credits === 25}
                                    onChange={this.changeQuantity}
                                />
                                <Form.Radio
                                    name="credits"
                                    label="50 Credits"
                                    value={50}
                                    checked={this.state.credits === 50}
                                    onChange={this.changeQuantity}
                                />
                                <Form.Radio
                                    name="credits"
                                    label="100 Credits"
                                    value={100}
                                    checked={this.state.credits === 100}
                                    onChange={this.changeQuantity}
                                />
                                <Form.Input
                                    name="credits"
                                    label="Custom amount"
                                    value={this.state.credits}
                                    onChange={this.changeQuantity}
                                    type="number"
                                    min={1}
                                />
                                <Header>
                                    <Header.Content>
                                        €{this.state.currentPrice}
                                    </Header.Content>
                                    <Header.Subheader>
                                        €
                                        {Math.round(
                                            this.state.perCredit * 100
                                        ) / 100}
                                        /Credit
                                    </Header.Subheader>
                                </Header>
                                <Form.Button
                                    onClick={this.onPurchase}
                                    size="large"
                                >
                                    Buy
                                </Form.Button>
                            </Form>
                        </Segment>
                    </Grid.Column>
                </Grid>
            </Container>
        )
    }
}

let mapStateToProps = (store) => {
    return {
        credits: store.credits,
    }
}

export default connect(mapStateToProps)(BuyCredits)
