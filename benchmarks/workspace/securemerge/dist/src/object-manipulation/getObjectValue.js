/**
 * Get the value of a JavaScript object at a particular path in the object from the root
 * @param val The object to descend into
 * @param path The path in the object from the root
 * @throws RangeError when the object does not contain the requested path
 */
export function getObjectValue(val, path) {
    if (!(typeof val === "object"))
        throw new RangeError("Cannot descend into scalar value");
    let currentValue = val;
    for (const key of path) {
        if (currentValue === null || !(typeof currentValue === "object") || !Reflect.has(currentValue, key)) {
            throw new RangeError("Object does not contain the requested path");
        }
        else {
            currentValue = Reflect.get(currentValue, key);
        }
    }
    return currentValue;
}
//# sourceMappingURL=getObjectValue.js.map