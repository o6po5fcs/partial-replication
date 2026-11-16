import { traversePolTree } from "./traversePolTree.js";
/**
 * Traverse a PolTree based on a path of keys, and check whether there is DELETE access for the path.
 * @param node A {@link PolTree}, e.g., the root of a PolTree
 * @param pathToAccess A path to traverse the tree with.
 * @param keyToDelete The key that would be deleted at the end of the path
 * @param options Mandatory traversal options.
 * @returns True when the PolTree grants DELETE access for the given {@link pathToAccess}, or False otherwise.
 */
export function yieldsDeleteAccess(node, pathToAccess, keyToDelete, options) {
    return traversePolTree(node, pathToAccess, options, (currentNode, currentPathPos) => {
        // check the access level if the end of the path is reached
        return currentPathPos === pathToAccess.length && currentNode.allowsDeleteAccess(keyToDelete, options.userEnvironment);
    });
}
//# sourceMappingURL=yieldsDeleteAccess.js.map