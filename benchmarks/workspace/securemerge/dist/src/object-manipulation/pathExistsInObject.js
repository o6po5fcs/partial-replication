import { getObjectValue } from "./getObjectValue.js";
/**
 * Check if a path exists in an object (i.e., that all the keys on the path are present)
 * @param val The object to descend into
 * @param path The path in the object from the root
 * @throws RangeError when the object does not contain the requested path
 */
export function pathExistsInObject(val, path) {
    try {
        const retrievedValue = getObjectValue(val, path);
        return true;
    }
    catch (e) {
        return false;
    }
}
//# sourceMappingURL=pathExistsInObject.js.map