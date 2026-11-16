import { SecurityError } from "../../errors/SecurityError.js";
/**
 * Validate whether a path can be read to according to a given {@link securityPolicy}.
 * Throw a security error if it cannot.
 * @param path A path in an object usually given by a library call to Automerge
 * @param securityPolicy A security policy to check the path against
 * @param userEnv A user environment to correctly evaluate the {@link securityPolicy}
 * @throws SecurityError When it is forbidden according to the security policy to read this path
 */
export function validateRead(path, securityPolicy, userEnv) {
    if (securityPolicy.isReadable(path, userEnv)) {
        return true;
    }
    else {
        throw new SecurityError("Read forbidden");
    }
}
//# sourceMappingURL=validateRead.js.map