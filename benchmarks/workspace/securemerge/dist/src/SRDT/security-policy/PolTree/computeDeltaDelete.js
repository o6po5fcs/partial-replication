import { SecPol } from "./deps.js";
export function computeDeltaDelete(projectedObj, removedPrivilege, secpol, userEnv) {
    const pathDescriptor = SecPol.getFullPathDescriptor(removedPrivilege);
    const diffs = [];
    diffObjectsDelete(projectedObj, false, [], removedPrivilege, pathDescriptor, secpol, userEnv, diffs);
    return diffs;
}
function diffObjectsDelete(projectedObj, isOldArray, basePath, removedPrivilege, pathDescriptor, secpol, userEnv, diffs) {
    const currentPathDescriptorPos = basePath.length;
    if (currentPathDescriptorPos >= pathDescriptor.length) {
        return;
    }
    const currentPathExpr = pathDescriptor[currentPathDescriptorPos];
    const projectedObjKeys = Object.keys(projectedObj).filter((key) => SecPol.keyMatchesPathExpression(key, currentPathExpr, userEnv));
    const projectedObjKeysLen = projectedObjKeys.length;
    const basePathLen = basePath.length;
    for (let i = 0; i < projectedObjKeysLen; i = i + 1) {
        const key = projectedObjKeys[i];
        const projectedObjVal = projectedObj[key];
        const pathKey = isOldArray ? +key : key;
        // extend base path
        basePath[basePathLen] = pathKey;
        basePath.length = basePathLen + 1;
        if (!secpol.isReadable(basePath, userEnv)) {
            diffs[diffs.length] = {
                action: "del",
                path: basePath.slice(),
            };
        }
        else {
            diffObjectsDelete(projectedObjVal, false, basePath, removedPrivilege, pathDescriptor, secpol, userEnv, diffs);
        }
    }
}
//# sourceMappingURL=computeDeltaDelete.js.map