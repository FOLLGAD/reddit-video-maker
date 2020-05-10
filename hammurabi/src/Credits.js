import React from 'react'
import { connect } from 'react-redux'
import { Header, Segment, Loader } from 'semantic-ui-react'
import { getCredits } from './api'

class Credits extends React.Component {
    handleChange = (e, { name, value }) => this.setState({ [name]: value })
    componentDidMount() {
        getCredits()
    }
    render() {
        return (
            <Segment textAlign="center" secondary>
                <Header size="huge">
                    <Header.Subheader>Your Credits</Header.Subheader>
                    <Header.Content>
                        {this.props.credits != null ?
                            this.props.credits :
                            <Loader active />}
                    </Header.Content>
                </Header>
            </Segment>
        )
    }
}

let mapStateToProps = store => {
    return {
        credits: store.credits,
    }
}

export default connect(mapStateToProps)(Credits);