import * as React from "react";
import * as ReactDOM from "react-dom";
import styles from "./speakerSelector.module.css";

const KEY_SPEAKER_NAME = "speaker-name";
const KEY_SPEAKER_RATE = "speaker-rate";
const KEY_SPEAKER_PITCH = "speaker-pitch";

export class SpeakerSelector extends React.Component {
    constructor (_props) {
        super(_props);
        this.voices = speechSynthesis.getVoices().sort((a, b) => String(a.lang).localeCompare(b.lang));
        let previousSpeakerName = localStorage.getItem(KEY_SPEAKER_NAME);
        this.previousSpeakerIndex = this.voices.findIndex((e) => e.name === previousSpeakerName);
        if (this.previousSpeakerIndex < 0) {
            this.previousSpeakerIndex = this.voices.findIndex((e) => e.lang === navigator.language);
        }
        this.state = {
            rate: Number(localStorage.getItem(KEY_SPEAKER_RATE)) || 1,
            pitch: Number(localStorage.getItem(KEY_SPEAKER_PITCH)) || 1,
        }
    }

    onStartSpeaker() {
        let rootNode = ReactDOM.findDOMNode(this);
        let voiceIndex = Number(rootNode.querySelector("select")?.value) || this.previousSpeakerIndex;
        localStorage.setItem(KEY_SPEAKER_NAME, this.voices[voiceIndex]?.name);
        localStorage.setItem(KEY_SPEAKER_RATE, this.state.rate);
        localStorage.setItem(KEY_SPEAKER_PITCH, this.state.pitch);
        
        if (typeof this.props.onStart === "function") {
            let speaker = new SpeechSynthesisUtterance();
            speaker.rate = this.state.rate;
            speaker.pitch = this.state.pitch;
            speaker.voice = this.voices[voiceIndex] || this.voices.find((e) => e.lang === navigator.language);
            this.props.onStart(speaker);
        }
    }

    render() {
        return (
            <div className={styles.speakerSelector}>
                <div className="controller-bar">
                    <select className="voice-selector" defaultValue={this.previousSpeakerIndex < 0 ? 0: this.previousSpeakerIndex}>
                        {this.voices.map((item,index) => {
                            return <option key={index} value={index}>{`${item.name} (${item.lang})`}</option>;
                        })}
                    </select>
                </div>
                <div className="controller-bar">
                    <label htmlFor="rate">速率</label>&nbsp;<span>{this.state.rate.toFixed(1)}</span>&nbsp;
                    <input type="range" className="range-input" min="0.5" max="2" defaultValue={this.state.rate} step="0.1" id="rate" onChange={e => this.setState({rate:Number(e.target.value)||1})} />
                </div>
                <div className="controller-bar">
                    <label htmlFor="pitch">音高</label>&nbsp;<span>{this.state.pitch.toFixed(1)}</span>&nbsp;
                    <input type="range" className="range-input" min="0.1" max="2" defaultValue={this.state.pitch} step="0.1" id="pitch" onChange={e => this.setState({pitch:Number(e.target.value)||1})} />
                </div>
                <div className="selector-bar">
                    <div className="selector-button" onClick={() => ((typeof this.props.onClose === "function") && this.props.onClose())}>关闭</div>
                    <div className="selector-button" onClick={() => this.onStartSpeaker()}>开始</div>
                </div>
            </div>
        )
    }
}