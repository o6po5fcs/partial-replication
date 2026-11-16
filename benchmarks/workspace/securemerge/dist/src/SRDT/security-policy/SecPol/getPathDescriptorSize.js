import { getPathSelector } from "./getPathSelector.js";
import { isCreateAccess, isDeleteAccess, isReadAccess, isUpdateAccess } from "./types.js";
import { getAccess } from "./getAccess.js";
/**
 * Return the size of the paths that are described by a privilege.
 * This can be 1 more than the length of the path selector, since CREATE, UPDATE and DELETE privileges go 1 level deeper than READ privileges
 * @param privilege A privilege to get the path size from
 */
export function getPathDescriptorSize(privilege) {
    const access = getAccess(privilege);
    const pathSelector = getPathSelector(privilege);
    if (isReadAccess(access)) {
        return pathSelector.length;
    }
    else if (isCreateAccess(access) || isUpdateAccess(access) || isDeleteAccess(access)) {
        return pathSelector.length + 1;
    }
    else {
        throw new Error(`Unhandled access type`);
    }
}
//# sourceMappingURL=getPathDescriptorSize.js.map