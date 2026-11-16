import { Home } from "./types.js";
/**
 * Check whether a given value is a correct {@link PathExpressionEnvironmentLookup}
 * @param val An unknown value
 */
export function isPathExpressionEnvironmentLookup(val) {
    return Array.isArray(val)
        && val.length > 1
        && val[0] === Home
        && val.slice(1).every((val) => typeof val === "string");
}
//# sourceMappingURL=isPathExpressionEnvironmentLookup.js.map