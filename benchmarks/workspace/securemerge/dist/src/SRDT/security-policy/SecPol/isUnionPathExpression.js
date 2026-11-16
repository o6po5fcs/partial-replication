import { Union } from "./types.js";
/**
 * Check whether a given value is a correct {@link PathExpressionUnion}
 * @param val An unknown value
 */
export function isUnionPathExpression(val) {
    return Array.isArray(val)
        && val.length >= 1
        && val[0] === Union
        && (val.length === 1 || val.slice(1).every((val) => typeof val === "string"));
}
//# sourceMappingURL=isUnionPathExpression.js.map