import FelisDB from "felisdb";
import { DBConfiguration } from "../../config";
import * as zip from "@zip.js/zip.js";
import { input, tip } from "../../../thirdpart/toolkits/src/tip";

const theDB = new FelisDB(DBConfiguration.Name, DBConfiguration.Configuration);

export const PluginObjects = {};

export const PluginFunctions = {};

export const PluginManager = Object.seal({
    async fetch(_pluginName) {
        try {
            let pluginRawData = await fetch(`./plugins/${_pluginName}`);
            pluginRawData = await pluginRawData.blob();

            let pluginPack = new zip.fs.FS();
            let entries = await pluginPack.importBlob(pluginRawData);
            if (entries) {
                let zipOpt = {};
                if (entries.find(e => e && e.isPasswordProtected())) {
                    do {
                        let password = await input({
                            title: "插件密码",
                            tip: "请输入密码",
                            inputType: "password"
                        });
                        if (password) {
                            if (!await pluginPack.checkPassword(password)) {
                                tip("密码错误", {type:"error"});
                            } else {
                                zipOpt.password = password;
                            }
                        } else {
                            return;
                        }
                    } while(!zipOpt.password);
                }

                _pluginName.endsWith("#zssz") && (_pluginName = _pluginName.substring(0, _pluginName.length - 5));

                let indexScript = entries.find(e => e?.name === "index");
                if (indexScript && _pluginName) {
                    indexScript = await indexScript.getText(null, zipOpt);
                    let store = theDB.accessStore("plugins", "rw");
                    try {
                        store.put({
                            key: _pluginName,
                            content: indexScript
                        });
                        let obj = {};
                        (new Function("global", "PluginManager", "CurrentPlugin", indexScript))(window, PluginManager, obj);
                        PluginObjects[_pluginName] = obj;
                        obj.install?.call(obj);
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
        } catch (err) {
            console.log(`无法加载插件 ${_pluginName}`, err);
            throw err;
        }
    },
    async loadAll() {
        let store = theDB.accessStore("plugins", "r");
        await store.forEach((item) => {
            try {
                console.log("load plugin", item.key);
                let obj = {};
                (new Function("global", "PluginManager", "CurrentPlugin", item.content))(window, PluginManager, obj);
                PluginObjects[item.key] = obj;
                obj.install?.call(obj);
            } catch (err) {
                console.log(`无法加载插件 ${_pluginName}`, err);
                throw err;
            }
        })
    },
    async uninstall(_pluginName) {
        try {
            let obj = PluginObjects[_pluginName];
            let ret = obj.uninstall?.call(obj);
            if (ret instanceof Promise) {
                await ret;
            }
        } catch(err) {
            console.log(`无法卸载插件 ${_pluginName}`, err);
            throw err;
        }
    },
    async remove(_pluginName) {
        await this.uninstall(_pluginName);
        console.log("remove plugin", _pluginName);
        let store = theDB.accessStore("plugins", "rw");
        try {
            await store.delete([_pluginName]).lastResult();
        } catch (err) {
            console.log(`无法删除插件 ${_pluginName}`, err);
            throw err;
        }
    },
    async unloadAll() {
        for (let key in PluginObjects) {
            await this.uninstall(key);
        }
    },
    queryPlugin(_name) {
        return PluginObjects[_name];
    },
    registryFunction(_name, _fn) {
        if (_name && (typeof _fn === "function")) {
            PluginFunctions[_name] = _fn;
        }
    },
    unregistryFunction(_name) {
        if (_name) {
            delete PluginFunctions[_name];
        }
    },
    queryFunction(_name) {
        return PluginFunctions[_name];
    }
});