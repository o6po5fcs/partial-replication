import { Wildcard } from "./types.js";
/**
 * Project a {@link SecurityPolicy} for a single {@link Role}.
 * @param securityPolicy The security policy to project
 * @param role The role to project the security policy for
 * @returns A new security policy that contains only the privileges that apply to the specific role
 */
export function projectSecurityPolicy(securityPolicy, role) {
    const policyExcerpt = [];
    for (const [permission, privilegeRole, accessLevel, pathSelector] of securityPolicy) {
        if (role === privilegeRole) {
            // if the role matches the privilege exactly, then add the privilege to the policy excerpt
            policyExcerpt.push([permission, privilegeRole, accessLevel, pathSelector]);
        }
        else if (privilegeRole === Wildcard) {
            // if the privilege's role is a wildcard, add the privilege to the policy excerpt but
            // replace the wildcard with the role itself
            policyExcerpt.push([permission, role, accessLevel, pathSelector]);
        }
    }
    return policyExcerpt;
}
//# sourceMappingURL=projectSecurityPolicy.js.map