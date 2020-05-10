import React from 'react'
import { Link } from '@reach/router'
import { connect } from 'react-redux'
import { Menu, Dropdown } from 'semantic-ui-react'

class FrontNav extends React.Component {
    render() {
        return (
            <Menu>
                <Menu.Item header>Reddit Video Maker</Menu.Item>
                <Menu.Item as={Link} to="/">Dashboard</Menu.Item>
                <Menu.Item as={Link} to="/support">Contact us</Menu.Item>
                <Menu.Menu position="right">
                    <Dropdown item text="Account">
                        <Dropdown.Menu>
                            <Dropdown.Item as={Link} to="/account">My Account</Dropdown.Item>
                            {this.props.user.isAdmin && <Dropdown.Item as={Link} to="/admin">Admin</Dropdown.Item>}
                            <Dropdown.Item as={Link} to="/logout">Log out</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Menu.Menu>
            </Menu>
        )
    }
}

let mapStateToProps = state => ({
    user: state.user,
})

export default connect(mapStateToProps)(FrontNav);