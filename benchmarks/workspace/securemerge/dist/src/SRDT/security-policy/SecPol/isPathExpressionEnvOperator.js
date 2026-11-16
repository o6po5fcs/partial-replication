import { isPathExpressionEnvironmentLookup } from "./isPathExpressionEnvironmentLookup.js";
/**
 * Check whether a given value is a correct {@link PathExpressionEnvOperator}
 * @param val An unknown value
 */
export function isPathExpressionEnvOperator(val) {
    return Array.isArray(val)
        && val.length == 2
        && typeof val[0] === "string"
        && isPathExpressionEnvironmentLookup(val[1]);
}
//# sourceMappingURL=isPathExpressionEnvOperator.js.map