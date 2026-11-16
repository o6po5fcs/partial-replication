import { Automerge } from "../deps.js";
/**
 * Check whether a value is an atomic value according to this library, which means
 * any value which cannot be descended into from a security policy.
 * @param val An arbitrary value
 */
export function isAtomicValue(val) {
    return typeof val === "string"
        || typeof val === "number"
        || typeof val === "boolean"
        || Array.isArray(val)
        || val instanceof Automerge.Uint
        || val instanceof Automerge.Float64
        || val instanceof Automerge.Int
        || val instanceof Automerge.Counter
        || val instanceof Automerge.ImmutableString;
}
//# sourceMappingURL=isAtomicValue.js.map