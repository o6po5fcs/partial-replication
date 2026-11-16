/**
 * Destructively modify the privilege to get a new path selector
 * @param privilege The privilege to change the path selector of
 * @param newPathSelector The new path selector to add to the privilege
 */
export function setPathSelector(privilege, newPathSelector) {
    privilege[3] = newPathSelector;
}
//# sourceMappingURL=setPathSelector.js.map