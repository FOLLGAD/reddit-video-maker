import { Redirect, Router } from '@reach/router';
import React from 'react';
import { connect } from 'react-redux';
import 'semantic-ui-css/semantic.min.css';
import BuyCredits from './BuyCredits';
import Dashboard from './Dashboard/index';
import Logout from './Logout';
import App from './render/App';
import Testing from './Testing';
import ThemeEdit from './Themes/_id';
import { getUser } from './api';
import Admin from './Admin'
import Account from './Account'
import Support from './Support'

const NotFound = ({ redirect = "/" }) => <Redirect noThrow from="*" to={redirect} />

const AdminPath = props => <div>{props.children}</div>

class AuthedRouter extends React.Component {
    componentWillMount() {
        getUser()
    }
    render() {
        return (
                <Router>
                    <Dashboard path="/" />
                    <Support path="/support" />
                    <BuyCredits path="/buy-credits" />
                    <App path="/video/*" />
                    <ThemeEdit path="/themes/:themeId" />
                    <Logout path="/logout" />
                    <Account path="/account" />
                    <AdminPath path="/admin">
                        <Admin path="/" />
                    </AdminPath>
                    <NotFound default />
                </Router>
        )
    }
}

const mapStateToProps = state => ({
    user: state.user,
})

export default connect(mapStateToProps)(AuthedRouter)