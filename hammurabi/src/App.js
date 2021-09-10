import React from "react"
import { connect } from "react-redux"
import "semantic-ui-css/semantic.min.css"
import AuthedRouter from "./AuthedRouter"
import DefaultRouter from "./DefaultRouter"

class App extends React.Component {
    render() {
        return this.props.loggedIn ? <AuthedRouter /> : <DefaultRouter />
    }
}

const mapStateToProps = (state) => ({
    loggedIn: state.loggedIn,
})

export default connect(mapStateToProps)(App)
