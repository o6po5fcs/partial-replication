/**
 * Check whether a given value is a correct {@link PathExpressionKeyOperator}
 * @param val An unknown value
 */
export function isPathExpressionKeyOperator(val) {
    return Array.isArray(val)
        && val.length == 2
        && typeof val[0] === "string"
        && typeof val[1] === "string";
}
//# sourceMappingURL=isPathExpressionKeyOperator.js.map