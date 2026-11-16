import { isUpdateAccess } from "./types.js";
import { getAccess } from "./getAccess.js";
import { keyMatchesPathExpression } from "./keyMatchesPathExpression.js";
/**
 * Check if a specific privilege yields {@link UpdateAccess} for a specific key.
 * @param privilege The privilege to check write access for
 * @param key The key that is being written
 * @param userEnvironment The user environment required to correctly evaluate the access
 */
export function yieldsUpdateAccess(privilege, key, userEnvironment) {
    const access = getAccess(privilege);
    return isUpdateAccess(access) && keyMatchesPathExpression(key, access.pathExpression, userEnvironment);
}
//# sourceMappingURL=yieldsUpdateAccess.js.map