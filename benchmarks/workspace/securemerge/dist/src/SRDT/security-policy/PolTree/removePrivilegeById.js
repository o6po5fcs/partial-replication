/**
 * Efficiently remove a privilege from a PolTree ({@link PolTree}).
 * Traverses the tree from root to leaves, but only along the nodes that involve the given privilege.
 * @param node The root node of a PolTree.
 * @param privilegeId The privilege to remove from the PolTree, identified by a unique id
 */
export function removePrivilegeById(node, privilegeId) {
    // If the privilege can be removed in the current node, then also remove it recursively from the children.
    if (node.removePrivilege(privilegeId)) {
        for (const [pathExpression, child] of node.plainKeyChildren.entries()) {
            // first remove the privilege from the children ...
            removePrivilegeById(child, privilegeId);
            // ... then remove children from the current node which have become empty.
            if (child.isEmpty()) {
                node.removeChild(pathExpression);
            }
        }
        for (const [pathExpression, child] of node.expressionKeyChildren.entries()) {
            // first remove the privilege from the children ...
            removePrivilegeById(child, privilegeId);
            // ... then remove children from the current node which have become empty.
            if (child.isEmpty()) {
                node.removeChild(pathExpression);
            }
        }
    }
}
//# sourceMappingURL=removePrivilegeById.js.map