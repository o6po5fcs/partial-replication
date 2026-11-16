import { addPrivilegeRecursively } from "./addPrivilegeRecursively.js";
/**
 * Efficiently add a privilege to an existing PolTree.
 * @param root The root of the PolTree.
 * @param privilege The new privilege to add.
 */
export function addPrivilege(root, privilege) {
    const privilegeId = Symbol();
    addPrivilegeRecursively(root, privilegeId, privilege, 0);
    return privilegeId;
}
//# sourceMappingURL=addPrivilege.js.map