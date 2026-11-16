import { removePrivilegeById } from "./removePrivilegeById.js";
/**
 * Efficiently remove a privilege from a PolTree ({@link PolTree}).
 * Traverses the tree from root to leaves, but only along the nodes that involve the given privilege.
 * @param node The root node of a PolTree.
 * @param privilege The privilege to remove from the PolTree. Make sure that the given privilege is included in the PolTree.
 */
export function removePrivilegeByValue(node, privilege) {
    const privilegeId = node.findPrivilegeId(privilege);
    if (privilegeId !== undefined) {
        removePrivilegeById(node, privilegeId);
    }
    else {
        throw new Error(`Cannot find id for privilege ${privilege} in the the PolTree's security policy.`);
    }
}
//# sourceMappingURL=removePrivilegeByValue.js.map