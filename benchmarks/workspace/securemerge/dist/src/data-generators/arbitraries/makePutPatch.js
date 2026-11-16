import { fc } from "../deps.js";
export function makePutPatch(paths, value) {
    return fc.tuple(paths, value).map(([path, val]) => {
        return {
            action: "put",
            value: val,
            path: path,
        };
    });
}
//# sourceMappingURL=makePutPatch.js.map