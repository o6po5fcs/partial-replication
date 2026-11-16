import { fc } from "../deps.js";
import { makeAutomergeCompatibleObjectKey } from "./makeAutomergeCompatibleObjectKey.js";
export function makeAutomergeCompatibleObject(size, depthSize, minKeys = 0) {
    const depthIdentifier = fc.createDepthIdentifier();
    const { tree } = fc.letrec((tie) => ({
        tree: fc.dictionary(makeAutomergeCompatibleObjectKey(), tie("node"), {
            size: size,
            minKeys: minKeys,
            depthIdentifier: depthIdentifier,
            noNullPrototype: true // objects with null-prototype are currently incompatible with automerge
        }),
        node: fc.oneof({ depthIdentifier: depthIdentifier, depthSize: depthSize }, tie("leaf"), tie("tree")),
        leaf: fc.oneof({ depthIdentifier: depthIdentifier }, fc.string(), fc.integer(), fc.boolean()),
    }));
    return tree;
}
//# sourceMappingURL=makeAutomergeCompatibleObject.js.map