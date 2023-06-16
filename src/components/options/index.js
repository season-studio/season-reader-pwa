import { getOptionsRegister } from "./optkits";

export * as theme from "./theme";
export * as fontRate from "./fontRate";
export { OptionsView } from "./optionsView";

export function loadOptions() {
    getOptionsRegister().forEach(item => (typeof item.onload === "function") && item.onload.call(item));
}
