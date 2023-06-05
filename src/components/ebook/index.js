
import Epub from "epubjs";
import FelisDB from "felisdb";
import { DBConfiguration } from "../../config";
import * as zip from "@zip.js/zip.js";

export class EBook {
    #zip;
    #zipOpt;
    #epub;
    #rawData;

    constructor() {
        this.requestHandler = this.request.bind(this);
        this.#rawData = undefined;
        this.#zip = undefined;
        this.#zipOpt = undefined;
        this.#epub = undefined;
    }

    findResourceItem(_itemPath) {
        if (this.#zip) {
            _itemPath = String(_itemPath||"");
            let item = this.#zip.find(_itemPath);
            if (!item && (_itemPath[0] === "/")) {
                item = this.#zip.find(_itemPath.substring(1));
            }
            return item;
        }
    }

    async request(_urlStr, _type) {
        let url = new URL(_urlStr);
        let item = this.findResourceItem(url.pathname);
        if (item) {
            if (_type === "blob") {
                return await item.getBlob(null, this.#zipOpt);
            } else {
                let text = await item.getText(null, this.#zipOpt);
                if (text) {
                    if (_type === "json") {
                        return JSON.parse(text);
                    } else if (_type == "xhtml") {
                        return (new DOMParser()).parseFromString(text, "application/xhtml+xml");
                    } else if(_type === "html" || _type === "htm") {
                        return (new DOMParser()).parseFromString(text, "text/html");
                    } else {
                        return (new DOMParser()).parseFromString(text, "text/xml");
                    }
                }
            }
        }
    }

    async load(_blob) {
        Array.from(this.#epub?.resources?.replacementUrls||[]).forEach(e => URL.revokeObjectURL(e));
        this.#zip = new zip.fs.FS();
        this.#zipOpt = undefined;
        this.#epub?.destroy();
        this.#epub = undefined;
        this.#rawData = undefined;
        let entries = await this.#zip.importBlob(_blob);
        if (entries) {
            if (entries.find(e => e && e.isPasswordProtected())) {
                let password;
                let event = new CustomEvent("get-ebook-password", {
                    detail: { },
                  });
                do {
                    window.dispatchEvent(event);
                    password = event.detail.password;
                    (password instanceof Promise) && (password = await password);
                } while (password && (!await this.#zip.checkPassword(password)));
                if (!password) {
                    this.#zip = undefined;
                } else {
                    this.#zipOpt = { password };
                }
            }
            if (this.#zip) {
                let opf = entries.find(e => e?.name?.toLowerCase().endsWith(".opf"));
                opf && (opf = await opf.getBlob(null, this.#zipOpt));
                if (opf) {
                    let url = URL.createObjectURL(opf);
                    this.#epub = Epub(url, {
                        requestMethod: this.requestHandler,
                        // replacements: "blobUrl"
                    });
                    await this.#epub.opened;
                    URL.revokeObjectURL(url);
                    this.#epub.resources.settings.replacements = "blobUrl";
                    await this.#epub.resources.replacements();
                    this.#rawData = _blob;
                    return true;
                } else {
                    this.#zip = undefined;
                }
            }
        }
    }

    get zip() {
        return this.#zip;
    }

    get epub() {
        return this.#epub;
    }

    get rawData() {
        return this.#rawData;
    }

    get context() {
        return this.#epub?.navigation?.toc||[];
    }

    async hash() {
        return (this.#rawData instanceof Blob) ? new Uint8Array(await crypto.subtle.digest("SHA-256", await this.#rawData.arrayBuffer())).join(":") : undefined;
    }

    get fileName() {
        return this.#rawData?.name;
    }

    get title() {
        return this.#epub?.package?.metadata?.title || "";
    }

    get creator() {
        return this.#epub?.package?.metadata?.creator || "";
    }

    async getCover() {
        let item = this.findResourceItem(this.#epub?.resolve(this.#epub?.package?.coverPath, false));
        if (item) {
            return await item.getData64URI();
        }
    }

    loadSection(_contextItem, _keepOrigin) {
        if (_contextItem) {
            let promise = this.#epub?.spine.get(_contextItem?.href).load(this.requestHandler);
            (!_keepOrigin) && (promise = promise.then(doc => {
                doc.innerHTML = this.#epub.resources.substitute(doc.innerHTML);
                return doc;
            }));
            return promise;
        } else {
            Promise.resolve(undefined);
        }
    }
}