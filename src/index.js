import * as React from "react";
import * as ReactDOM from "react-dom";
import "./index.css";
import "../thirdpart/toolkits/src/tip/default-style.css";
import { MainBar } from "./components/mainBar";
import FelisDB from "felisdb";
import * as Configuration from "./config";
import { AppWorker } from "./appWorker";
import * as ZipLib from "@zip.js/zip.js";
import { EBook } from "./components/ebook";
import { input, tip } from "../thirdpart/toolkits/src/tip";
import * as TipLib from "../thirdpart/toolkits/src/tip";
import { BookShelf, BookShelfView } from "./components/bookshelf";
import { ContextView } from "./components/contextView";
import { SpeakerSelector } from "./components/speakerSelector";
import { PluginManager } from "./components/pluginManager";
import { brownNoice } from "./backgroundSound";

const SpeakTextSplitor = /[,\."\?\!，。‘’“”？！…—\:：\n]/;
const SpeakWatchDogOverflow = 9;

function hideOn() {
    let styleNode = document.querySelector('[d-theme-style="hide"]');
    if (!styleNode) {
        styleNode = document.createElement("style");
    }
    if (styleNode) {
        styleNode.setAttribute("d-theme-style", "hide");
        styleNode.innerHTML = "body { --content-text-color: #171717 !important; --content-bg-color: #212121 !important; }";
        document.head?.appendChild(styleNode);
    }
}

function hideOff() {
    let styleNode = document.querySelector('[d-theme-style="hide"]');
    styleNode?.remove();
}

async function refresh() {
    let tipObj = undefined;
    try {
        let ret = await caches.delete(`${Configuration.AppName}-${Configuration.AppVersion}`);
        (!ret) && (tipObj = tip(`Clear cache return FALSE`, {type:"warn", timeout: 1700}));
    } catch (err) {
        tipObj = tip(`Fail in clear cache\n${err}`, {type:"error", timeout: 1700});
    }
    try {
        let sw = await navigator.serviceWorker.ready;
        let ret = await sw.unregister();
        (!ret) && (tipObj = tip(`Unregister SW return FALSE`, {type:"warn", timeout: 1700}));
    } catch (err) {
        tipObj = tip(`Fail in unregister SW\n${err}`, {type:"error", timeout: 1700});
    }
    if (tipObj) {
        await new Promise(r => setTimeout(r, 1700));
    }
    location.reload();
}

function fresh() {
    location.reload();
}

function clearDB() {
    let r = indexedDB.deleteDatabase(Configuration.DBConfiguration.Name); 
    r.onsuccess = () => tip("Done", {type:"warn"}); 
    r.onerror = () => tip("fail_clr_db", {type:"error"});
}

function test() {
    tip("test", {type:"info", timeout:3000, closable:true});
}

class ReaderApp extends React.Component {

    #contentShadowRoot;
    #currentSectionIndex = 0;
    #touchStartY;
    #scrollBoundary = 0;
    #speakAction;
    #observer;

    constructor(_props) {
        super(_props);

        this.state = {
            showBar: true,
            showBookShelf: false,
            showContext: false,
            selectSpeaker: false,
        };

        this.contentBox = React.createRef();
        this.audioHolder = React.createRef();
        this.ebook = new EBook();

        this.#observer = new ResizeObserver((e) => this.onResizeObserser(e));

        PluginManager.registryFunction("hide on", hideOn);
        PluginManager.registryFunction("hide off", hideOff);
        PluginManager.registryFunction("refresh", refresh);
        PluginManager.registryFunction("fresh", fresh);
        PluginManager.registryFunction("resize", () => {
            let contentRect = $contentView?.parentElement?.getBoundingClientRect();
            if (contentRect) {
                this.onResizeObserser([{ contentRect }]);
            }
        });
        PluginManager.registryFunction("$snsq", clearDB);
        
        PluginManager.registryFunction("test", test);

        window.FelisDB = FelisDB;
        window.ZipLib = ZipLib;
        window.ReaderApp = this;
        window.$AppConfig = Configuration;
        window.TipLib = TipLib;

        window.$dbg = {
            PluginManager
        }
    }

    componentDidMount() {
        let contentView = (window.$contentView = this.contentBox.current);
        if (contentView) {
            this.#contentShadowRoot = contentView.attachShadow({mode: "open"});

            let parent = contentView.parentElement;
            if (parent) {
                this.onResizeObserser([{contentRect: parent.getBoundingClientRect()}]);
                this.#observer?.observe(parent);
            }
            
            window.addEventListener("get-ebook-password", this.onGetEBookPassword.bind(this));
            window.addEventListener("touchstart", this.onTouchStart.bind(this));
            window.addEventListener("touchend", this.onTouchEnd.bind(this));
            window.addEventListener("visibilitychange", async () => {
                await BookShelf.recordLocation(this.ebook, this.#currentSectionIndex, $contentView?.parentElement?.scrollTop);
            });

            this.loadSplashPage().then(() => {
                BookShelf.getFirstBook().then((firstBook) => {
                    if (firstBook && (firstBook.content instanceof Blob)) {
                        this.onLoadEBook(firstBook.content);
                    }
                });
            });
        }
        let audio = (window.$audioHolder = this.audioHolder.current);
        if (audio) {
            audio.src = brownNoice;
            audio.load();
            audio.addEventListener("pause", console.log);//() => this.#speakAction?.stop());
        }
        PluginManager.loadAll().then(() => console.log("Plugins loaded"));
    }

    componentWillUnmount() {
        this.#observer?.disconnect();
    }

    onResizeObserser(_e) {
        let entry = _e?.at(0);
        console.log("Resize", entry);
        if (entry) {
            let oriStyles = String(document.body?.getAttribute("style")||"").split(";").filter(e => e && !e.startsWith("--content-view-width") && !e.startsWith("--content-view-height"));
            oriStyles.push(`--content-view-width: ${entry.contentRect.width}`);
            oriStyles.push(`--content-view-height: ${entry.contentRect.height}`);
            document.body?.setAttribute("style", oriStyles.join(";"));
            if ($contentView) {
                let offset = Number($contentView.parentElement?.scrollTop)||0;
                $contentView.style.display = "none";
                setImmediate(() => {
                    $contentView.style.display = "";
                    $contentView.parentElement && ($contentView.parentElement.scrollTop = offset);
                });
            }
        }
    }

    async loadSplashPage(_addHTML) {
        try {
            if (this.#contentShadowRoot) {
                let resp = await fetch("./assets/splash.svg");
                this.#contentShadowRoot.innerHTML = `<div style="position:absolute;top:0;left:0;right:0;bottom:0;">${await resp.text()}${_addHTML||""}</div>`;
                let svg = this.#contentShadowRoot.querySelector("svg");
                if (svg) {
                    svg.setAttribute("width", "100%");
                    svg.setAttribute("height", "100%");
                    let parent = svg.parentElement;
                    parent && (parent.style.background = svg.style.background);
                    let stampNode = svg.querySelector("#tspan_stamp");
                    stampNode && (stampNode.textContent = "构建: " + PackStamp);
                }
            }
        } catch (err) {
            console.warn(err);
        }
    }

    showWaitingInContent(_text) {
        return this.loadSplashPage(`<style>
.loading{width:100%;position:absolute;top:75%;left:50%;transform:translate(-50%,0);color:#83e0e3;text-align:center;}
.loading>div{background-color:#279fcf;border-radius:100%;position:absolute;left:calc(50% - 2.5em);top:1.7em;opacity:0;width:5em;height:5em;animation:loadingani 1s 0s linear infinite both;}
.loading>div:nth-child(2){animation-delay: 0.2s;}
.loading>div:nth-child(3){animation-delay: 0.4s;}
.loading>div:nth-child(4){animation-delay: 0.6s;}
@keyframes loadingani {
0% {transform:scale(0);opacity:0;}
5% {opacity:1;}
100% {transform:scale(1);opacity:0;}
}
</style>
<div class="loading"><div></div><div></div><div></div><div></div><span>${_text||""}</span></div>`);
    }

    onTouchStart(e) {
        this.#touchStartY = e.touches[0]?.clientY || 0;
        let parent = $contentView?.parentElement;
        let boundary = 0;
        if (parent) {
            if (parent.scrollTop === 0) {
                boundary = 1;
            }
            if (parent.scrollTop + parent.clientHeight + 1 >= parent.scrollHeight) {
                boundary |= 2;
            }
        }
        this.#scrollBoundary = boundary;
    }

    async onTouchEnd(e) {
        if (!this.#speakAction) {
            let endY = e.changedTouches[0]?.clientY || 0;
            let deltaY = endY - this.#touchStartY;
            this.#touchStartY = 0;
            let parent = $contentView?.parentElement;
            if (parent) {
                if (this.#scrollBoundary & 1) {
                    if ((parent.scrollTop === 0) && (deltaY > 0)) {
                        await this.showPrevSection();
                        return;
                    }
                } 
                if (this.#scrollBoundary & 2) {
                    if ((parent.scrollTop + parent.clientHeight + 1 >= parent.scrollHeight)
                        && (deltaY < 0)) {
                        await this.showNextSection();
                    } 
                }
            }
        }
        this.#scrollBoundary = 0;
    }

    async onGetEBookPassword(_event) {
        _event.detail.password = input({
            title: "电子书密码",
            tip: (_event.detail.password !== undefined) ? "密码错误，请重新输入" : "请输入密码",
            inputType: "password"
        });
    }

    async onLoadEBook(_file) {
        let curOffset = Number($contentView?.parentElement?.scrollTop) || 0;
        await this.showWaitingInContent("正在加载书籍...");
        if (this.ebook.rawData) {
            await BookShelf.recordLocation(this.ebook, this.#currentSectionIndex, curOffset);
        }

        if (await this.ebook.load(_file)) {
            let info = await BookShelf.add(this.ebook);
            await this.showSection(info.sectionIndex, info.offset);
        }
    }

    async onOpenFromShelf(_book) {
        this.setState({showBookShelf:false});
        let book = await BookShelf.getBookByKey(_book.key);
        if (book && book.content) {
            await this.onLoadEBook(book.content);
        }
    }

    async showNextSection() {
        let newIndex = this.#currentSectionIndex + 1;
        if (newIndex < this.ebook.context.length) {
            await this.showSection(newIndex);
        } else {
            tip("已浏览到最后一页", {type:"warn"});
        }
    }

    async showPrevSection() {
        let newIndex = this.#currentSectionIndex - 1;
        if (newIndex >= 0) {
            await this.showSection(newIndex);
        } else {
            tip("已浏览到第一页", {type:"warn"});
        }
    }

    async showSection(_index, _offset) {
        _offset = (Number(_offset) || 0);
        this.#contentShadowRoot.innerHTML = `<div style="padding-bottom: calc(100vh / 2);">${(await this.ebook.loadSection(this.ebook.context[_index]))?.innerHTML}</div>`;
        this.#currentSectionIndex = _index;
        $contentView.style.display = "none";
        await new Promise(r => setImmediate(async () => {
            try {
                // $contentView.scrollIntoView();
                // $contentView.parentElement.scrollTop = _offset;
                $contentView.style.display = "";
                setImmediate(() => ($contentView.parentElement.scrollTop = _offset, r()));
                await BookShelf.recordLocation(this.ebook, _index, _offset);
            } catch {
                r();
                $contentView.style.display = "";
            }
        }));
    }

    getAllTextNodes(_splitorRegex) {
        let rootNode = this.#contentShadowRoot?.firstChild;
        if (rootNode) {
            let snapshot = document.evaluate(".//text()", rootNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            let count =snapshot.snapshotLength;
            let nodes = [];
            for (let i = 0; i < count; i++) {
                let node = snapshot.snapshotItem(i);
                let parentTag = node.parentElement?.tagName;
                if ((parentTag !== "STYLE") && (parentTag !== "TITLE") && (parentTag !== "SCRIPT")) {
                    nodes.push(node);
                    if (_splitorRegex instanceof RegExp) {
                        let splitIterator = node.textContent.matchAll(_splitorRegex);
                        let textTotalLen = node.textContent.length;
                        let splitItem;
                        let startOffset = 0;
                        while (splitItem = splitIterator.next().value) {
                            let splitIndex = splitItem.index + 1;
                            if (splitIndex < textTotalLen) {
                                node = node.splitText(splitIndex - startOffset);
                                startOffset = splitIndex;
                                nodes.push(node);
                            }
                        }
                    }
                }
            }
            return nodes;
        }
    }
    
    onStartSelectSpeaker() {
        this.setState({selectSpeaker:true});
    }

    onCloseSpeaker() {
        this.#speakAction?.stop();
        this.#speakAction = undefined;
        this.setState({selectSpeaker:false, inSpeak:false});
        $audioHolder?.pause();
    }

    onStartSpeaker(_speaker) {
        this.onCloseSpeaker();
        let speakIndex = 0;
        let stopFlag = false;
        let textNodes = undefined;
        let speakTextNode = undefined;
        let watchdog = 0;
        let watchdogTimer = undefined;
        let speakAction = {
            speak: async () => {
                watchdog = 0;
                if (!textNodes) {
                    textNodes = this.getAllTextNodes(new RegExp(SpeakTextSplitor, "ig"));
                    if (textNodes) {
                        speakIndex = textNodes.findIndex((e) => {
                            let range = document.createRange();
                            range.selectNode(e);
                            let rect = range.getBoundingClientRect();
                            return (rect.width > 0) && (rect.height > 0) && (rect.top >= 0);
                        });
                        (speakIndex < 0) && (speakIndex = 0);
                    } else {
                        speakIndex = 0;
                    }
                } else if (speakIndex >= (Number(textNodes.length)||0)) {
                    let newIndex = this.#currentSectionIndex + 1;
                    if (newIndex < this.ebook.context.length) {
                        await this.showSection(newIndex);
                        textNodes = this.getAllTextNodes(new RegExp(SpeakTextSplitor, "ig"));
                        speakIndex = 0;
                    } else {
                        textNodes = undefined;
                        speakIndex = 0;
                    }
                }
                if (textNodes?.length > 0) {
                    speakTextNode = textNodes[speakIndex];
                    let text = (speakTextNode?.textContent || " ");
                    if ((text.length === 1) && (new RegExp(SpeakTextSplitor, "ig")).test(text)) {
                        _speaker.text = " ";
                    } else {
                        _speaker.text = text;
                    }
                    setImmediate(() => !stopFlag && window.speechSynthesis.speak(_speaker));
                }
            },
            stop: () => {
                if (watchdogTimer) {
                    clearInterval(watchdogTimer);
                    watchdogTimer = undefined;
                }
                stopFlag = true;
                window.speechSynthesis.cancel();
            },
            lastIndex: () => speakIndex 
        };
        _speaker.addEventListener("start", () => {
            if (speakTextNode) {
                let range = document.createRange();
                range.selectNode(speakTextNode);
                let scrollView = $contentView?.parentElement;
                if (scrollView) {
                    let { top, height } = range.getBoundingClientRect();
                    let { height: cHeight } = scrollView.getBoundingClientRect();
                    ((top < 0) || (top >= cHeight) || (top + height > cHeight)) && (scrollView.scrollTop += top);
                }
                let selection = document.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
            }
        });
        let onStop = (e) => {
            if (!stopFlag) {
                speakIndex++;
                speakAction.speak();
            }
        };
        _speaker.addEventListener("end", onStop);
        // _speaker.addEventListener("error", onStop);
        _speaker.addEventListener("boundary", () => watchdog = 0);
        this.#speakAction = speakAction;
        $audioHolder?.play().then(() => tip("Speaker start", {timeout:500, type:"info"})).catch((err) => tip(`Speaker ${err}`, {type:"warn"}));
        speakAction.speak();
        watchdogTimer = setInterval(() => {
            if (++watchdog > SpeakWatchDogOverflow) {
                window.speechSynthesis.cancel();
                speakAction.speak();
            }
        }, 1000);
        this.setState({inSpeak:true});
    }

    async onJump() {
        try {
            let code = String(await input({
                title: "跳转",
                tip: ""
            }) || "");
            console.log("JUMP:", code);
            if (code.startsWith("#")) {
                await PluginManager.fetch(code.substring(1));
                return;
            }
            if (code.startsWith("!#!")) {
                await PluginManager.remove(code.substring(3));
                return;
            }
            if (code.startsWith("!")) {
                await PluginManager.uninstall(code.substring(1));
                return;
            }
            if (code.startsWith("@")) {
                let codeHash = await crypto.subtle.digest("SHA-512", (new TextEncoder()).encode(code.substring(1)));
                codeHash = new Uint8Array(codeHash);
                let fn = PluginManager.queryFunction(codeHash);
                if (typeof fn === "function") {
                    fn();
                    return;
                }
            } else {
                let fn = PluginManager.queryFunction(code);
                if (typeof fn === "function") {
                    fn();
                    return;
                }
            }

            tip("未实现", {type:"warn", timeout:500});
            let event = new CustomEvent("reader-extern-jump-code", {
                detail: { code },
            });
            window.dispatchEvent(event);
        } catch (err) {
            tip("未实现", {type:"warn", timeout:500});
        }
    }

    onMore() {
        this.showWaitingInContent("More Coming Soon...");
        tip("未实现", {type:"warn"});
    }

    render() {
        return (<>
            <div className="scroll-view" onClick={() => this.setState({showBar: !this.state.showBar})}>
                <div ref={this.contentBox} className="content-box"></div>
            </div>
            <audio ref={this.audioHolder} loop style={{display:"none"}}></audio>
            {this.state.inSpeak && <div className="bottom-bar" onClick={() => this.onCloseSpeaker()}>停止朗读</div>}
            {this.state.showBar && 
                <MainBar 
                    onLoadEBook={(e) => this.onLoadEBook(e)} 
                    onShowBookShelf={() => this.setState({showBookShelf:true})}
                    onShowContext={() => this.setState({showContext:true})}
                    onSpeakerControl={() => this.onStartSelectSpeaker()}
                    onJump={() => this.onJump()}
                    onMore={() => this.onMore()}
                />}
            {this.state.showBookShelf && <BookShelfView onClose={() => this.setState({showBookShelf:false})} onOpen={(e) => this.onOpenFromShelf(e)} /> }
            {this.state.showContext && <ContextView onClose={() => this.setState({showContext:false})} onOpen={(index) => (this.setState({showContext:false}), this.showSection(index))} context={this.ebook.context} currentIndex={this.#currentSectionIndex} />}
            {this.state.selectSpeaker && <SpeakerSelector onClose={() => this.onCloseSpeaker()} onStart={(e) => this.onStartSpeaker(e)} />}
        </>);
    }
}

function onLoad() {
    AppWorker.start("./sw.js", { scope: "./" })
    .catch(function(error) {
        console.error("$[Service worker registration failed]", error);
    })
    .finally(async function () {
        ReactDOM.render(
            <ReaderApp />,
            document.querySelector(".app")
        );
    });
}

window.addEventListener("load", onLoad);
// window.addEventListener("package-load", onLoad);