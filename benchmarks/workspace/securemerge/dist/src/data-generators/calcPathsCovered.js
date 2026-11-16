import { SecPol } from "./deps.js";
function calcPathsCoveredRecObjects(obj, basePath, pathDescriptor, userEnv, res) {
    const currentPathDescriptorPos = basePath.length;
    if (currentPathDescriptorPos >= pathDescriptor.length) {
        return;
    }
    const currentPathExpr = pathDescriptor[currentPathDescriptorPos];
    const filteredKeys = Object.keys(obj).filter((key) => SecPol.keyMatchesPathExpression(key, currentPathExpr, userEnv));
    const filteredKeysLen = filteredKeys.length;
    for (let i = 0; i < filteredKeysLen; i = i + 1) {
        const key = filteredKeys[i];
        const extendedBasePath = basePath.slice();
        extendedBasePath.push(key);
        res[res.length] = extendedBasePath;
        const val = obj[key];
        if (currentPathDescriptorPos < pathDescriptor.length - 1 && typeof val === "object") {
            calcPathsCoveredRecObjects(val, extendedBasePath, pathDescriptor, userEnv, res);
        }
    }
}
export function calcPathsCovered(data, privilege, userEnv) {
    const pathDescriptor = SecPol.getFullPathDescriptor(privilege);
    const res = [];
    calcPathsCoveredRecObjects(data, [], pathDescriptor, userEnv, res);
    return res;
}
//# sourceMappingURL=calcPathsCovered.js.map