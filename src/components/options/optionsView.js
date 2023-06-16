import * as React from "react";
import * as ReactDOM from "react-dom";
import styles from "./optionsView.module.css";
import { getOptionsRegister, sortOptions } from "./optkits";


export class OptionsView extends React.Component {
    constructor (_props) {
        super(_props);

        sortOptions();
    }

    componentDidMount() {
        let options = getOptionsRegister();
        Array.from(ReactDOM.findDOMNode(this)?.querySelectorAll("[d-option-idx]")).forEach(item => {
            if (item) {
                let idx = Number(item.getAttribute("d-option-idx"));
                let opt = ((!isNaN(idx)) && options[idx]);
                (typeof opt.ui === "function") && opt.ui.call(opt, item);
            }
        })
    }

    render() {
        return (
            <div className={styles.optionsView}>
                <div className="options-bar" style={{padding: "0.5em 0"}}>
                    选项（构建号{PackStamp}）:
                </div>
                <div className="options-content">
                    {getOptionsRegister().map((_, index) => <div d-option-idx={index} key={index}></div>)}
                </div>
                <div className="options-bar">
                    <div className="options-button" onClick={() => ((typeof this.props.onClose === "function") && this.props.onClose())}>关闭</div>
                </div>
            </div>
        )
    }
}
