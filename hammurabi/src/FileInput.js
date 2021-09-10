import React from "react"
import { Button, Icon, Input } from "semantic-ui-react"

class FileInput extends React.Component {
    render() {
        let buttonOnly = this.props.buttonOnly

        let button = (
            <Button
                icon={!this.props.label}
                style={{ position: "relative" }}
                onClick={() => this.fileInput.click()}
            >
                <input
                    name={this.props.name}
                    type="file"
                    accept={this.props.accept || null}
                    ref={(r) => (this.fileInput = r)}
                    style={{ display: "none" }}
                    onChange={this.props.onChange}
                />
                <Icon name={this.props.icon || "file"} size={this.props.size} />
                {this.props.label && this.props.label}
            </Button>
        )
        return buttonOnly ? (
            button
        ) : (
            <Input
                {...this.props}
                placeholder={this.props.placeholder || "No file"}
                value={this.props.file ? this.props.file.name : ""}
                label={button}
                labelPosition="left"
                readOnly={true}
                size={this.props.size}
                onClick={() => this.fileInput.click()}
            />
        )
    }
}

export default FileInput
