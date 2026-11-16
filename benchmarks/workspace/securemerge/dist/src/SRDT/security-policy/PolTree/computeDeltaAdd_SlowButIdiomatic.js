import { NO_VALUE, computeDelta_SlowButIdiomatic } from "./computeDelta_SlowButIdiomatic.js";
import { SecPol } from "./deps.js";
import { projectData } from "../../document/mod.js";
import { makePlainSecurityPolicy } from "../mod.js";
/**
 * Compute which fields should be added to a projected object based on a newly added privilege.
 * This delta will only contain patches for values that are visible according to the given privilege,
 * and which did not yet exist in the projected object.
 * @param privilege The privilege that determines which fields have become visible.
 * @param fullObject The full document.
 * @param projectedObject The projected document which is a subset of the full document.
 * @param userEnv A user environment needed to correctly evaluate the path determined by the privilege.
 * @returns a list of patches that can be applied to the projected object to add values that have become visible
 */
export function computeDeltaAdd_SlowButIdiomatic(privilege, fullObject, projectedObject, userEnv) {
    const onPathDiscovered = (path, valueInFullObject, valueInProjectedObject) => {
        // if the value in the projected object is "NO_VALUE", then this means it is not present in the projected object.
        // In this case a new patch must be included in the result set.
        if (valueInProjectedObject === NO_VALUE) {
            // check if it is possible to traverse deeper into the value
            if (typeof valueInFullObject === "object" || Array.isArray(valueInFullObject)) {
                // modify the current privilege to exclude paths that were already traversed from the root
                const privilegeCopy = SecPol.shallowCopyPrivilege(privilege);
                const privilegePathSelector = SecPol.getPathSelector(privilege);
                const modifiedPrivilegePathSelector = privilegePathSelector.slice(path.length);
                SecPol.setPathSelector(privilegeCopy, modifiedPrivilegePathSelector);
                const singletonSecurityPolicy = makePlainSecurityPolicy([privilegeCopy]);
                // project the object according to the security policy
                const projectedValue = projectData(valueInFullObject, singletonSecurityPolicy, userEnv);
                const patch = {
                    action: "put",
                    path: path,
                    value: projectedValue
                };
                // return the patch, and tell the caller that it is not needed to traverse deeper into the valeu in the full object
                return [patch, false];
            }
            else {
                // if the value is atomic, just include the full value
                const patch = {
                    action: "put",
                    path: path,
                    value: valueInFullObject
                };
                // return the patch, and tell the caller that it is not needed to traverse deeper into the valeu in the full object
                return [patch, false];
            }
        }
        else {
            // Otherwise no value should be included in the result set
            return [false, true];
        }
    };
    return computeDelta_SlowButIdiomatic(privilege, fullObject, projectedObject, userEnv, onPathDiscovered);
}
//# sourceMappingURL=computeDeltaAdd_SlowButIdiomatic.js.map