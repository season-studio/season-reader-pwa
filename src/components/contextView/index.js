import * as React from "react";
import * as ReactDOM from "react-dom";
import styles from "./contextView.module.css";

export class ContextView extends React.Component {
    constructor (_props) {
        super(_props);
    }

    componentDidMount() {
        ReactDOM.findDOMNode(this)?.querySelector(`[d-index="${this.props.currentIndex}"]`)?.scrollIntoView();
    }

    render() {
        return (
            <div className={styles.contextView}>
                <div className="context-content">
                    {this.props.context?.map((item,index) => {
                        return <div className="context-item" key={index} d-index={index} onClick={() => (typeof this.props.onOpen === "function") && this.props.onOpen(index)}>{`(${index + 1}) ${item.label || "无标题"}`}</div>;
                    })}
                </div>
                <div className="context-bar">
                    <div className="context-button" onClick={() => ((typeof this.props.onClose === "function") && this.props.onClose())}>关闭</div>
                </div>
            </div>
        )
    }
}