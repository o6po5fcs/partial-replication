import { fc } from "../deps.js";
import { makeAutomergeCompatibleObjectKey } from "./makeAutomergeCompatibleObjectKey.js";
function pathsAreEqual(path1, path2) {
    const keysAreEqual = () => {
        let allEqual = true;
        for (let i = 0; i < path1.length; i++) {
            if (path1[i] !== path2[i]) {
                return false;
            }
        }
        return true;
    };
    return path1.length === path2.length && keysAreEqual();
}
export function makeNonExistantPath(excludePaths = [], size = "small", minLength = 1) {
    const path = fc.array(makeAutomergeCompatibleObjectKey(), { size: size, minLength: minLength });
    return path.filter((generatedPath) => {
        return !excludePaths.some((excludedPath) => pathsAreEqual(generatedPath, excludedPath));
    });
}
//# sourceMappingURL=makeNonExistantPath.js.map