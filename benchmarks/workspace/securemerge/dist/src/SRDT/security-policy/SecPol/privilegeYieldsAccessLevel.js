import { AccessLevel, Permission } from "./types.js";
/**
 * Check if a specific privilege grants a desired access level.
 * This is to cover the situation where different access levels imply other access levels, for example,
 * {@link AccessLevel.UPDATE} implies {@link AccessLevel.READ}.
 * @param privilege The privilege to check the {@link AccessLevel} for.
 * @param desiredAccessLevel The type of access to check for
 */
export function privilegeYieldsAccessLevel(privilege, desiredAccessLevel) {
    const [permission, _, access, __] = privilege;
    if (permission !== Permission.ALLOW) {
        return false;
    }
    else {
        switch (desiredAccessLevel) {
            case AccessLevel.CREATE: {
                return access.type === AccessLevel.CREATE;
            }
            case AccessLevel.READ: {
                return access.type === AccessLevel.CREATE || access.type === AccessLevel.READ || access.type === AccessLevel.UPDATE || access.type === AccessLevel.DELETE;
            }
            case AccessLevel.UPDATE: {
                return access.type === AccessLevel.UPDATE;
            }
            case AccessLevel.DELETE: {
                return access.type === AccessLevel.DELETE;
            }
            default: {
                throw new Error(`Unhandled access level: ${desiredAccessLevel}`);
            }
        }
    }
}
//# sourceMappingURL=privilegeYieldsAccessLevel.js.map