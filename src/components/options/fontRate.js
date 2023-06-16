import { registryOption } from "./optkits";
import * as React from "react";
import * as ReactDOM from "react-dom";

const MAX_RATE = 2;
const MIN_RATE = 0.5;

class FontRateView extends React.Component {
    constructor (_props) {
        super(_props);

        this.state = {
            rate: Math.min(MAX_RATE, Math.max(MIN_RATE, Math.abs(Number(localStorage.getItem("font-rate")) || 1)))
        }
    }

    onChange(e) {
        let fontRate = (Number(e.target.value)||1);
        this.setState({rate:fontRate});
        let style = document.querySelector("style[d-font-rate]");
        if (fontRate !== 1) {
            localStorage.setItem("font-rate", fontRate);
            if (style || (style = document.createElement("style"))) {
                style.setAttribute("d-font-rate", fontRate);
                style.innerHTML = `body { --content-text-size-rate: ${fontRate}; }`;
                document.head.appendChild(style);
            }
        } else {
            localStorage.removeItem("font-rate");
            style?.remove();
        }
    }

    render() {
        return (
            <>
                <label htmlFor="font-rate-opt">字体大小({this.state.rate.toFixed(1)}): </label>
                <input type="range" id="font-rate-opt" min={MIN_RATE} max={MAX_RATE} defaultValue={this.state.rate} step="0.1" onChange={e => this.onChange(e)} />
                <p style={{border:"solid 1px var(--content-text-color)", margin:"0.5em", textAlign:"center", minHeight:"0"}} class="content-box">字体测试样章</p>
            </>
        )
    }
}

export default registryOption({
    onload() {
        let style = document.querySelector("style[d-font-rate]");
        let fontRate = localStorage.getItem("font-rate");
        if (fontRate) {
            fontRate = Math.min(MAX_RATE, Math.max(MIN_RATE, Math.abs(Number(fontRate) || 1)));
            if (style || (style = document.createElement("style"))) {
                style.setAttribute("d-font-rate", fontRate);
                style.innerHTML = `body { --content-text-size-rate: ${fontRate}; }`;
                document.head.appendChild(style);
            }
        } else {
            style?.remove();
        }
    },
    ui(_containerNode) {
        _containerNode && ReactDOM.render(<FontRateView />, _containerNode);
    }
});