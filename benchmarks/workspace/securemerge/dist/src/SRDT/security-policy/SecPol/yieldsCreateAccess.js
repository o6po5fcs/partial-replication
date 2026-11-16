import { isCreateAccess } from "./types.js";
import { getAccess } from "./getAccess.js";
import { keyMatchesPathExpression } from "./keyMatchesPathExpression.js";
/**
 * Check if a specific privilege yields {@link CreateAccess} for a specific key.
 * @param privilege The privilege to check Add access for
 * @param key The key that is being added
 * @param userEnvironment The user environment required to correctly evaluate the access
 */
export function yieldsCreateAccess(privilege, key, userEnvironment) {
    const access = getAccess(privilege);
    return isCreateAccess(access) && keyMatchesPathExpression(key, access.pathExpression, userEnvironment);
}
//# sourceMappingURL=yieldsCreateAccess.js.map