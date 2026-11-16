import { isAtomicValue } from "./isAtomicValue.js";
function buildPaths(taskQueue, discoveredPaths, prefix, currentObj, options) {
    for (const [key, value] of Object.entries(currentObj)) {
        const extendedPath = [...prefix, key];
        // don't count every path if the options.leavesOnly property is enabled
        if (!options.leavesOnly) {
            discoveredPaths.push(extendedPath);
        }
        if (isAtomicValue(value)) {
            // count the path if the options.leavesOnly property is enabled
            if (options.leavesOnly) {
                discoveredPaths.push(extendedPath);
            }
        }
        else if (typeof value === "object") {
            taskQueue.push({ prefix: extendedPath, val: value });
        }
        else {
            throw new RangeError(`unexpected value in object`);
        }
    }
}
/**
 * Generate a list of all paths in a JavaScript object.
 * Optionally return only paths until the leaves without any intermediate objects.
 * @param obj The object to generate all paths for
 * @param options {@link GetAllDocumentPathsOptions}
 * @returns An array of paths (which are arrays of object keys).
 */
export function getAllObjectPaths(obj, options = {
    leavesOnly: false
}) {
    if (!(obj instanceof Object))
        return [];
    else {
        // perform a tree traversal using a queue
        const discoveredPaths = [];
        const initialTask = { prefix: [], val: obj };
        const tasks = [initialTask]; // start at the root
        while (tasks.length > 0) {
            const task = tasks.pop();
            buildPaths(tasks, discoveredPaths, task.prefix, task.val, options);
        }
        return discoveredPaths;
    }
}
//# sourceMappingURL=getAllObjectPaths.js.map