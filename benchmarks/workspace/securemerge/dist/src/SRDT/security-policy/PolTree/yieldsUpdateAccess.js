import { traversePolTree } from "./traversePolTree.js";
/**
 * Traverse a PolTree based on a path of keys, and check whether there is UPDATE access for the path.
 * @param node A {@link PolTree}, e.g., the root of a PolTree
 * @param pathToAccess A path to traverse the tree with.
 * @param keyToWrite A key that exists at the end of the path to which a value would be written
 * @param options Mandatory traversal options.
 * @returns True when the PolTree grants UPDATE access for the given {@link path}, or False otherwise.
 */
export function yieldsUpdateAccess(node, pathToAccess, keyToWrite, options) {
    return traversePolTree(node, pathToAccess, options, (currentNode, currentPathPos) => {
        // check the access level if the end of the path is reached
        return currentPathPos === pathToAccess.length && currentNode.allowsUpdateAccess(keyToWrite, options.userEnvironment);
    });
}
//# sourceMappingURL=yieldsUpdateAccess.js.map