import { fc } from "../deps.js";
export function makeAtomicValue() {
    return fc.oneof(fc.constant({}), fc.integer(), fc.string(), fc.boolean());
}
//# sourceMappingURL=makeAtomicValue.js.map