import { SecurityError } from "../../errors/SecurityError.js";
/**
 * Validate whether a path can be created to according to a given {@link securityPolicy}.
 * Throw a security error if it cannot.
 * @param path A path in an object usually given by a library call to Automerge
 * @param writtenValue The value that was added to the document at the given path
 * @param beforeDoc The state of the document before the value was added to it
 * @param securityPolicy A security policy to check the path against
 * @param userEnv A user environment to correctly evaluate the {@link securityPolicy}
 * @throws SecurityError When it is forbidden according to the security policy to write to this path
 */
export function validateCreate(path, writtenValue, beforeDoc, securityPolicy, userEnv) {
    if (securityPolicy.isCreateable(path, writtenValue, beforeDoc, userEnv)) {
        return true;
    }
    else {
        throw new SecurityError("CREATE forbidden");
    }
}
//# sourceMappingURL=validateCreate.js.map