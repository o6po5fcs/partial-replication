import { NO_VALUE, computeDelta_SlowButIdiomatic } from "./computeDelta_SlowButIdiomatic.js";
import { SecPol } from "./deps.js";
import { yieldsAccessLevel } from "./yieldsAccessLevel.js";
/**
 * Compute which fields should be removed from a projected object based on a removed privilege.
 * This delta will only contain patches for values that are no longer visible according to the given privilege.
 * A delta should only be generated for fields that can no longer be read according to the security policy, which
 * means fields that are not covered by other privileges that remain.
 * @param privilege The privilege that determines which fields should be removed.
 * @param projectedObject The projected document which is a subset of the full document.
 * @param userEnv A user environment needed to correctly evaluate the path determined by the privilege.
 * @param polTree A {@link PolTree} which determines the other fields that should still be visible according to the latest security policy.
 */
export function computeDeltaDelete_SlowButIdiomatic(privilege, projectedObject, userEnv, polTree) {
    const onPathDiscovered = (path, _, valueInProjectedObject) => {
        const findAccessOptions = {
            userEnvironment: userEnv
        };
        // check if the value in the projected object is not NO_VALUE (which means there is actually a value present)
        // and also that the given polTree does not yield READ access for the given path.
        // If it *does* yield read access, then this means that READ access is provided by a different privilege
        // than the one that was removed. In this case do not create a delete patch.
        // Only create a delete patch if the polTree does not give READ access for the given path.
        if (valueInProjectedObject !== NO_VALUE && !yieldsAccessLevel(polTree, path, SecPol.AccessLevel.READ, findAccessOptions)) {
            const patch = {
                action: "del",
                path: path,
            };
            return [patch, false];
        }
        else {
            return [false, true];
        }
    };
    // the computeDelta function expects a full object and projected object, but for computing a delete
    // a full object is not required since values can only disappear from the projected object
    // hence, pass the projected object two times.
    return computeDelta_SlowButIdiomatic(privilege, projectedObject, projectedObject, userEnv, onPathDiscovered);
}
//# sourceMappingURL=computeDeltaDelete_SlowButIdiomatic.js.map