import React from 'react';
import { connect } from 'react-redux'
import { Container, Segment, Header } from 'semantic-ui-react';
import FrontNav from './FrontNav';

class Account extends React.Component {
	handleChange = (e, { name, value }) => this.setState({ [name]: value })
	render() {
		return (
			<Container>
				<FrontNav />
				<Segment>
					<Header>Contact us</Header>
                    <p>For support, bug reports or business proposals, don't hesitate contacting us at <a href="mailto:support@redditvideomaker.com">support@redditvideomaker.com</a></p>
				</Segment>
			</Container>
		)
	}
}

const mapStateToProps = state => ({
	user: state.user,
})

export default connect(mapStateToProps)(Account)