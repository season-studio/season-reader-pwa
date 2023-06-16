import { registryOption } from "./optkits";
import * as React from "react";
import * as ReactDOM from "react-dom";

const themeStyles = {
    "黑夜": `body { --content-text-color: #464646 !important; --content-bg-color: #171717 !important; }`,
    "星空": `body { --content-text-color: #00bfff !important; --content-bg-color: #171717 !important; }`,
    "隐蔽": `body { --content-text-color: #262626 !important; --content-bg-color: #171717 !important; }`,
};

class ThemeView extends React.Component {
    constructor (_props) {
        super(_props);
    }

    componentDidMount() {
        //let node = document.querySelector("select#theme-list");
        //node && (node.value = (localStorage.getItem("theme")||""));
    }

    onChange(e) {
        let themeName = e.target?.value;
        let style = document.querySelector("style[d-theme]");
        if (themeName && themeStyles[themeName]) {
            localStorage.setItem("theme", themeName);
            if (style || (style = document.createElement("style"))) {
                style.setAttribute("d-theme", themeName);
                style.innerHTML = themeStyles[themeName];
                document.head.appendChild(style);
            }
        } else {
            localStorage.removeItem("theme");
            style?.remove();
        }
    }

    render() {
        return (
            <>
                <label htmlFor="theme-list">主题: </label>
                <select id="theme-list" defaultValue={localStorage.getItem("theme")||""} onChange={(e) => this.onChange(e)}>
                    <option value="">默认</option>
                    {
                        Object.keys(themeStyles).map((item,index) => <option value={item} key={index}>{item}</option>)
                    }
                </select>
            </>
        )
    }
}

export default registryOption({
    onload() {
        let style = document.querySelector("style[d-theme]");
        let themeName = localStorage.getItem("theme");
        if (themeName && themeStyles[themeName]) {
            if (style || (style = document.createElement("style"))) {
                style.setAttribute("d-theme", themeName);
                style.innerHTML = themeStyles[themeName];
                document.head.appendChild(style);
            }
        } else {
            style?.remove();
        }
    },
    ui(_containerNode) {
        _containerNode && ReactDOM.render(<ThemeView />, _containerNode);
    }
});