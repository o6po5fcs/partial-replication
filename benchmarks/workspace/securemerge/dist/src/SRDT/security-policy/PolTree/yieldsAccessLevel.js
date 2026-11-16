import { AccessLevel } from "../SecPol/types.js";
import { yieldsReadAccess } from "./yieldsReadAccess.js";
import { yieldsUpdateAccess } from "./yieldsUpdateAccess.js";
import { yieldsCreateAccess } from "./yieldsCreateAccess.js";
import { yieldsDeleteAccess } from "./yieldsDeleteAccess.js";
/**
 * Traverse a PolTree based on a path of keys, and check the {@link SecPol.AccessLevel} for said path
 * @param node A {@link PolTree}, e.g., the root of a PolTree
 * @param path A path to traverse the tree with.
 * @param desiredAccessLevel The access level that should be found for the given {@link path}.
 * @param options Mandatory traversal options.
 * @returns True when the PolTree grants the {@link desiredAccessLevel} for the given {@link path}, or False otherwise.
 */
export function yieldsAccessLevel(node, path, desiredAccessLevel, options) {
    if (desiredAccessLevel === AccessLevel.READ) {
        return yieldsReadAccess(node, path, options);
    }
    else {
        const key = path[path.length - 1];
        const pathToAccess = path.slice(0, path.length - 1);
        switch (desiredAccessLevel) {
            case AccessLevel.UPDATE: {
                return yieldsUpdateAccess(node, pathToAccess, key, options);
            }
            case AccessLevel.CREATE: {
                return yieldsCreateAccess(node, pathToAccess, key, options);
            }
            case AccessLevel.DELETE: {
                return yieldsDeleteAccess(node, pathToAccess, key, options);
            }
            default: {
                throw new RangeError(`PolTree does not support access level ${desiredAccessLevel}`);
            }
        }
    }
}
//# sourceMappingURL=yieldsAccessLevel.js.map