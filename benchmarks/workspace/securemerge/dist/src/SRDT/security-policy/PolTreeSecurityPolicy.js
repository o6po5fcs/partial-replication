import { PolTree, SecPol } from "./deps.js";
export class PolTreeSecurityPolicy {
    root;
    constructor(privileges) {
        this.root = PolTree.fromPrivileges(privileges);
    }
    isCreateable(writtenToPath, writtenValue, beforeDoc, userEnv) {
        return PolTree.yieldsAccessLevel(this.root, writtenToPath, SecPol.AccessLevel.CREATE, {
            userEnvironment: userEnv,
            writeAccessOptions: {
                writtenValue: writtenValue, beforeDocument: beforeDoc
            }
        });
    }
    isDeletable(pathToDeletedField, beforeDoc, userEnv) {
        return PolTree.yieldsAccessLevel(this.root, pathToDeletedField, SecPol.AccessLevel.DELETE, { userEnvironment: userEnv });
    }
    isReadable(path, userEnv) {
        return PolTree.yieldsAccessLevel(this.root, path, SecPol.AccessLevel.READ, { userEnvironment: userEnv });
    }
    isUpdateable(writtenToPath, writtenValue, beforeDoc, userEnv) {
        return PolTree.yieldsAccessLevel(this.root, writtenToPath, SecPol.AccessLevel.UPDATE, {
            userEnvironment: userEnv,
            writeAccessOptions: {
                writtenValue, beforeDocument: beforeDoc
            }
        });
    }
    /**
     * Remove a privilege from the security policy
     * @param privilege The privilege to remove.
     */
    removePrivilegeByValue(privilege) {
        PolTree.removePrivilegeByValue(this.root, privilege);
    }
    /**
     * Remove a privilege from the security policy
     * @param privilegeId An id (e.g., the result of {@link addPrivilege}) that identifies the privilege to remove.
     */
    removePrivilegeById(privilegeId) {
        PolTree.removePrivilegeById(this.root, privilegeId);
    }
    /**
     * Add a privilege to the security policy
     * @param privilege The privilege to add.
     * @returns A unique identifier for the added privilege
     */
    addPrivilege(privilege) {
        return PolTree.addPrivilege(this.root, privilege);
    }
    /**
     * Compute a migration after removing a privilege from the current security policy.
     * Assumption: the given privilege was already removed from the current security policy using {@link removePrivilege}
     * @param removedPrivilege The privilege that was removed from this security policy
     * @param shard The shard that was computed based on the old version of this security policy that still included the removed privilege.
     * @param userEnv The user environment needed to correctly evaluate the security policy
     */
    migrateRemove(removedPrivilege, shard, userEnv) {
        // return PolTree.computeDeltaDelete(shard, removedPrivilege, this, userEnv);
        return PolTree.computeDeltaDelete_SlowButIdiomatic(removedPrivilege, shard, userEnv, this.root);
    }
    /**
     * Compute a migration after adding a privilege to the current security policy.
     * Assumption: the given privilege has already been added to the current security policy using {@link addPrivilege}
     * @param addedPrivilege The privilege that was added to this security policy
     * @param fullObj The full object on which {@link shard} is based
     * @param shard The shard that was computed based on the old version of this security policy that did not include the added privilege.
     * @param userEnv The user environment needed to correctly evaluate the security policy
     */
    migrateAdd(addedPrivilege, fullObj, shard, userEnv) {
        return PolTree.computeDeltaAdd(fullObj, shard, addedPrivilege, userEnv);
    }
    height() {
        return this.root.depth() + 1;
    }
}
//# sourceMappingURL=PolTreeSecurityPolicy.js.map