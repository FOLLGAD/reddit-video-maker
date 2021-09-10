import React from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import "./SortableComments.css"

let toClass = (classes) =>
    Object.keys(classes)
        .filter((d) => classes[d])
        .join(" ")

class SortableComments extends React.Component {
    onDragEnd = (result) => {
        if (!result.destination) {
            return
        }

        this.props.reorder(result.source.index, result.destination.index)
    }
    render() {
        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="draggable-container"
                        >
                            {this.props.items.map((item, index) => (
                                <Draggable
                                    key={item.data.id}
                                    draggableId={item.data.id}
                                    index={index}
                                >
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={toClass({
                                                draggable: true,
                                                current:
                                                    this.props.current ===
                                                    index,
                                                enabled: item.enabled,
                                            })}
                                            onClick={() =>
                                                this.props.setCurrent(index)
                                            }
                                        >
                                            {index + 1}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        )
    }
}

export default SortableComments
