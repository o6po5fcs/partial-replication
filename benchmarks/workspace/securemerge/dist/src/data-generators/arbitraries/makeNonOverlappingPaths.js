import { getAllObjectPaths } from "../deps.js";
import { makeAutomergeCompatibleObject } from "./makeAutomergeCompatibleObject.js";
export function makeNonOverlappingPaths(size = "small", depthSize) {
    return makeAutomergeCompatibleObject(size, depthSize).map((obj) => {
        return getAllObjectPaths(obj, { leavesOnly: true });
    });
}
//# sourceMappingURL=makeNonOverlappingPaths.js.map