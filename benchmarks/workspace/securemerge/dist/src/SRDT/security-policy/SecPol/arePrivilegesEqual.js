import { getPathSelector } from "./getPathSelector.js";
/**
 * Returns if 2 privileges are (deeply) equal.
 * @param privilegeA A privilege.
 * @param privilegeB Another privilege.
 */
export function arePrivilegesEqual(privilegeA, privilegeB) {
    return privilegeA[0] === privilegeB[0]
        && privilegeA[1] === privilegeB[1]
        && privilegeA[2] === privilegeB[2]
        && arePathSelectorsEqual(getPathSelector(privilegeA), getPathSelector(privilegeB));
}
/**
 * Check if 2 path selectors are (deeply) equal by comparing each of the path expressions..
 * @param pathSelectorA A path selector.
 * @param pathSelectorB Another path selector.
 */
function arePathSelectorsEqual(pathSelectorA, pathSelectorB) {
    return pathSelectorA.length === pathSelectorB.length
        && pathSelectorA.every((pathExpression, idx) => {
            return arePathExpressionsEqual(pathExpression, pathSelectorB[idx]);
        });
}
/**
 * Check whether 2 path expressions are equal.
 * @param pathExpressionA A path expression.
 * @param pathExpressionB Another path expression.
 */
function arePathExpressionsEqual(pathExpressionA, pathExpressionB) {
    // if both path expressions are arrays, e.g., env operators, then check equality 1 level deeper.
    if (Array.isArray(pathExpressionA) && Array.isArray(pathExpressionB)) {
        return pathExpressionA.length === pathExpressionB.length
            && pathExpressionA.every((subExp, idx) => {
                return subExp === pathExpressionB[idx];
            });
    }
    else {
        return pathExpressionA === pathExpressionB;
    }
}
//# sourceMappingURL=arePrivilegesEqual.js.map