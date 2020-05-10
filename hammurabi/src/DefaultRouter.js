import { Redirect, Router } from '@reach/router';
import React from 'react';
import { connect } from 'react-redux';
import 'semantic-ui-css/semantic.min.css';
import Login from './Login';
import Register from './Register';

const NotFoundLogin = ({ redirect = "/login" }) => <Redirect noThrow from="*" to={redirect} />

class BogRouter extends React.Component {
    render() {
        return (
            <Router>
                <Register path="/register" />
                <Login path="/login" />
                <NotFoundLogin default />
            </Router>
        )
    }
}

const mapStateToProps = state => ({
    loggedIn: state.loggedIn,
})

export default connect(mapStateToProps)(BogRouter)