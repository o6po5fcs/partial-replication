import { validatePatch } from "./validatePatch.js";
/**
 * Validate whether an array of {@link Automerge.Patch} is allowed to according to a given {@link securityPolicy}.
 * Throw a security error if it cannot.
 * @param patches A list of Automerge patches
 * @param beforeDoc The state of the document before applying the patch
 * @param securityPolicy A security policy to check the patches against
 * @param userEnv A user environment to correctly evaluate the {@link securityPolicy}
 * @throws SecurityError When it is forbidden according to the security policy to write to any given path
 */
export function validatePatches(patches, beforeDoc, securityPolicy, userEnv) {
    for (const patch of patches) {
        validatePatch(patch, beforeDoc, securityPolicy, userEnv);
    }
    return true;
}
//# sourceMappingURL=validatePatches.js.map