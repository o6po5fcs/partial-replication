import { pathFullyMatchesPathSelector } from "./pathFullyMatchesPathSelector.js";
import { getPathSelector } from "./getPathSelector.js";
import { yieldsCreateAccess } from "./yieldsCreateAccess.js";
/**
 * Checks whether a path can be created according to the given security policy.
 * Created means that the path should not yet exist in the document, and this function checks whether it can be added
 *
 * @param writtenToPath A path in an object usually given by a library call to Automerge.
 * @param writtenValue The value that was written to the document at the given path
 * @param beforeDoc The state of the document before the value was written to it
 * @param securityPolicy A security policy to check the path against
 * @param userEnv A user environment to correctly evaluate the {@link securityPolicy}
 */
export function isCreateable(writtenToPath, writtenValue, beforeDoc, securityPolicy, userEnv) {
    const lastKeyIdx = writtenToPath.length - 1;
    const writtenToKey = writtenToPath[lastKeyIdx];
    const accessedPath = writtenToPath.slice(0, lastKeyIdx);
    for (const privilege of securityPolicy) {
        const pathSelector = getPathSelector(privilege);
        if (yieldsCreateAccess(privilege, writtenToKey, userEnv)
            && pathFullyMatchesPathSelector(accessedPath, pathSelector, userEnv)) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=isCreateable.js.map