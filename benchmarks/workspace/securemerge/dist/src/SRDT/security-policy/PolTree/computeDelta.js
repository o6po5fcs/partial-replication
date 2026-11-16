import { SecPol } from "./deps.js";
/**
 * A unique, constant value that signifies "NO VALUE" during the traversal process.
 */
export const NO_VALUE = Symbol("NO_VALUE");
/**
 * A generic function to traverse 2 documents at the same time (1 full document, 1 projection of said document)
 * and to compute a delta between the 2 documents based on a generic lambda.
 * @param privileges The privileges that determine how to traverse the document.
 * @param fullObject The full document.
 * @param projectedObject The projected document which is a subset of the full document.
 * @param userEnv A user environment needed to correctly evaluate the path determined by the privilege.
 * @param onPathDiscovered A function that is called once for each unique path (to the root) that matches the privilege,
 * and which should generate a tuple [a, b] where:
 *  a = {@link T} if {@link T} should be included in the result set, otherwise false
 *  b = true/false whether to continue deeper traversal for subtrees of "fullObjectValue" (if this value is an object)
 *
 */
export function computeDelta(privileges, fullObject, projectedObject, userEnv, onPathDiscovered) {
    const breadthFirstPathDescriptorMap = new Map();
    for (const privilege of privileges) {
        const pathDescriptor = SecPol.getFullPathDescriptor(privilege);
        for (let i = 0; i < pathDescriptor.length; i++) {
            if (!breadthFirstPathDescriptorMap.has(i)) {
                breadthFirstPathDescriptorMap.set(i, []);
            }
            breadthFirstPathDescriptorMap.get(i).push(pathDescriptor[i]);
        }
    }
    const nodesToVisit = [];
    // A procedure to descend further into an object based on a key.
    // If descending via said key is not possible (e.g., because said key does not exist in the object), returns NO_VALUE.
    const descendIntoValue = (val, key) => {
        if (val !== null && typeof val === "object" && Reflect.has(val, key)) {
            return Reflect.get(val, key);
        }
        else {
            return NO_VALUE;
        }
    };
    // Traverse 1 level deeper into the object based on the given privileges. Will schedule all keys in the current
    // level of the object given as first argument, but only when one of the privileges allows traversal through the key.
    const scheduleLevel = (valueInFullObject, valueInProjectedObject, pathToRoot, pathDescriptorPosition) => {
        if (valueInFullObject !== null && typeof valueInFullObject === "object") {
            const pathExpressions = breadthFirstPathDescriptorMap.get(pathDescriptorPosition);
            for (const [key, value] of Object.entries(valueInFullObject)) {
                const extendedPath = pathToRoot.slice();
                extendedPath.push(key);
                if (shouldVisit(key, pathExpressions, userEnv)) {
                    nodesToVisit.push([
                        extendedPath,
                        value,
                        descendIntoValue(valueInProjectedObject, key),
                        pathDescriptorPosition // store the current path descriptor position
                    ]);
                }
            }
        }
    };
    //if (pathDescriptors.filter((pathDescriptor) => pathDescriptor.length > 0).length === 0) {
    if (breadthFirstPathDescriptorMap.size === 0) {
        return [];
    }
    else {
        // schedule the top-level keys of the full object.
        scheduleLevel(fullObject, projectedObject, [], 0);
    }
    const delta = [];
    while (nodesToVisit.length > 0) {
        const [pathToRoot, valueInFullObj, valueInProjectedObj, pathDescriptorPosition] = nodesToVisit.pop();
        // call onPathDiscovered to generate an entry for the result set.
        const [valueOrFalse, continueTraversal] = onPathDiscovered(pathToRoot, valueInFullObj, valueInProjectedObj);
        // if the generated entry is NO_VALUE (or a symbol) then do not include it in the result set.
        if (valueOrFalse) {
            delta.push(valueOrFalse);
        }
        // check if it is still possible to traverse deeper into the object
        //  - If yes, schedule next level
        if (continueTraversal && breadthFirstPathDescriptorMap.has(pathDescriptorPosition + 1)) {
            // If we are not yet at the end of any of the path descriptors, schedule the next level.
            scheduleLevel(valueInFullObj, valueInProjectedObj, pathToRoot, pathDescriptorPosition + 1);
        }
    }
    return delta;
}
/**
 * Determine whether a certain key of an object should be descended into.
 * Returns true when the key matches any of the given path expressions in the given user environment, false otherwise.
 * @param key A key to check
 * @param pathExpressions A set of path expressions that might match the key.
 * @param userEnv A user environment needed to correctly evaluate the given pathExpressions.
 */
function shouldVisit(key, pathExpressions, userEnv) {
    return pathExpressions.some((pathExpression) => SecPol.keyMatchesPathExpression(key, pathExpression, userEnv));
}
//# sourceMappingURL=computeDelta.js.map