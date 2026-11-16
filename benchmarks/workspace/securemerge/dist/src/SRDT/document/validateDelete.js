import { SecurityError } from "../../errors/SecurityError.js";
/**
 * Validate whether field (specified by a path) can be deleted to according to a given {@link securityPolicy}.
 * Throw a security error if it cannot.
 * @param path A path in an object usually given by a library call to Automerge
 * @param beforeDoc The state of the document before the field was deleted
 * @param securityPolicy A security policy to check the path against
 * @param userEnv A user environment to correctly evaluate the {@link securityPolicy}
 * @throws SecurityError When it is forbidden according to the security policy to delete field
 */
export function validateDelete(path, beforeDoc, securityPolicy, userEnv) {
    if (securityPolicy.isDeletable(path, beforeDoc, userEnv)) {
        return true;
    }
    else {
        throw new SecurityError("DELETE forbidden");
    }
}
//# sourceMappingURL=validateDelete.js.map