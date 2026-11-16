/**
 * Traverse a PolTree based on a path of keys, and do something for each node in the PoLTree
 * @param node A {@link PolTree}, e.g., the root of a PolTree
 * @param path A path to traverse the tree with.
 * @param options Mandatory traversal options.
 * @param nodeDiscovered A function that is called each time a new node in the PolTree is reached. The return value of this function is a tuple [x,y] where x determines whether the traversal should stop (true), and if so, y is the return value of this function.
 * @returns The result of nodeDiscovered or false.
 */
export function traversePolTree(node, path, options, nodeDiscovered) {
    return _traversePolTree(node, path, 0, options, nodeDiscovered);
}
/*export function traversePolTree<T,U>(
    node: PolTree,
    path: PolTreePath,
    options: PolTreeFindAccessOptions<U>,
    nodeDiscovered: (node: PolTree, pathRemaining: PolTreePath) => [boolean, T]
): T | false {
    const [stopTraversal, returnValue] = nodeDiscovered(node, path);
    if (stopTraversal) {
        return returnValue
    } else {
        // check the access level if the end of the path is reached
        if (path.length !== 0) {
            for (const child of node.children.values()) {
                const key = path[0];
                // given a key in the path, check if there is a matching edge going from the current node to a child node
                // if yes, also check whether this child eventually leads to the desired access level.
                if (SecPol.keyMatchesPathExpression(key, child.pathExpression, options.userEnvironment)) {
                    const remainingPath = path.slice();
                    remainingPath.shift();
                    const traversalResult = traversePolTree(child, remainingPath, options, nodeDiscovered);
                    if (traversalResult !== false) {
                        return traversalResult;
                    }
                }
            }
        }
        // if a positive match cannot be found, return false
        return false;
    }
}*/
export function _traversePolTree(node, path, currentPathPos, options, nodeDiscovered) {
    const res = nodeDiscovered(node, currentPathPos);
    if (res) {
        return res;
    }
    else {
        // check the access level if the end of the path is reached
        if (currentPathPos !== path.length) {
            const currentKey = path[currentPathPos];
            // given a key in the path, check if there is a matching edge going from the current node to a child node
            // if yes, also check whether this child eventually leads to the desired access level.
            const matchingChildren = node.getMatchingChildren(currentKey, options.userEnvironment);
            for (let i = 0; i < matchingChildren.length; i++) {
                const child = matchingChildren[i];
                const traversalResult = _traversePolTree(child, path, currentPathPos + 1, options, nodeDiscovered);
                if (traversalResult !== false) {
                    return traversalResult;
                }
            }
        }
        // if a positive match cannot be found, return false
        return false;
    }
}
/**
 * Traverse a PolTree based on a path of keys, and do something for each node in the PoLTree
 * @param node A {@link PolTree}, e.g., the root of a PolTree
 * @param path A path to traverse the tree with.
 * @param options Mandatory traversal options.
 * @param nodeDiscovered A function that is called each time a new node in the PolTree is reached. The return value of this function is a tuple [x,y] where x determines whether the traversal should stop (true), and if so, y is the return value of this function.
 * @returns The result of nodeDiscovered or false.

export function traversePolTreeIterative<T,U>(
    node: PolTree,
    path: PolTreePath,
    options: PolTreeFindAccessOptions<U>,
    nodeDiscovered: (node: PolTree, pathRemaining: PolTreePath) => [boolean, T]
): T | false {
    const toVisit: NodeToVisit[] = [{ node: node, path: path }];

    while (toVisit.length > 0) {
        const { node: currentNode, path: currentPath } = toVisit.pop()!;
        const [stopTraversal, returnValue] = nodeDiscovered(currentNode, currentPath);

        if (stopTraversal) {
            return returnValue;
        } else {
            // check the access level if the end of the path is reached
            if (currentPath.length !== 0) {
                // split apart the path in head/tail
                const [key, ...remainingPath] = currentPath;
                for (const child of currentNode.children.values()) {
                    // given a key in the path, check if there is a matching edge going from the current node to a child node
                    // if yes, push this child in the queue for later processing
                    if (SecPol.keyMatchesPathExpression(key, child.pathExpression, options.userEnvironment)) {
                        toVisit.push({ node: child, path: remainingPath});
                    }
                }
            }
        }
    }

    return false;
} */ 
//# sourceMappingURL=traversePolTree.js.map