import * as React from "react";
import styles from "./mainBar.module.css";
import { pickFile } from "../../../thirdpart/toolkits/src/fileDlgKit";

export class MainBar extends React.Component {
    constructor (_props) {
        super(_props);
        
    }

    async onLoadEBook() {
        let file = await pickFile(".epub");
        if (file) {
            (typeof this.props.onLoadEBook === "function") && this.props.onLoadEBook(file);
        }
    }

    render() {
        return (
            <div className={styles.MainBar}>
                <div className="item" onClick={() => ((typeof this.props.onShowBookShelf === "function") && this.props.onShowBookShelf())}>
                    <svg className="icon" viewBox="0 0 96 96" preserveAspectRatio="none">
                        <path d="m 90.6,36.25 -5.2,-1.9 v -10.9 l 5.2,-2.2 -35.2,-13 -42.8,15 c -4.1,2 -4.2,7.5 -4.2,12 0,1.5 0.2,3 0.5,4.4 -3.4,2.2 -3.5,7.3 -3.5,11.6 0,3.5 0.8,6.7 3,8.7 -0.5,1.7 -0.2,3.8 -0.2,6.3 0,4.5 1.2,8.6 5.2,10 l 27.8,11.5 49.2,-20.4 -5.2,-1.9 v -11 l 5.2,-2.2 -8,-3 v -9.6 z m -76.8,-6 27.8,10.9 39.9,-16.1 v 8.6 l -39.9,16.6 -27.8,-11 z m 67.5,34.5 -39.9,16.5 -27.9,-11 v -7.8 l 24.9,10.2 43,-17 z m -2.8,-15 -39.9,16.5 -27.8,-11 v -9 l 28.6,11.4 39.2,-16.4 v 8.5 z" />
                    </svg>
                    书架
                </div>
                <div className="item" onClick={() => ((typeof this.props.onShowContext === "function") && this.props.onShowContext())}>
                    <svg className="icon" viewBox="0 0 96 96" preserveAspectRatio="none">
                        <path d="M 23,14 H 73 V 82 H 23 Z M 17,88 H 79 V 8 H 17 Z" />
                        <path d="m 46,70 h 20 v 4 H 46 Z M 30,68 h 8 v 8 H 30 Z M 46,54 h 20 v 4 H 46 Z M 30,52 h 8 v 8 H 30 Z M 46,38 h 20 v 4 H 46 Z M 30,36 h 8 v 8 H 30 Z M 46,22 h 20 v 4 H 46 Z M 30,20 h 8 v 8 h -8 z" />
                    </svg>
                    目录
                </div>
                <div className="item" onClick={() => this.onLoadEBook()}>
                    <svg className="icon" viewBox="0 0 96 96" preserveAspectRatio="none">
                        <path d="m 31.55,17.97 c -1.18,-0 -2.16,0.1 -3.36,0 -5.04,0 -10.09,-0 -15.13,0 -3.146,0.42 -5.469,3.68 -5.06,6.79 0,16.53 -0.02,33.06 0.04,49.59 0.205,2.3 2.665,3.9 4.865,3.51 20.79,0 41.58,0 62.37,0 4.83,-10.4 9.74,-20.76 14.48,-31.2 1.15,-3.49 -1.66,-7.69 -5.38,-7.75 -0.79,-0.1 -1.6,-0 -2.39,0 -0,-2.85 0.23,-5.73 -0.2,-8.55 -0.74,-2.93 -3.89,-4.86 -6.83,-4.45 -9.47,0 -18.93,0 -28.4,0 -3.8,-2.5 -7.52,-5.14 -11.42,-7.47 -1.13,-0.5 -2.38,-0.56 -3.59,-0.53 z m -17.51,5.99 c 6.2,0.1 12.39,0 18.58,0 1.29,0.57 2.33,1.57 3.57,2.25 2.8,1.81 5.49,3.82 8.42,5.42 2.07,0.63 4.25,0.16 6.37,0.31 8.33,0 16.65,0 24.98,0 0.15,0.81 -0,1.66 0,2.49 0,1.48 0,2.97 0,4.46 -16.24,0 -32.48,-0 -48.71,0 -2.56,0.26 -4.5,2.47 -5.14,4.85 -2.71,6.58 -5.42,13.17 -8.13,19.75 0,-13.18 0,-26.36 0,-39.54 z m 69.93,21.02 c -0.83,1.98 -1.82,3.92 -2.7,5.88 -3.27,7.01 -6.53,14.02 -9.8,21.03 -18.12,0 -36.25,0 -54.37,0 3.7,-8.96 7.34,-17.95 11.11,-26.88 0.56,0.1 0.99,-0.1 1.64,-0 18.04,0.1 36.08,-0.1 54.12,-0 z" />
                    </svg>
                    加载
                </div>
                { window.speechSynthesis && <div className="item" onClick={() => ((typeof this.props.onSpeakerControl === "function") && this.props.onSpeakerControl())}>
                    <svg className="icon" viewBox="0 0 96 96" preserveAspectRatio="none">
                        <path d="M 48,14 C 27,14 10,31 10,52 v 18 c 0,1.7 1.3,3 3,3 1.7,0 3,-1.3 3,-3 v -1 h 4 v 9 c 0,2.2 1.8,4 4,4 h 6 c 2.2,0 4,-1.8 4,-4 V 56 c 0,-2.2 -1.8,-4 -4,-4 h -6 c -2.2,0 -4,1.8 -4,4 v 9 H 16 V 52 C 16,34.4 30.4,20 48,20 65.6,20 80,34.4 80,52 v 13 h -4 v -9 c 0,-2.2 -1.8,-4 -4,-4 h -6 c -2.2,0 -4,1.8 -4,4 v 22 c 0,2.2 1.8,4 4,4 h 6 c 2.2,0 4,-1.8 4,-4 v -9 h 4 v 1 c 0,1.7 1.3,3 3,3 1.7,0 3,-1.3 3,-3 V 52 C 86,31 69,14 48,14 Z" />
                    </svg>
                    有声
                </div> }
                <div className="item" onClick={() => ((typeof this.props.onJump === "function") && this.props.onJump())}>
                    <svg className="icon" viewBox="0 0 96 96" preserveAspectRatio="none">
                        <path d="m 72,60.8 h -4.8 c -3.5,0 -6.9,-1.4 -9.4,-3.9 l -6.1,-6 -8.2,8.8 5.8,5.7 c 4.7,4.8 11.2,7.4 17.9,7.4 H 72 V 81 L 88.4,67 72,53 Z M 67.2,34.7 H 72 V 43 L 88.4,29 72,15 v 7.7 H 67.2 C 60.5,22.6 54,25.3 49.3,30.1 L 21.5,59.8 c -2.5,2.5 -5.8,3.9 -9.3,3.8 H 7.6 v 12 h 4.6 C 18.9,75.7 25.3,73 30,68.2 L 57.9,38.5 c 2.4,-2.5 5.8,-3.9 9.3,-3.8 z m -45.6,3.2 7.7,7.7 8.2,-8.8 L 30,29.4 C 25.3,24.6 18.9,22 12.2,22 H 7.6 v 12 h 4.6 c 3.5,0 6.9,1.4 9.4,3.9 z" />
                    </svg>
                    跳转
                </div>
                <div className="item" onClick={() => ((typeof this.props.onOptions === "function") && this.props.onOptions())}>
                    <svg className="icon" viewBox="0 0 96 96" preserveAspectRatio="none">
                        <path d="m 34,37.99 c -4.4,0 -8.2,2.8 -9.5,7 H 14 v 6 h 10.5 c 1.6,5.3 7.2,8.2 12.5,6.5 3.1,-0.9 5.6,-3.4 6.5,-6.5 H 82 v -6 H 43.5 c -1.3,-4.2 -5.1,-7 -9.5,-7 z m 0,14 c -2.2,0 -4,-1.8 -4,-4 0,-2.2 1.8,-4 4,-4 2.2,0 4,1.8 4,4 0,2.2 -1.8,4 -4,4 z m 25,10 c -4.4,0 -8.2,2.8 -9.5,7 H 14 v 6 h 35.5 c 1.6,5.3 7.2,8.2 12.5,6.5 3.1,-0.9 5.6,-3.4 6.5,-6.5 H 82 v -6 H 68.5 c -1.3,-4.2 -5.1,-7 -9.5,-7 z m 0,14 c -2.2,0 -4,-1.8 -4,-4 0,-2.2 1.8,-4 4,-4 2.2,0 4,1.8 4,4 0,2.2 -1.8,4 -4,4 z m 13.5,-55 c -1.6,-5.3 -7.2,-8.2 -12.5,-6.5 -3.1,0.9 -5.6,3.4 -6.5,6.5 H 14 v 6 h 39.5 c 1.6,5.3 7.2,8.2 12.5,6.5 3.1,-0.9 5.6,-3.4 6.5,-6.5 H 82 v -6 z m -9.5,7 c -2.2,0 -4,-1.8 -4,-4 0,-2.2 1.8,-4 4,-4 2.2,0 4,1.8 4,4 0,2.2 -1.8,4 -4,4 z" />
                    </svg>
                    选项
                </div>
            </div>
        )
    }
}