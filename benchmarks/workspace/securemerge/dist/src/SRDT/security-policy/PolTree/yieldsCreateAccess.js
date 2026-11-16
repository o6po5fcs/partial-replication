import { traversePolTree } from "./traversePolTree.js";
/**
 * Traverse a PolTree based on a path of keys, and check whether there is CREATE access for the path.
 * @param node A {@link PolTree}, e.g., the root of a PolTree
 * @param pathToAccess A path to traverse the tree with.
 * @param keyToAdd The key that would be added at the end of the path
 * @param options Mandatory traversal options.
 * @returns True when the PolTree grants CREATE access for the given {@link pathToAccess}, or False otherwise.
 */
export function yieldsCreateAccess(node, pathToAccess, keyToAdd, options) {
    return traversePolTree(node, pathToAccess, options, (currentNode, currentPathPos) => {
        // check the access level if the end of the path is reached
        return currentPathPos === pathToAccess.length && currentNode.allowsCreateAccess(keyToAdd, options.userEnvironment);
    });
}
//# sourceMappingURL=yieldsCreateAccess.js.map