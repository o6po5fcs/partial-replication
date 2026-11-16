import { pathFullyMatchesPathSelector } from "./pathFullyMatchesPathSelector.js";
import { getPathSelector } from "./getPathSelector.js";
import { yieldsUpdateAccess } from "./yieldsUpdateAccess.js";
/**
 * Checks whether a path is writable according to the given security policy.
 * A concrete document is required as one of the arguments because it is not possible to check, based on just the
 * security policy alone, whether it is permitted to add or write a value.
 *
 * @param writtenToPath A path in an object usually given by a library call to Automerge
 * @param writtenValue The value that was written to the document at the given path
 * @param beforeDoc The state of the document before the value was written to it
 * @param securityPolicy A security policy to check the path against
 * @param userEnv A user environment to correctly evaluate the {@link securityPolicy}
 */
export function isUpdateable(writtenToPath, writtenValue, beforeDoc, securityPolicy, userEnv) {
    const lastKeyIdx = writtenToPath.length - 1;
    const writtenToKey = writtenToPath[lastKeyIdx];
    const accessedPath = writtenToPath.slice(0, lastKeyIdx);
    for (const privilege of securityPolicy) {
        const pathSelector = getPathSelector(privilege);
        if (yieldsUpdateAccess(privilege, writtenToKey, userEnv)
            && pathFullyMatchesPathSelector(accessedPath, pathSelector, userEnv)) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=isUpdateable.js.map