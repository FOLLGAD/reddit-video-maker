import { navigate } from "@reach/router"
import React from "react"
import { connect } from "react-redux"
import { setComments, setProcessed } from "../../redux/actions"
import { estimateCommentHtml, getFull } from "../estimate"
import Comment from "./Comment"
import SortableComments from "./SortableComments"
import {
    Segment,
    Container,
    Header,
    Button,
    Input,
    Icon,
} from "semantic-ui-react"

function recFilter(commentArr) {
    let news = commentArr
        .filter((h) => h.enabled)
        .map((d) => d.data)
        .map((d) => {
            let newS = Object.assign({}, d)
            if (newS.replies) {
                newS.replies = recFilter(newS.replies)
            }
            return newS
        })
    return news
}

class PickComments extends React.Component {
    constructor(props) {
        super(props)

        this.state = { current: 0 }
        this.onSubmit = this.onSubmit.bind(this)
        this.handle = this.handle.bind(this)
        this.toggleCurrent = this.toggleCurrent.bind(this)
        this.handleKeyEvent = this.handleKeyEvent.bind(this)

        this.fakecomments = React.createRef()
    }
    handleKeyEvent(e) {
        switch (e.code) {
            case "KeyA":
            case "ArrowLeft":
                this.goPrev()
                break
            case "KeyD":
            case "ArrowRight":
                this.goNext()
                break
            case "Enter":
                this.onSubmit()
                break
            default:
                if (e.code.indexOf("Digit") === 0) {
                    let num = parseInt(e.code.replace("Digit", ""))
                    this.toggleCurrent(num)
                }
        }
    }
    componentDidMount() {
        window.addEventListener("keydown", this.handleKeyEvent)
    }
    componentWillUnmount() {
        window.removeEventListener("keydown", this.handleKeyEvent)

        this.setProcessed()
    }
    goPrev() {
        if (this.state.current > 0) {
            this.topComment.scrollTo(0, 0)
            this.setState({ current: this.state.current - 1 })
        }
    }
    goNext() {
        if (this.state.current < this.props.comments.length - 1) {
            this.topComment.scrollTo(0, 0)
            this.setState({ current: this.state.current + 1 })
        }
    }
    setProcessed() {
        let filt = recFilter(this.props.comments)

        this.props.setProcessed(filt)
        console.log(filt)
    }
    onSubmit() {
        navigate("/video/final")
    }
    handle(id) {
        if (this.state.chosen.has(id)) {
            this.state.chosen.set(id)
        } else {
            this.state.chosen.add(id)
        }
        this.setState({
            chosen: this.state.chosen,
        })
    }
    toggleCurrent(commentNum) {
        let set = Array.from(this.props.comments)

        if (commentNum) {
            let currentNum = 0

            // Used for checking the N:th visible comment in the tree
            function traverseOnce(comment) {
                currentNum++
                if (currentNum === commentNum) {
                    return comment
                }
                if (Array.isArray(comment.data.replies)) {
                    for (let i = 0; i < comment.data.replies.length; i++) {
                        const element = comment.data.replies[i]
                        let res = traverseOnce(element)
                        if (res) {
                            return res
                        }
                    }
                }
            }

            let reqComment = traverseOnce(set[this.state.current])
            if (!reqComment) {
                return // Could not find a comment with inputted number
            }
            reqComment.enabled = !reqComment.enabled
        } else {
            set[this.state.current].enabled = !set[this.state.current].enabled
        }

        this.props.setComments(set)
    }
    toMinSec(seconds) {
        let fullMins = Math.floor(seconds / 60) // No. full mins
        let restSecs = ("00" + Math.round(seconds - 60 * fullMins)).slice(-2)
        let mins = ("00" + fullMins).slice(-2)
        return `${mins}:${restSecs}`
    }
    calculateTotalTime() {
        let recAdd = (comment) => {
            let fullHtml = comment.data.body_html

            if (Array.isArray(comment.data.replies)) {
                fullHtml += comment.data.replies
                    .filter((r) => r.enabled)
                    .map(recAdd)
                    .reduce((a, b) => a + b, "")
            }

            return fullHtml
        }
        let commentTimes = this.props.comments
            .filter((d) => d.enabled)
            .map(recAdd)
            .map((b) => estimateCommentHtml(b).estimate)

        return Math.round(1e2 * getFull(commentTimes)) / 1e2
    }
    onCurrentCommentChange(comment) {
        let s = Array.from(this.props.comments)
        this.props.setComments(s)
    }
    onReorder(start, end) {
        const reorder = (list, startIndex, endIndex) => {
            const result = Array.from(list)
            const [removed] = result.splice(startIndex, 1)
            result.splice(endIndex, 0, removed)

            return result
        }

        this.props.setComments(reorder(this.props.comments, start, end))

        let current = this.state.current

        if (current === start) {
            this.setState({ current: end })
        } else if (current < start && current > end) {
            this.setState({ current: current + 1 })
        } else if (current > start && current < end) {
            this.setState({ current: current - 1 })
        }
    }
    render() {
        if (this.props.comments.length === 0) {
            return (
                <Container>
                    <Header>No comments found for this thread</Header>
                </Container>
            )
        }
        let comment = this.props.comments[this.state.current]

        return (
            <Container>
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                    }}
                >
                    <SortableComments
                        setCurrent={(i) => this.setState({ current: i })}
                        current={this.state.current}
                        reorder={this.onReorder.bind(this)}
                        items={this.props.comments}
                    />
                    <div style={{ flexGrow: 1, paddingLeft: 10 }}>
                        <Segment>
                            <div ref={(ref) => (this.topComment = ref)}>
                                <Comment
                                    key={comment.data.id}
                                    comment={comment}
                                    onChange={this.onCurrentCommentChange.bind(
                                        this
                                    )}
                                />
                            </div>
                        </Segment>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                padding: 10,
                            }}
                        >
                            <Button
                                disabled={this.state.current <= 0}
                                onClick={this.goPrev.bind(this)}
                            >
                                <Icon name="arrow left" />
                                Prev
                            </Button>
                            <Input
                                type="number"
                                max={this.props.comments.length}
                                min={1}
                                value={this.state.current + 1}
                                onChange={(e) =>
                                    this.setState({
                                        current: Math.max(
                                            0,
                                            parseInt(e.target.value) - 1 || 0
                                        ),
                                    })
                                }
                            />
                            <Button
                                disabled={
                                    this.state.current >
                                    this.props.comments.length
                                }
                                onClick={this.goNext.bind(this)}
                            >
                                Next
                                <Icon name="arrow right" />
                            </Button>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-around",
                                marginTop: 10,
                            }}
                        >
                            <Button onClick={this.onSubmit} size="huge" primary>
                                Finish
                            </Button>
                        </div>
                    </div>
                </div>
            </Container>
        )
    }
}

export default connect(
    (state) => ({
        comments: state.comments,
    }),
    {
        setProcessed,
        setComments,
    }
)(PickComments)
