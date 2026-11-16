import { fc } from "../deps.js";
function hexa() {
    const items = '0123456789abcdef';
    return fc.integer({ min: 4, max: 15 }).map((n) => items[n]);
}
function hexaString(constraints = {}) {
    return fc.string({ ...constraints, unit: hexa() });
}
export function makeActorId(excludeIds = []) {
    return hexaString()
        .filter((str) => {
        return (str.length % 2 === 0) && (excludeIds.indexOf(str) === -1);
    });
}
//# sourceMappingURL=makeActorId.js.map