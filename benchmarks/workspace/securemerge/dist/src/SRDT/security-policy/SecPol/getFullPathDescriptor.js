import { getPathSelector } from "./getPathSelector.js";
import { isCreateAccess, isDeleteAccess, isReadAccess, isUpdateAccess } from "./types.js";
import { getAccess } from "./getAccess.js";
/**
 * Return a full path descriptor for a privilege; this is the path expression of a privilege extended with any keys
 * that are described within the access level. E.g.,
 *  -> (CREATE (X) of (Y ...)) has a path selector (Y ...), but path descriptor (Y ... X)
 * The length of path descriptor can be 1 more than the length of the path selector, since CREATE, UPDATE and DELETE privileges go 1 level deeper than READ privileges
 * @param privilege A privilege to get the path descriptor from
 */
export function getFullPathDescriptor(privilege) {
    const access = getAccess(privilege);
    const pathSelector = getPathSelector(privilege);
    if (isReadAccess(access)) {
        return pathSelector;
    }
    else if (isCreateAccess(access) || isUpdateAccess(access) || isDeleteAccess(access)) {
        const extraPathExpression = access.pathExpression;
        const pathSelectorCopy = pathSelector.slice();
        pathSelectorCopy.push(extraPathExpression);
        return pathSelectorCopy;
    }
    else {
        throw new Error(`Unhandled access type`);
    }
}
//# sourceMappingURL=getFullPathDescriptor.js.map