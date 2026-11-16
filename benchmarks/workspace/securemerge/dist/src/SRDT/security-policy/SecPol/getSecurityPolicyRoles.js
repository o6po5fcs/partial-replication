import { Wildcard } from "./types.js";
/**
 * Returns just the roles in a {@link SecurityPolicy}
 * @param securityPolicy The security policy to extract the roles from
 * @param includeWildcard Whether to include the wildcard role or not
 * @returns An array of roles.
 */
export function getSecurityPolicyRoles(securityPolicy, includeWildcard = false) {
    const roles = new Set();
    for (const privilege of securityPolicy) {
        const role = privilege[1];
        if (role === Wildcard && includeWildcard) {
            roles.add(role);
        }
        else {
            roles.add(role);
        }
    }
    return Array.from(roles);
}
//# sourceMappingURL=getSecurityPolicyRoles.js.map