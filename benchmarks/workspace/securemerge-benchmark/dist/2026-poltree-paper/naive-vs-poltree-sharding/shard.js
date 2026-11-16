import { SRDT } from "../../deps.js";
/**
 * Project an object according to a {@link SRDT.SecurityPolicy}.
 * @param data The vanilla JS object to project.
 * @param policyExcerpt A security policy. Note that the roles in the security policy are ignored.
 * To project the data from the perspective of a single roll, pass in the security policy excerpt that corresponds
 * to the desired role.
 * @param userEnv The {@link UserEnvironment} needed to correctly evaluate the given security policy.
 * @returns a JavaScript object which contains only the data that can be read according to the given {@link policyExcerpt}.
 */
export function shard(data, policyExcerpt, userEnv) {
    // Generate a list of all full paths in the document
    const allPaths = SRDT.ObjectManipulation.getAllObjectPaths(data);
    const newData = {};
    for (const path of allPaths) {
        // check that the path is readable.
        if (policyExcerpt.isReadable(path, userEnv) && data && typeof data === "object") {
            const value = SRDT.ObjectManipulation.getObjectValue(data, path);
            if (SRDT.ObjectManipulation.isAtomicValue(value)) {
                //console.debug(`projectData: copying value: ${value} with typeof ${typeof value}`);
                SRDT.ObjectManipulation.setObjectValue(newData, path, value);
            }
            else if (value instanceof Object) {
                SRDT.ObjectManipulation.setObjectValue(newData, path, {});
            }
            else {
                throw new RangeError("unknown value type");
            }
        }
    }
    return newData;
}
//# sourceMappingURL=shard.js.map