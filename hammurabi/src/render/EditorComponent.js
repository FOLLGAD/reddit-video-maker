import React, { Component } from "react"
import { foulSpanArray } from "./sanitize"

import { EditorState, ContentState, convertFromHTML } from "draft-js"
import Editor from "draft-js-plugins-editor"
import { stateToHTML } from "draft-js-export-html"
import createLinkPlugin from "draft-js-anchor-plugin"
import createInlineToolbarPlugin from "draft-js-inline-toolbar-plugin"
import { ItalicButton, BoldButton, UnderlineButton } from "draft-js-buttons"

function findWithRegex(regex, contentBlock, callback) {
    const text = contentBlock.getText()
    let matchArr, start
    while ((matchArr = regex.exec(text)) !== null) {
        start = matchArr.index
        callback(start, start + matchArr[0].length)
    }
}

function handleStrategy(contentBlock, callback) {
    foulSpanArray.forEach((reg) => {
        findWithRegex(new RegExp(reg, "ig"), contentBlock, callback)
    })
}
function editStrategy(contentBlock, callback) {
    findWithRegex(/(?:^|\W)edit/gim, contentBlock, callback)
}

let handleSpan = (props) => {
    return <span className="highlight-danger">{props.children}</span>
}

let editSpan = (props) => {
    return <span className="highlight-warn">{props.children}</span>
}

let decorators = [
    {
        strategy: handleStrategy,
        component: handleSpan,
    },
    {
        strategy: editStrategy,
        component: editSpan,
    },
]

class EditorComponent extends Component {
    constructor(p) {
        super(p)

        this.inlineToolbarPlugin = createInlineToolbarPlugin()
        this.linkPlugin = createLinkPlugin()
        this.plugins = [this.inlineToolbarPlugin, this.linkPlugin]

        let d = convertFromHTML(p.data)

        this.state = {
            editor: d.contentBlocks
                ? EditorState.createWithContent(
                      ContentState.createFromBlockArray(
                          d.contentBlocks,
                          d.entityMap
                      )
                  )
                : EditorState.createEmpty(),
        }
    }
    handlePress = (e) => {
        e.stopPropagation()
    }
    onChange = (val) => {
        this.setState({ editor: val })

        let html = stateToHTML(this.state.editor.getCurrentContent())

        if (this.props.data !== html) {
            this.props.onChange(html)
        }
    }
    render() {
        return (
            <div>
                <Editor
                    editorState={this.state.editor}
                    onChange={this.onChange}
                    decorators={decorators}
                    plugins={this.plugins}
                />
                <this.inlineToolbarPlugin.InlineToolbar>
                    {(extProps) => (
                        <>
                            <BoldButton {...extProps} />
                            <ItalicButton {...extProps} />
                            <UnderlineButton {...extProps} />
                            <this.linkPlugin.LinkButton {...extProps} />
                        </>
                    )}
                </this.inlineToolbarPlugin.InlineToolbar>
            </div>
        )
    }
}

export default EditorComponent
