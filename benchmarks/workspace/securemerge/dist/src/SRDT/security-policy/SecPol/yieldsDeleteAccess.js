import { isDeleteAccess } from "./types.js";
import { getAccess } from "./getAccess.js";
import { keyMatchesPathExpression } from "./keyMatchesPathExpression.js";
/**
 * Check if a specific privilege yields {@link DeleteAccess} for a specific key.
 * @param privilege The privilege to check delete access for
 * @param key The key that is being deleted
 * @param userEnvironment The user environment required to correctly evaluate the access
 */
export function yieldsDeleteAccess(privilege, key, userEnvironment) {
    const access = getAccess(privilege);
    return isDeleteAccess(access) && keyMatchesPathExpression(key, access.pathExpression, userEnvironment);
}
//# sourceMappingURL=yieldsDeleteAccess.js.map