import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Header } from 'semantic-ui-react';
import { calculateCommentList, estimateCommentHtml } from './estimate';

function readableTime(timeInSeconds) {
    let mins = Math.floor(timeInSeconds / 60)
    let hours = Math.floor(mins / 60)
    mins -= hours * 60

    let seconds = Math.floor(timeInSeconds) - mins * 60 - hours * 60

    let str = ""
    if (hours > 0) {
        str += hours + " h, "
    }
    if (mins > 0) {
        str += mins + " m, "
    }
    str += seconds + " s"

    return str
}

class TimeEstimator extends Component {
    render() {
        let time = calculateCommentList(this.props.comments)

        if (this.props.question.includeSelftext && this.props.question.selftext_html) {
            let selftext = this.props.question.selftext_html
            time += estimateCommentHtml(selftext).estimate
        }

        return (
            <div>
                <Header>
                    <Header.Content>Estimated video length: {readableTime(time)}</Header.Content>
                </Header>
                Comments selected: {this.props.comments.filter(c => c.enabled).length}
            </div>
        )
    }
}

export default connect(state => ({
    comments: state.comments,
    question: state.question,
}))(TimeEstimator);