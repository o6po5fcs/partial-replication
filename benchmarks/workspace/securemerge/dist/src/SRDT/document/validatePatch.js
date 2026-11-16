import { validateUpdate } from "./validateUpdate.js";
import { validateRead } from "./validateRead.js";
import { AccessLevel } from "../security-policy/mod.js";
import { validateCreate } from "./validateCreate.js";
import { validateDelete } from "./validateDelete.js";
import { getObjectValue, pathExistsInObject } from "../../object-manipulation/mod.js";
/**
 * Validate whether a {@link Automerge.Patch} is allowed to according to a given {@link securityPolicy}.
 * Throw a security error if it is not allowed.
 * @param patch An Automerge patch
 * @param beforeDoc The state of the document before applying the patch
 * @param securityPolicy A security policy to check the patches against
 * @param userEnv A user environment to correctly evaluate the {@link securityPolicy}
 * @param options Optional arguments, see {@link ValidateOptions}.
 * @throws SecurityError When it is forbidden according to the security policy to write to any given path
 */
export function validatePatch(patch, beforeDoc, securityPolicy, userEnv, options) {
    if (options && options.accessLevel) {
        if (options.accessLevel === AccessLevel.READ) {
            switch (patch.action) {
                case "put":
                case "conflict":
                case "del":
                case "inc": {
                    return validateRead(patch.path, securityPolicy, userEnv);
                }
                case "splice": {
                    // in Automerge, assigning a string to a field first sets the empty string to the field,
                    // then splices in the string content. The string can also be nested inside an array.
                    // Based on the last two indices of the patch's path, try to find out of they are numbers
                    // (i.e., an array access or a string access)
                    // and based on that information check if the peer has READ access to the object path which:
                    //   (1) contains a string that is spliced
                    //   (2) contains an array which contains a string that is spliced
                    const isStringAccess = patch.path.length > 1 && Number.isInteger(patch.path[patch.path.length - 1]);
                    const isStringWithinArrayAccess = patch.path.length > 2 && isStringAccess && Number.isInteger(patch.path[patch.path.length - 2]);
                    if (isStringWithinArrayAccess) {
                        // Since arrays are treated as atomic, if the client has access to the object path that holds
                        // the array, they will have access to all values within the array, and thus also access
                        // to see the splice patch which occurs on one such string within the array.
                        const objectPath = patch.path.slice(0, patch.path.length - 2);
                        return validateRead(objectPath, securityPolicy, userEnv);
                    }
                    else if (isStringAccess) {
                        // since strings are treated as atomic, if the client has READ access to the path that
                        // holds the string, then they will have access to read any splice that occur on the string
                        const objectPath = patch.path.slice(0, patch.path.length - 1);
                        return validateRead(objectPath, securityPolicy, userEnv);
                    }
                    else {
                        throw new Error(`Unhandled circumstances for splice patch`);
                    }
                }
                case "insert": {
                    // if this is an insert patch, since we treat array as atomic values the access will be allowed
                    // whenever READ access is granted to the path in the object where the array is stored.
                    const objectPath = patch.path.slice(0, patch.path.length - 1);
                    return validateRead(objectPath, securityPolicy, userEnv);
                }
                default:
                    throw RangeError(`unsupported patch type: ${patch.action}`);
            }
        }
        else {
            throw new RangeError("Unknown accesslevel");
        }
    }
    else {
        switch (patch.action) {
            case "del": {
                return validateDelete(patch.path, beforeDoc, securityPolicy, userEnv);
            }
            case "put":
            case "inc": {
                if (pathExistsInObject(beforeDoc, patch.path)) {
                    return validateUpdate(patch.path, patch.value, beforeDoc, securityPolicy, userEnv);
                }
                else {
                    return validateCreate(patch.path, patch.value, beforeDoc, securityPolicy, userEnv);
                }
            }
            case "conflict": {
                // a conflict patch does not do anything, it only notifies the user.
                // you get a separate "put patch" with key conflict:true when the value of some item has changed after
                // a conflict
                return true;
            }
            case "splice": {
                // in Automerge, assigning a string to a field first sets the empty string to the field,
                // then splices in the string content... so technically this is a CREATE followed by an UPDATE of
                // a field. This is awkward, so try to check if the operation is semantically a create, but practically
                // 2 patches of which (1) a create and (2) a splice ...
                // Extra complexity: this can also be nested within an array.
                const isStringAccess = patch.path.length > 1 && Number.isInteger(patch.path[patch.path.length - 1]);
                const isStringWithinArrayAccess = patch.path.length > 2 && isStringAccess && Number.isInteger(patch.path[patch.path.length - 2]);
                if (isStringWithinArrayAccess) {
                    const objectPath = patch.path.slice(0, patch.path.length - 2);
                    if (!pathExistsInObject(beforeDoc, objectPath)) {
                        return validateCreate(objectPath, patch.value, beforeDoc, securityPolicy, userEnv);
                    }
                    else {
                        return validateUpdate(objectPath, patch.value, beforeDoc, securityPolicy, userEnv);
                    }
                }
                else if (isStringAccess) {
                    const objectPath = patch.path.slice(0, patch.path.length - 1);
                    // in Automerge, assigning a string to a field first sets the empty string to the field,
                    // then splices in the string content... so technically this is a CREATE followed by an UPDATE of
                    // a field. This is awkward, so try to check if the operation is semantically a create, but practically
                    // 2 patches of which (1) a create and (2) a splice ...
                    if (!pathExistsInObject(beforeDoc, objectPath)) {
                        return validateCreate(objectPath, patch.value, beforeDoc, securityPolicy, userEnv);
                    }
                    else {
                        return validateUpdate(objectPath, patch.value, beforeDoc, securityPolicy, userEnv);
                    }
                }
                else {
                    throw new Error(`Unhandled situation`);
                }
            }
            case "insert": {
                const objectPath = patch.path.slice(0, patch.path.length - 1);
                if (!pathExistsInObject(beforeDoc, objectPath)) {
                    return validateCreate(objectPath, patch.values, beforeDoc, securityPolicy, userEnv);
                }
                else {
                    // ensure that the insert occurs for an array to which we have access
                    const objectValue = getObjectValue(beforeDoc, objectPath);
                    if (!Array.isArray(objectValue)) {
                        throw new Error(`Cannot perform insert patch for non-array value`);
                    }
                    else {
                        return validateUpdate(objectPath, patch.values, beforeDoc, securityPolicy, userEnv);
                    }
                }
            }
            default:
                throw RangeError(`unsupported patch type: ${patch.action}`);
        }
    }
}
//# sourceMappingURL=validatePatch.js.map