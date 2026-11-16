import { isCreateAccess, isDeleteAccess, isReadAccess, isUpdateAccess } from "./types.js";
import { getAccess } from "./getAccess.js";
/**
 * Check if a specific privilege yields {@link ReadAccess} for a specific key.
 * @param privilege The privilege to check write access for
 */
export function yieldsReadAccess(privilege) {
    const access = getAccess(privilege);
    return isReadAccess(access) || isUpdateAccess(access) || isCreateAccess(access) || isDeleteAccess(access);
}
//# sourceMappingURL=yieldsReadAccess.js.map