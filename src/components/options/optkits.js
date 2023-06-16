const OptionsRegKey = Symbol("snsq-reader-options-registry");

export function getOptionsRegister() {
    (!(window[OptionsRegKey] instanceof Array)) && (window[OptionsRegKey] = []);
    return window[OptionsRegKey];
}

export function registryOption(_option) {
    if (_option) {
        let reg = getOptionsRegister();
        reg.push(_option);
    }
    return _option;
}

export function sortOptions() {
    getOptionsRegister().sort((a, b) => {
        let la = isNaN(a?.index) ? Number.MAX_VALUE : a.index;
        let lb = isNaN(b?.index) ? Number.MAX_VALUE : b.index;
        return (la === lb) ? 0 : ((la < lb) ? -1 : 1);
    })
}
