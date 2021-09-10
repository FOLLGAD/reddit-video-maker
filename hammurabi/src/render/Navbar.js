import { Link } from "@reach/router"
import React from "react"
import { Header, Step } from "semantic-ui-react"
import TimeEstimator from "./TimeEstimator"
import { connect } from "react-redux"

class Navbar extends React.PureComponent {
    render() {
        return (
            <div>
                {this.props.question && (
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                            }}
                        >
                            <Step.Group>
                                <Step
                                    active={this.props["*"] === "post"}
                                    as={Link}
                                    to="post"
                                >
                                    Question title
                                </Step>
                                <Step
                                    active={this.props["*"] === "selftext"}
                                    as={Link}
                                    to="selftext"
                                >
                                    Body text
                                </Step>
                                <Step
                                    active={this.props["*"] === "comments"}
                                    as={Link}
                                    to="comments"
                                >
                                    Comments
                                </Step>
                                <Step
                                    active={this.props["*"] === "final"}
                                    as={Link}
                                    to="final"
                                >
                                    Finish
                                </Step>
                            </Step.Group>
                        </div>
                        <TimeEstimator />
                        <Header as="h2">{this.props.question.title}</Header>
                    </div>
                )}
                {this.props.children}
            </div>
        )
    }
}

export default connect((state) => ({
    question: state.question,
}))(Navbar)
