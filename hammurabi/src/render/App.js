import { Link, Redirect, Router } from "@reach/router"
import "draft-js-inline-toolbar-plugin/lib/plugin.css"
import React, { Component } from "react"
import { connect } from "react-redux"
import { Button, Container, Header } from "semantic-ui-react"
import { getSongs, getThemes } from "../api"
import SelectThread from "./ChooseThread"
import Final from "./Final"
import Navbar from "./Navbar"
import PickComments from "./PickComments/index"
import Question from "./Question"
import SelfText from "./SelfText"

class App extends Component {
    constructor(props) {
        super(props)

        this.beforeUnload = this.beforeUnload.bind(this)
    }
    componentDidMount() {
        getThemes()
        getSongs()
        window.addEventListener("beforeunload", this.beforeUnload)
    }
    componentWillUnmount() {
        window.removeEventListener("beforeunload", this.beforeUnload)
    }
    beforeUnload(e) {
        if (this.props.question) {
            e.preventDefault()
        }
    }
    render() {
        return (
            <Container>
                <div style={{ display: "flex", alignItems: "center" }}>
                    <Header style={{ paddingTop: 10 }} as="h1">
                        <Header.Content>Reddit Video Maker</Header.Content>
                        <Header.Subheader>Create video</Header.Subheader>
                    </Header>
                    <Button style={{ marginLeft: 20 }} basic as={Link} to="/">
                        Go back
                    </Button>
                </div>
                <Router>
                    <Navbar path="/">
                        <SelectThread path="/" />
                        {/* Can't have fragments in Router element */}
                        {this.props.question && <Question path="post" />}
                        {this.props.question && <SelfText path="selftext" />}
                        {this.props.question && (
                            <PickComments path="comments" />
                        )}
                        {this.props.question && <Final path="final" />}
                        <Redirect default from="*" to="/video/" noThrow />
                    </Navbar>
                </Router>
            </Container>
        )
    }
}

let mapStateToProps = (store) => {
    return {
        question: store.question,
    }
}

export default connect(mapStateToProps)(App)
