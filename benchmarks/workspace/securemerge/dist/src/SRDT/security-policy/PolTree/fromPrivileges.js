import { PolTree } from "./PolTree.js";
import { addPrivilege } from "./addPrivilege.js";
/**
 * Build a new PolTree from a security policy.
 * @param securityPolicy The security policy to build a PolTree for.
 */
export function fromPrivileges(securityPolicy) {
    const rootNode = new PolTree("<<ROOT>>", true);
    // Assign a unique id to each privilege in the security policy.
    // It is sufficient to make this id the index in the array that it currently resides in.
    for (const privilege of securityPolicy) {
        addPrivilege(rootNode, privilege);
    }
    return rootNode;
}
//# sourceMappingURL=fromPrivileges.js.map