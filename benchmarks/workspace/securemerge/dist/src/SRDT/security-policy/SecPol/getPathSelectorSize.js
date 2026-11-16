import { getPathSelector } from "./getPathSelector.js";
/**
 * Return the size of a path selector
 * @param privilege A privilege to get the path selector's size from
 */
export function getPathSelectorSize(privilege) {
    const pathSelector = getPathSelector(privilege);
    return pathSelector.length;
}
//# sourceMappingURL=getPathSelectorSize.js.map