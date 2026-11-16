import { SecPol } from "./deps.js";
import { Graphviz } from "../../../deps.js";
export class PolTree {
    privileges;
    pathExpression;
    children;
    plainKeyChildren;
    expressionKeyChildren;
    terminalPrivileges;
    isRoot;
    constructor(pathExpression, isRoot = false) {
        this.isRoot = isRoot;
        this.privileges = new Map();
        this.pathExpression = pathExpression;
        this.children = new Map();
        this.terminalPrivileges = new Map();
        this.plainKeyChildren = new Map();
        this.expressionKeyChildren = new Map();
    }
    /**
     * Add a privilege to the current node. Does not recusively add this privilege to children (this is the responsibility
     * of an external algorithm)
     * @param id The id of the privilege.
     * @param privilege The privilege itself.
     */
    addPrivilege(id, privilege) {
        this.privileges.set(id, privilege);
    }
    /**
     * Remove a privilege from this node. This does not affect any children (an external algorithm should take care
     * of traversing the tree and updating the relevant nodes, which may include children of this node).
     * @param id The ID of the privilege to remove. If this ID is unknown, it can be looked up in the root node of the PolTree.
     * @returns true if the privilege was removed, false if the privilege did not exist in this node.
     */
    removePrivilege(id) {
        // will return false if the element is did not exist.
        return this.terminalPrivileges.delete(id) || this.privileges.delete(id);
    }
    /**
     * Check if the current node is a terminal node for a privilege.
     * @param id The id of the privilege to check.
     */
    hasTerminalPrivilege(id) {
        return this.terminalPrivileges.has(id);
    }
    /**
     * Add a new privilege to the current terminal. Make sure that the privilege actually terminates at this node,
     * otherwise the PolTree is broken.
     * @param id The id of the privilege
     * @param privilege The privilege itself.
     */
    addTerminalPrivilege(id, privilege) {
        this.terminalPrivileges.set(id, privilege);
    }
    /**
     * Check if this node allows {@link SecPol.AccessLevel.READ} access.
     */
    allowsReadAccess() {
        for (const privilege of this.privileges.values()) {
            if (SecPol.yieldsReadAccess(privilege)) {
                return true;
            }
        }
        for (const privilege of this.terminalPrivileges.values()) {
            if (SecPol.yieldsReadAccess(privilege)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if this node allows {@link SecPol.AccessLevel.UPDATE} access.
     * @param key The key that is accessed
     * @param userEnv The user environment required to evaluate the access.
     */
    allowsUpdateAccess(key, userEnv) {
        for (const privilege of this.terminalPrivileges.values()) {
            if (SecPol.yieldsUpdateAccess(privilege, key, userEnv)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if this node allows {@link SecPol.AccessLevel.CREATE} access.
     * @param key The key that is accessed
     * @param userEnv The user environment required to evaluate the access.
     */
    allowsCreateAccess(key, userEnv) {
        for (const privilege of this.terminalPrivileges.values()) {
            if (SecPol.yieldsCreateAccess(privilege, key, userEnv)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if this node allows {@link SecPol.AccessLevel.DELETE} access.
     * @param key The key that is accessed
     * @param userEnv The user environment required to evaluate the access.
     */
    allowsDeleteAccess(key, userEnv) {
        for (const privilege of this.terminalPrivileges.values()) {
            if (SecPol.yieldsDeleteAccess(privilege, key, userEnv)) {
                return true;
            }
        }
        return false;
    }
    /**
     * @returns An array of privileges which terminate in this node.
     */
    getTerminalPrivileges() {
        return Array.from(this.terminalPrivileges.values());
    }
    /**
     * Get all {@link PolTree} that match a given key.
     * @param pathExpression The path expression used to follow edges to children
     * @param userEnv The user environment to evaluate more complex path expressions
     */
    getMatchingChildren(pathExpression, userEnv) {
        const matches = [];
        for (const child of this.expressionKeyChildren.values()) {
            if (SecPol.keyMatchesPathExpression(pathExpression, child.pathExpression, userEnv)) {
                matches.push(child);
            }
        }
        const plainKeyChild = this.plainKeyChildren.get(pathExpression);
        if (plainKeyChild) {
            matches.push(plainKeyChild);
        }
        return matches;
    }
    /**
     * Add a new child to the current node. Will throw an error if a child already exists for the given path expression.
     * @param pathExpression The path expression to add the child for
     * @param child The child node itself.
     */
    addChild(pathExpression, child) {
        // Check if the path expression is a plain string, or something more complex
        if (this.isPlainkey(pathExpression)) {
            if (this.plainKeyChildren.has(pathExpression)) {
                throw new Error(`A child already exists for the given path expression.`);
            }
            else {
                this.plainKeyChildren.set(pathExpression, child);
            }
        }
        else {
            const attribute = this.pathExpressionToPolTreeAttribute(pathExpression);
            if (this.expressionKeyChildren.has(attribute)) {
                throw new Error(`A child already exists for the given path expression.`);
            }
            else {
                this.expressionKeyChildren.set(attribute, child);
            }
        }
    }
    /**
     * Get a child of this {@link PolTree}
     * @param pathExpression The path expression of the edge from parent to child to follow.
     * @returns {@link PolTree} if the child was found, undefined otherwise.
     */
    getChild(pathExpression) {
        // Check if the path expression is a plain string, or something more complex
        if (this.isPlainkey(pathExpression)) {
            return this.plainKeyChildren.get(pathExpression);
        }
        else {
            const attribute = this.pathExpressionToPolTreeAttribute(pathExpression);
            return this.expressionKeyChildren.get(attribute);
        }
    }
    /**
     * Check if the current node has an edge (i.e. a child) for the given path expression.
     * @param pathExpression The path expression to check an edge for.
     */
    hasChild(pathExpression) {
        // Check if the path expression is a plain string, or something more complex
        if (this.isPlainkey(pathExpression)) {
            return this.plainKeyChildren.has(pathExpression);
        }
        else {
            const attribute = this.pathExpressionToPolTreeAttribute(pathExpression);
            return this.expressionKeyChildren.has(attribute);
        }
    }
    /**
     * Delete a child from a node.
     * @param pathExpression The path expression which identifies the node to delete.
     */
    removeChild(pathExpression) {
        // Check if the path expression is a plain string, or something more complex
        if (this.isPlainkey(pathExpression)) {
            this.plainKeyChildren.delete(pathExpression);
        }
        else {
            const attribute = this.pathExpressionToPolTreeAttribute(pathExpression);
            this.expressionKeyChildren.delete(attribute);
        }
    }
    /**
     * Check the depth of this PolTree. Depth is defined as the number of edges from the root to the leaves.
     */
    depth() {
        if (this.plainKeyChildren.size === 0 && this.expressionKeyChildren.size === 0) {
            return 0;
        }
        else {
            return 1 +
                Math.max(...Array.from(this.plainKeyChildren.values()).map((child) => child.depth()), ...Array.from(this.expressionKeyChildren.values()).map((child) => child.depth()));
        }
    }
    /**
     * Returns the security policy covered by the PolTree as an array.
     */
    getSecurityPolicy() {
        return Array.from(this.privileges.values());
    }
    /**
     * Find the id of a privilege in this PolTree.
     * @param privilege A privilege to look up in the PolTree.
     */
    findPrivilegeId(privilege) {
        for (const [id, storedPrivilege] of this.privileges.entries()) {
            if (SecPol.arePrivilegesEqual(privilege, storedPrivilege)) {
                return id;
            }
        }
        return undefined;
    }
    /**
     * Check whether this node covers a given privilege, identified by it's ID in the PolTree.
     * Covering a privilege means that a given privilege id either terminates in this node, or that one of the children
     * has this privilege.
     * @param id The identifier of the privilege in the PolTree. Given a privilege, its id can be looked up in the root node.
     */
    coversPrivilege(id) {
        return this.terminalPrivileges.has(id) || this.privileges.has(id);
    }
    /**
     * Check whether the node is empty. This means that:
     *   - It does not terminate any privileges
     *   - It does not have any children.
     */
    isEmpty() {
        return this.terminalPrivileges.size === 0 && this.plainKeyChildren.size === 0 && this.expressionKeyChildren.size === 0;
    }
    /**
     * Build a Graphviz node from the current PolTreeNode.
     * @param idGenerator A function that returns a unique identifier within the Graphviz graph.
     * @param graph A Graphviz graph
     */
    buildGraphvizNode(idGenerator, graph = new Graphviz.Digraph()) {
        const id = idGenerator();
        const label = `${this.privileges.size}p`;
        const currentNode = new Graphviz.Node(id, {
            [Graphviz.attribute.label]: label
        });
        graph.addNode(currentNode);
        for (const [attribute, child] of [...this.plainKeyChildren.entries(), ...this.expressionKeyChildren.entries()]) {
            const childNode = child.buildGraphvizNode(idGenerator, graph);
            const edge = new Graphviz.Edge([currentNode, childNode], {
                [Graphviz.attribute.label]: JSON.stringify(attribute)
            });
            graph.addEdge(edge);
        }
        for (const [id, privilege] of this.terminalPrivileges) {
            const terminalBox = new Graphviz.Node(idGenerator(), {
                [Graphviz.attribute.shape]: "box",
                [Graphviz.attribute.label]: JSON.stringify(SecPol.getPathSelector(privilege)),
            });
            const edge = new Graphviz.Edge([currentNode, terminalBox]);
            graph.addNode(terminalBox);
            graph.addEdge(edge);
        }
        return currentNode;
    }
    /**
     * Convert the current PolTreeNode to a Graphviz string which can be visualised using Graphviz tools.
     */
    toGraphvizDot() {
        const graph = new Graphviz.Digraph();
        let currentId = 0;
        const idGenerator = () => {
            currentId = currentId + 1;
            return currentId.toString();
        };
        this.buildGraphvizNode(idGenerator, graph);
        return Graphviz.toDot(graph);
    }
    /**
     * Converts a path expression to a string that uniquely identifies the outgoing edge
     * @param pathExpression The path expression to stringify
     * @private
     */
    pathExpressionToPolTreeAttribute(pathExpression) {
        if (SecPol.isPathExpressionKeyOperator(pathExpression)) {
            const [opName, key] = pathExpression;
            return `[${opName},${key}]`;
        }
        else if (SecPol.isPathExpressionEnvOperator(pathExpression)) {
            const [opName, envLookup] = pathExpression;
            const restString = envLookup.join(",");
            return `[${opName},[${restString}]]`;
        }
        else if (SecPol.isUnionPathExpression(pathExpression)) {
            throw new RangeError(`Cannot convert union path expression to PolTreeAttributeType.`);
        }
        else {
            return pathExpression;
        }
    }
    isPlainkey(pathExpression) {
        return typeof pathExpression === "string" && pathExpression !== SecPol.Wildcard;
    }
}
//# sourceMappingURL=PolTree.js.map