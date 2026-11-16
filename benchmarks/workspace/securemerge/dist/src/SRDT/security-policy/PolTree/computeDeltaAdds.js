import { makePolTreeSecurityPolicy } from "../mod.js";
// This method is slower than calling the single-privilege variant multiple times in sequence.
// Probably because it is much better optimized CPU caches.
/**
 * 2026-05-28 Code taken from https://github.com/teimurjan/blazediff/blob/main/packages/object/src/index.ts
 *                            @ main, commit 3b7109862c8bbe35d07e98c3487e7224793dfc97
 * Greatly modified by Sam Van den Vonder
 *
 * Original license:
 * MIT License
 *
 * Copyright (c) 2025 Teimur Gasanov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
// Numeric enum for faster comparisons and better V8 optimization
export var DifferenceType;
(function (DifferenceType) {
    DifferenceType[DifferenceType["CREATE"] = 0] = "CREATE";
    DifferenceType[DifferenceType["REMOVE"] = 1] = "REMOVE";
    DifferenceType[DifferenceType["CHANGE"] = 2] = "CHANGE";
})(DifferenceType || (DifferenceType = {}));
function createDifference(path, valueOrOld) {
    // Consistent object shape regardless of type (numeric comparison is faster)
    if (typeof valueOrOld === "object") {
        return {
            action: "put",
            path: path,
            value: {}
        };
        /*const newObj: any = path.reduceRight<unknown>((acc, key) => ({[key]: acc}), valueOrOld);
        const singletonSecurityPolicy = makePlainSecurityPolicy([privilege]);

        // project the object according to the security policy
        const projectedObj = projectData<object>(newObj, singletonSecurityPolicy, userEnv);
        const projectedValue = path.reduce((acc, key) => Reflect.get(acc, key), projectedObj);

        return {
            action: "put",
            path: path,
            value: projectedValue
        }*/
    }
    else if (Array.isArray(valueOrOld)) {
        return {
            action: "put",
            path: path,
            value: []
        };
    }
    return {
        action: "put",
        path: path,
        value: valueOrOld
    };
}
// Specialized array differ (monomorphic - only handles arrays)
function diffArrays(fullObjArr, projectedObjArr, basePath, poltree, userEnv, maxHeight) {
    const diffs = [];
    const oldLen = fullObjArr.length;
    const newLen = projectedObjArr.length;
    const maxLen = Math.max(oldLen, newLen);
    const basePathLen = basePath.length;
    // Traditional for loop with cached length (best JIT optimization)
    for (let i = 0; i < maxLen; i = i + 1) {
        if (i >= oldLen) {
            // Element added - push index temporarily, then restore
            basePath[basePathLen] = i;
            basePath.length = basePathLen + 1;
            diffs[diffs.length] = createDifference(basePath.slice(), projectedObjArr[i]);
            basePath.length = basePathLen;
            continue;
        }
        const fullObjVal = fullObjArr[i];
        const projectedObjVal = projectedObjArr[i];
        // Early exit for identical values (including NaN case)
        if (fullObjVal === projectedObjVal)
            continue;
        if (Number.isNaN(fullObjVal) && Number.isNaN(projectedObjVal))
            continue;
        compareAndAddDifferences(fullObjVal, projectedObjVal, i, diffs, basePath, poltree, userEnv, maxHeight);
    }
    return diffs;
}
// Specialized object differ (monomorphic - only handles objects)
function diffObjectsAdd(fullObj, projectedObj, isOldArray, basePath, poltree, userEnv, maxHeight) {
    const currentHeight = basePath.length;
    if (currentHeight >= maxHeight) {
        return [];
    }
    const diffs = [];
    const projectedObjKeys = Object.keys(projectedObj);
    const extendedPath = basePath.slice();
    const fullObjFilteredKeys = Object.keys(fullObj).filter((key) => {
        extendedPath[extendedPath.length] = key;
        const res = poltree.isReadable(extendedPath, userEnv);
        extendedPath.length -= 1;
        return res;
    });
    const projectedObjKeysLen = projectedObjKeys.length;
    const fullObjFilteredKeysLen = fullObjFilteredKeys.length;
    const basePathLen = basePath.length;
    // Use Set only for larger objects (avoid overhead for small objects)
    let fullObjFilteredKeySet = null;
    let projectedObjKeySet = null;
    if (Math.min(projectedObjKeysLen, fullObjFilteredKeysLen) > 10) {
        fullObjFilteredKeySet = new Set(fullObjFilteredKeys);
        projectedObjKeySet = new Set(projectedObjKeys);
    }
    // Process existing keys (traditional for loop for JIT optimization)
    for (let i = 0; i < projectedObjKeysLen; i = i + 1) {
        const key = projectedObjKeys[i];
        // Optimized key existence check
        const shouldDescendInto = fullObjFilteredKeySet !== null ? fullObjFilteredKeySet.has(key) : fullObjFilteredKeys.includes(key);
        if (shouldDescendInto) {
            const projectedObjVal = projectedObj[key];
            const pathKey = isOldArray ? +key : key;
            const fullObjVal = fullObj[key];
            // Early exit for identical values
            if (projectedObjVal === fullObjVal)
                continue;
            if (Number.isNaN(projectedObjVal) && Number.isNaN(fullObjVal))
                continue;
            // temporarily restore basePath length
            //basePath.length = basePathLen;
            compareAndAddDifferences(fullObjVal, projectedObjVal, pathKey, diffs, basePath, poltree, userEnv, maxHeight);
        }
    }
    // Process new keys (additions)
    const isNewArray = Array.isArray(projectedObj);
    for (let i = 0; i < fullObjFilteredKeysLen; i = i + 1) {
        const key = fullObjFilteredKeys[i];
        // Optimized key existence check
        const projectedObjHasKey = projectedObjKeySet !== null ? projectedObjKeySet.has(key) : key in projectedObj;
        if (!projectedObjHasKey) {
            const fullObjValue = fullObj[key];
            if (currentHeight < maxHeight && typeof fullObjValue === "object") {
                const extendedBasePath = basePath.slice();
                extendedBasePath.push(key);
                // insert an empty object if the full object has the key, the projected object does not, and
                // we should still traverse deeper.
                diffs[diffs.length] = {
                    action: "put",
                    path: extendedBasePath,
                    value: {}
                };
                compareAndAddDifferences(fullObjValue, {}, key, diffs, basePath, poltree, userEnv, maxHeight);
            }
            else {
                const pathKey = isNewArray ? +key : key;
                basePath[basePathLen] = pathKey;
                basePath.length = basePathLen + 1;
                diffs[diffs.length] = createDifference(basePath.slice(), fullObjValue);
                // restore basePath length
                basePath.length = basePathLen;
            }
        }
    }
    return diffs;
}
// Specialized value comparison that directly adds to diffs array (avoids return overhead)
function compareAndAddDifferences(fullObjValue, projectedObjValue, pathElement, diffs, basePath, poltree, userEnv, maxHeight) {
    const basePathLen = basePath.length;
    // Type compatibility check with separate boolean variables (helps JIT)
    const oldIsArray = Array.isArray(fullObjValue);
    const newIsArray = Array.isArray(projectedObjValue);
    // Mutate path in place for recursion
    basePath[basePathLen] = pathElement;
    basePath.length = basePathLen + 1;
    let subDiffs;
    if (oldIsArray && newIsArray) {
        subDiffs = diffArrays(fullObjValue, projectedObjValue, basePath, poltree, userEnv, maxHeight);
    }
    else {
        subDiffs = diffObjectsAdd(fullObjValue, projectedObjValue, false, basePath, poltree, userEnv, maxHeight);
    }
    // Restore path length
    basePath.length = basePathLen;
    // Add sub-differences directly (no path manipulation needed)
    const subDiffsLen = subDiffs.length;
    for (let i = 0; i < subDiffsLen; i = i + 1) {
        diffs[diffs.length] = subDiffs[i];
    }
}
export function computeDeltaAdds(fullObj, projectedObj, addedPrivileges, userEnv) {
    const poltree = makePolTreeSecurityPolicy(addedPrivileges);
    // For objects, use object differ
    return diffObjectsAdd(fullObj, projectedObj, false, [], poltree, userEnv, poltree.height());
}
//# sourceMappingURL=computeDeltaAdds.js.map