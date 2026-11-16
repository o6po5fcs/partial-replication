/**
 * Remove a (nested) field from a JavaScript object at a given path from the root.
 * The last field of the path will be removed.
 * @param obj A JavaScript object to modify
 * @param path A path of keys (as an array) from the root of the object
 */
export function removeObjectValue(obj, path) {
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
    delete currentObj[lastKey];
}
//# sourceMappingURL=removeObjectValue.js.map