import { keyMatchesPathExpression } from "./keyMatchesPathExpression.js";
/**
 * Checks whether a path in an object partially matches a path selector, which means that the
 * path selector can potentially be longer, but the path matches at least a prefix of it.
 * @param path A (flat) path in an object
 * @param pathSelector A path selector
 * @param userEnv A user environment needed to correctly interpret {@link pathSelector}
 */
export function pathPartiallyMatchesPathSelector(path, pathSelector, userEnv) {
    for (let i = 0; i <= Math.min(path.length, pathSelector.length); i++) {
        if (i === pathSelector.length || i == path.length) {
            // Notice that the for loop loops until "1 index further" than the smallest array.
            // This is to capture the situation where the path and path selector have a different length.
            // If we have completely traversed the path selector without failing,
            // then the path matches the path selector.
            // Access is potentially granted to a path that is shorter than the path selector
            return path.length <= pathSelector.length;
        }
        else {
            const key = path[i];
            const pathExpression = pathSelector[i];
            if (typeof key === "string") {
                if (!keyMatchesPathExpression(key, pathExpression, userEnv)) {
                    return false;
                } // else do nothing - let the loop continue
            }
            else if (typeof key === "number") {
                // if the current key is a number, that means that the read/write happens to an array
                // since arrays are treated as scalar values, accesses are always allowed.
                // By definition, we assume that if the for loop has reached this point, then all (potential) previous
                // keys were allowed to be accessed.
                return true;
            }
            else {
                throw new RangeError("Unsupported type of key in path");
            }
        }
    }
    // If at this point the supplied path has not (partially) matched with the given path selector, then they do not match.
    // by default a path does not match a path selector unless it can be explicitly checked to match
    return false;
}
//# sourceMappingURL=pathPartiallyMatchesPathSelector.js.map