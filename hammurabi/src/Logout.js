import React from 'react'
import { logout } from './api'
import { navigate } from '@reach/router'

export default class Logout extends React.Component {
    componentWillMount() {
        this.logout();
    }
    logout() {
        logout()
            .then(r => {
                navigate('/login', { replace: true })
            })
    }
    render() {
        return <></>
    }
}