/**
 * Modify the value of a JavaScript object at a given path from the root
 * @param obj A JavaScript object to modify
 * @param path A path of keys (as an array) from the root of the object
 * @param value The value to insert at the given path
 */
export function setObjectValue(obj, path, value) {
    if (path.length === 0) {
        return;
    }
    let currentObj = obj;
    for (let i = 0; i < path.length; i++) {
        const key = path[i];
        if (!(key in currentObj)) {
            Reflect.set(currentObj, key, {});
        }
        if (i < path.length - 1) {
            currentObj = Reflect.get(currentObj, key);
            if (typeof currentObj !== "object") {
                currentObj = {};
            }
        }
    }
    const lastKey = path[path.length - 1];
    Reflect.set(currentObj, lastKey, value);
}
//# sourceMappingURL=setObjectValue.js.map