import { navigate } from '@reach/router'
import React from 'react'
import { connect } from 'react-redux'
import { Button, Container, Divider, Form, Header, List, Loader, Popup } from 'semantic-ui-react'
import { createTheme, getThemes } from '../api'

class ThemesList extends React.Component {
    createTheme = async () => {
        const { theme } = await createTheme({ name: this.state.name })
        navigate(`/themes/${theme}`)
    }
    handleChange = (e, { name, value }) => this.setState({ [name]: value })
    componentDidMount() {
        getThemes()
    }
    render() {
        return (
            <Container textAlign="left">
                <List selection>
                    {this.props.themes ? this.props.themes.length > 0 ? this.props.themes.map(theme =>
                        <List.Item key={theme._id} onClick={() => navigate("/themes/" + theme._id)}>
                            {/* <Link to={"/themes/" + theme._id}> */}
                            <List.Content>
                                <List.Header>{theme.name}</List.Header>
                            </List.Content>
                            {/* </Link> */}
                        </List.Item>
                    ): 
                    <p>You need to create a theme to get started. Click "New theme" below</p> :
                        <Loader active />}
                </List>
                <Divider></Divider>
                <Popup trigger={<Button>New theme</Button>} on="click" position="bottom center">
                    <Container fluid textAlign="center">
                        <Form onSubmit={this.createTheme}>
                            <Header>Create new theme</Header>
                            <Form.Input name="name" onChange={this.handleChange} placeholder="Name"></Form.Input>
                            <Form.Button type="submit">Create</Form.Button>
                        </Form>
                    </Container>
                </Popup>
            </Container>
        )
    }
}

let mapStateToProps = store => {
    return {
        themes: store.themes,
    }
}

export default connect(mapStateToProps)(ThemesList);