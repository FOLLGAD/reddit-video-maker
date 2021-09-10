import { Link } from "@reach/router"
import React from "react"
import {
    Button,
    Container,
    Divider,
    Grid,
    Header,
    Segment,
} from "semantic-ui-react"
import Songs from "../Songs"
import Themes from "../Themes/index"
import Videos from "../Videos"
import Credits from "../Credits"
import FrontNav from "../FrontNav"
import Preview from "../Preview"

class Dashboard extends React.Component {
    render() {
        return (
            <Container>
                <FrontNav />
                <Header textAlign="center" as="h1">
                    Dashboard
                </Header>
                <Grid stackable>
                    <Grid.Column width={8}>
                        <Divider horizontal>Credits</Divider>
                        <Segment>
                            <Credits />
                            <Button as={Link} to="/buy-credits">
                                Get more credits
                            </Button>
                        </Segment>
                        <Divider horizontal>Videos</Divider>
                        <Segment>
                            <Videos limit={20} />
                            <Divider />
                            <Button as={Link} to="/video">
                                Make video
                            </Button>
                        </Segment>
                    </Grid.Column>
                    <Grid.Column width={8}>
                        <Divider horizontal>Themes</Divider>
                        <Segment>
                            <Themes />
                        </Segment>
                        <Divider horizontal>Songs</Divider>
                        <Segment>
                            <Songs />
                        </Segment>
                        <Divider horizontal>Preview</Divider>
                        <Segment>
                            <Preview />
                        </Segment>
                    </Grid.Column>
                </Grid>
            </Container>
        )
    }
}

export default Dashboard
