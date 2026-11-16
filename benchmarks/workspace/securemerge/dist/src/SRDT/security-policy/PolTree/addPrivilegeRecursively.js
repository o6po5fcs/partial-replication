import { PolTree } from "./PolTree.js";
import { SecPol } from "./deps.js";
/**
 * Efficienty add a privilege to an existing PolTree, recursively (meaning all the way to the leaves).
 * @param node The node for which to add the privilege, initially the root node of the PolTree
 * @param privilegeId The {@link PolTreePrivilegeId} for the new privilege.
 * @param privilege The {@link PolTreePrivilegeType} to add to the PolTree
 * @param pathSelectorPosition The position in the path selector of the current {@link PathExpression} that should be considered for the current node. Initially 0, i.e., the first pathExpression of the path selector.
 */
export function addPrivilegeRecursively(node, privilegeId, privilege, pathSelectorPosition) {
    const addOrMakeNodeRecursively = (pathExpression) => {
        const childPathSelectorPosition = pathSelectorPosition + 1;
        if (node.hasChild(pathExpression)) {
            const existingChild = node.getChild(pathExpression);
            addPrivilegeRecursively(existingChild, privilegeId, privilege, childPathSelectorPosition);
        }
        else {
            const newChild = new PolTree(pathExpression);
            node.addChild(pathExpression, newChild);
            addPrivilegeRecursively(newChild, privilegeId, privilege, childPathSelectorPosition);
        }
    };
    const pathSelector = SecPol.getPathSelector(privilege);
    if (pathSelectorPosition === pathSelector.length) {
        // if we are at the end of the path selector, then everything was processed and no other children need to be added
        node.addTerminalPrivilege(privilegeId, privilege);
    }
    else {
        node.addPrivilege(privilegeId, privilege);
        // recursively add the privilege all the way down into the leaves of the PolTree
        const pathExpression = SecPol.getPathExpression(privilege, pathSelectorPosition);
        if (SecPol.isUnionPathExpression(pathExpression)) {
            const [unionSymbol, ...subExpressions] = pathExpression;
            for (const subExp of subExpressions) {
                addOrMakeNodeRecursively(subExp);
            }
        }
        else {
            addOrMakeNodeRecursively(pathExpression);
        }
    }
}
//# sourceMappingURL=addPrivilegeRecursively.js.map