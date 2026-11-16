// Code taken from https://stackoverflow.com/a/32108184/1887892
function isEmpty(obj) {
    for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
            return false;
        }
    }
    // modification from Stackoverflow code which also requires that the object has no property symbols
    return Object.getOwnPropertySymbols(obj).length === 0;
}
/**
 * Check whether a JavaScript value is an empty object
 * @param value A JavaScript value
 * @returns true when object is empty
 * @returns false when object is not the empty object
 */
export function isEmptyObject(value) {
    if (value == null) {
        // null or undefined
        return false;
    }
    if (typeof value !== 'object') {
        // boolean, number, string, function, etc.
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    // consider `Object.create(null)`, commonly used as a safe map
    // before `Map` support, an empty object as well as `{}`
    if (proto !== null && proto !== Object.prototype) {
        return false;
    }
    return isEmpty(value);
}
//# sourceMappingURL=isEmptyObject.js.map