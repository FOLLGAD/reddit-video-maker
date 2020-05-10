import { Link } from '@reach/router'
import React from 'react'
import { Button, Container, Divider, Grid, Header, Segment } from 'semantic-ui-react'
import Credits from '../Credits'
import FrontNav from '../FrontNav'
import UserList from './UserList'

class Dashboard extends React.Component {
	render() {
		return (
			<Container>
				<FrontNav />
				<Header textAlign="center" as="h1">Admin Dashboard</Header>
				<Grid stackable>
					<Grid.Column width={8}>
						<Divider horizontal>Credits</Divider>
						<Segment>
							<Credits />
							<Button as={Link} to="/buy-credits">Buy credits</Button>
						</Segment>
					</Grid.Column>
					<Grid.Column width={8}>
						<Divider horizontal>Users</Divider>
						<Segment>
							<UserList />
						</Segment>
					</Grid.Column>
				</Grid>
			</Container>
		)
	}
}

export default Dashboard