import { traversePolTree } from "./traversePolTree.js";
/**
 * Traverse a PolTree based on a path of keys, and check whether there is READ access for the path.
 * @param node A {@link PolTree}, e.g., the root of a PolTree
 * @param path A path to traverse the tree with.
 * @param options Mandatory traversal options.
 * @returns True when the PolTree grants READ access for the given {@link path}, or False otherwise.
 */
export function yieldsReadAccess(node, path, options) {
    return traversePolTree(node, path, options, (currentNode, currentPathPos) => {
        if (currentPathPos + 1 === path.length) {
            const currentKey = path[currentPathPos];
            return currentNode.allowsCreateAccess(currentKey, options.userEnvironment)
                || currentNode.allowsUpdateAccess(currentKey, options.userEnvironment)
                || currentNode.allowsDeleteAccess(currentKey, options.userEnvironment);
        }
        else {
            return !currentNode.isRoot && currentPathPos === path.length && currentNode.allowsReadAccess();
        }
    });
}
//# sourceMappingURL=yieldsReadAccess.js.map