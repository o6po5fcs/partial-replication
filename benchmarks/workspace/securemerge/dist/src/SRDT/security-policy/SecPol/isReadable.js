import { AccessLevel, isCreateAccess, isDeleteAccess, isUpdateAccess } from "./types.js";
import { privilegeYieldsAccessLevel } from "./privilegeYieldsAccessLevel.js";
import { getPathSelector } from "./getPathSelector.js";
import { pathPartiallyMatchesPathSelector } from "./pathPartiallyMatchesPathSelector.js";
import { getAccess } from "./getAccess.js";
/**
 * Checks whether a path is readable according to the given security policy
 * @param path A path in an object usually given by a library call to Automerge
 * @param securityPolicy A security policy to check the path against
 * @param userEnv A user environment to correctly evaluate the {@link securityPolicy}
 */
export function isReadable(path, securityPolicy, userEnv) {
    for (const privilege of securityPolicy) {
        const pathSelector = getPathSelector(privilege);
        if (privilegeYieldsAccessLevel(privilege, AccessLevel.READ)) {
            const access = getAccess(privilege);
            switch (access.type) {
                case AccessLevel.READ: {
                    if (pathPartiallyMatchesPathSelector(path, pathSelector, userEnv)) {
                        return true;
                    }
                    else {
                        // break to end switch statement and continue the for loop
                        break;
                    }
                }
                case AccessLevel.CREATE:
                case AccessLevel.UPDATE:
                case AccessLevel.DELETE: {
                    if (isCreateAccess(access) || isDeleteAccess(access) || isUpdateAccess(access)) {
                        const fullPathSelector = [...pathSelector, access.pathExpression];
                        if (pathPartiallyMatchesPathSelector(path, fullPathSelector, userEnv)) {
                            return true;
                        }
                        else {
                            // break to end switch statement and continue the for loop
                            break;
                        }
                    }
                    else {
                        throw new RangeError("Expected CREATE, UPDATE or DELETE access type");
                    }
                }
                default: {
                    throw new RangeError("Unknown access type");
                }
            }
        }
    }
    return false;
}
//# sourceMappingURL=isReadable.js.map