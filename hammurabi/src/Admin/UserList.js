import React from "react"
import { connect } from "react-redux"
import {
    Container,
    Divider,
    Header,
    List,
    Loader,
    Modal,
    Form,
    Button,
    Label,
    Message,
} from "semantic-ui-react"
import {
    adminGetUsers,
    adminCreateUser,
    adminChangePass,
    adminGiveCredits,
    adminSetMultiplier,
} from "../api"

class UserList extends React.Component {
    state = {
        addingUser: false,
        editingUser: false,
        selectedUser: null,
        email: "",
        username: "",
        password: "",
        multiplier: 0,
        creditsToGive: 0,
        loading: false,
    }
    componentDidMount() {
        adminGetUsers()
    }
    createUser = async () => {
        this.setState({ loading: true })
        await adminCreateUser({
            email: this.state.email || null,
            username: this.state.username || null,
            password: this.state.password,
        })
        this.setState({ loading: false })
        adminGetUsers()
        this.closeAddModal()
    }
    openAddModal = () =>
        this.setState({
            addingUser: true,
            editingUser: false,
            loading: false,
            username: "",
            email: "",
            password: "",
        })
    closeAddModal = () => this.setState({ addingUser: false })

    setMultiplier = async () => {
        this.setState({ loading: true })
        await adminSetMultiplier(
            this.state.selectedUser._id,
            this.state.multiplier
        )
        this.setState({ loading: false })
        adminGetUsers()
        this.closeEditModal()
    }
    changeUserPass = async () => {
        this.setState({ loading: true })
        await adminChangePass(this.state.selectedUser._id, this.state.password)
        this.setState({ loading: false })
        this.closeEditModal()
    }
    giveCredits = async () => {
        this.setState({ loading: true })
        await adminGiveCredits(
            this.state.selectedUser._id,
            this.state.creditsToGive
        )
        this.setState({ loading: false, creditsToGive: 0 })
        adminGetUsers()
        this.closeEditModal()
    }
    openEditModal = (user) =>
        this.setState({
            addingUser: false,
            editingUser: true,
            loading: false,
            email: user.email,
            username: user.username,
            password: user.password,
            selectedUser: user,
            multiplier: user.multiplier,
        })
    closeEditModal = () => this.setState({ editingUser: false })

    handleChange = (e, { name, value }) => this.setState({ [name]: value })
    render() {
        return (
            <Container textAlign="left">
                <List selection>
                    {this.props.users ? (
                        this.props.users.map((user) => (
                            <List.Item
                                key={user._id}
                                onClick={() => this.openEditModal(user)}
                            >
                                <List.Content>
                                    <List.Header>
                                        {user.email || user.username}{" "}
                                        {user.isAdmin && (
                                            <Label size="tiny" color="red">
                                                admin
                                            </Label>
                                        )}
                                    </List.Header>
                                    <List.Description>
                                        {user.credits} credits
                                    </List.Description>
                                    <List.Description>
                                        {user.videoCount} videos made
                                    </List.Description>
                                </List.Content>
                            </List.Item>
                        ))
                    ) : (
                        <Loader active />
                    )}
                </List>
                <Divider />
                <Button onClick={this.openAddModal}>Create user</Button>
                {/* Adding Modal */}
                <Modal
                    open={this.state.addingUser}
                    onClose={this.closeAddModal}
                >
                    <Modal.Content>
                        <Header>Add user</Header>
                    </Modal.Content>
                    <Modal.Content>
                        <Form>
                            <Form.Input
                                placeholder="Username"
                                type="text"
                                name="username"
                                value={this.state.username}
                                onChange={this.handleChange}
                            />
                            <Form.Input
                                placeholder="Email"
                                type="email"
                                name="email"
                                value={this.state.email}
                                onChange={this.handleChange}
                            />
                            <Form.Input
                                placeholder="Password"
                                type="password"
                                name="password"
                                value={this.state.password}
                                onChange={this.handleChange}
                            />
                        </Form>
                    </Modal.Content>
                    <Modal.Actions>
                        <Form.Button primary onClick={this.createUser}>
                            Create
                        </Form.Button>
                    </Modal.Actions>
                </Modal>
                {/* Editing Modal */}
                <Modal
                    open={this.state.editingUser}
                    onClose={this.closeEditModal}
                >
                    <Modal.Content>
                        <Header>Give credits</Header>
                    </Modal.Content>
                    <Modal.Content>
                        <Form loading={this.state.loading}>
                            <Header>
                                Current credits:{" "}
                                {this.state.selectedUser &&
                                    this.state.selectedUser.credits}
                            </Header>
                            <Form.Input
                                type="number"
                                name="creditsToGive"
                                step={1}
                                value={this.state.creditsToGive}
                                onChange={this.handleChange}
                            />
                        </Form>
                    </Modal.Content>
                    <Modal.Actions>
                        <Form.Button
                            primary
                            onClick={this.giveCredits}
                            loading={this.state.loading}
                        >
                            Give credits
                        </Form.Button>
                    </Modal.Actions>
                    <Divider />
                    <Modal.Content>
                        <Header>Change user password</Header>
                    </Modal.Content>
                    <Modal.Content>
                        <Form>
                            <Form.Input
                                disabled
                                placeholder="Email or username"
                                type="text"
                                name="email"
                                value={this.state.email || this.state.username}
                                onChange={this.handleChange}
                            />
                            <Form.Input
                                placeholder="Password"
                                type="password"
                                name="password"
                                value={this.state.password}
                                onChange={this.handleChange}
                            />
                        </Form>
                    </Modal.Content>
                    <Modal.Actions>
                        <Form.Button
                            primary
                            onClick={this.changeUserPass}
                            loading={this.state.loading}
                        >
                            Change password
                        </Form.Button>
                    </Modal.Actions>
                    <Divider />
                    <Modal.Content>
                        <Header>Set price modifier</Header>
                    </Modal.Content>
                    <Modal.Content>
                        {this.state.multiplier > 1 && (
                            <Message color="negative">
                                This should probably be less than 1
                            </Message>
                        )}
                        <Form>
                            <Form.Input
                                placeholder="Price multiplier"
                                type="number"
                                name="multiplier"
                                min={0}
                                step={0.01}
                                value={this.state.multiplier}
                                onChange={this.handleChange}
                            />
                        </Form>
                    </Modal.Content>
                    <Modal.Actions>
                        <Form.Button
                            primary
                            onClick={this.setMultiplier}
                            loading={this.state.loading}
                        >
                            Set modifier
                        </Form.Button>
                    </Modal.Actions>
                </Modal>
            </Container>
        )
    }
}

let mapStateToProps = (store) => {
    return {
        users: store.users,
    }
}

export default connect(mapStateToProps)(UserList)
