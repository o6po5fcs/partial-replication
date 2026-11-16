import { fc } from "../deps.js";
import { makeAtomicValue } from "./makeAtomicValue.js";
import { makePutPatch } from "./makePutPatch.js";
import { makeDelPatch } from "./makeDelPatch.js";
export function makePatch(paths) {
    return fc.oneof(makePutPatch(paths, makeAtomicValue()), makeDelPatch(paths));
}
//# sourceMappingURL=makePatch.js.map