import { pathFullyMatchesPathSelector } from "./pathFullyMatchesPathSelector.js";
import { getPathSelector } from "./getPathSelector.js";
import { yieldsDeleteAccess } from "./yieldsDeleteAccess.js";
/**
 * Checks whether a path can be deleted according to the given security policy.
 * A concrete document is required as one of the arguments because it is not possible to check, based on just the
 * security policy alone, whether it is permitted to add or write a value.
 *
 * @param pathToDeletedField A path in an object usually given by a library call to Automerge
 * @param beforeDoc The state of the document before the value was deleted, although note that the value is not necessarily present in the doc
 * @param securityPolicy A security policy to check the path against
 * @param userEnv A user environment to correctly evaluate the {@link securityPolicy}
 */
export function isDeletable(pathToDeletedField, beforeDoc, securityPolicy, userEnv) {
    const lastKeyIdx = pathToDeletedField.length - 1;
    const writtenToKey = pathToDeletedField[lastKeyIdx];
    const accessedPath = pathToDeletedField.slice(0, lastKeyIdx);
    for (const privilege of securityPolicy) {
        const pathSelector = getPathSelector(privilege);
        if (yieldsDeleteAccess(privilege, writtenToKey, userEnv)
            && pathFullyMatchesPathSelector(accessedPath, pathSelector, userEnv)) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=isDeletable.js.map