import { navigate } from '@reach/router';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Form, Header, Segment } from 'semantic-ui-react';
import { setSelftext, setIncludeSelftext } from '../redux/actions';
import EditorComponent from './EditorComponent';

class Selftext extends Component {
    onSubmit = e => {
        e.preventDefault()

        navigate('/video/comments')
    }
    onChangeSelftext = value => {
        this.props.setSelftext(value)
    }
    onChangeInclude = (e, { checked }) => {
        this.props.setIncludeSelftext(checked)
    }
    render() {
        return (
            <Segment>
                <Form onSubmit={this.onSubmit}>
                    <Header size="large">Edit selftext</Header>
                    <Form.Checkbox label="Include selftext?" checked={this.props.includeSelftext} onChange={this.onChangeInclude} />
                    <Segment style={{ display: this.props.includeSelftext ? 'block' : 'none' }}>
                        <EditorComponent onChange={this.onChangeSelftext} data={this.props.selftext} />
                    </Segment>
                    <Form.Button primary type="submit">Continue</Form.Button>
                </Form>
            </Segment>
        )
    }
}

export default connect(state => ({
    selftext: state.question.selftext_html || "",
    includeSelftext: state.question.includeSelftext,
}), { setSelftext, setIncludeSelftext })(Selftext);