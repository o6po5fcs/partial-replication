import { getPathSelector } from "./getPathSelector.js";
/**
 * Return the path expression at a certain position
 * @param privilege A privilege to get the path selector from
 * @param pathExpressionPosition The position of the path selector in the privilege
 */
export function getPathExpression(privilege, pathExpressionPosition) {
    const pathSelector = getPathSelector(privilege);
    if (pathExpressionPosition < pathSelector.length) {
        return pathSelector[pathExpressionPosition];
    }
    else {
        throw new Error(`Path Expression position out of range`);
    }
}
//# sourceMappingURL=getPathExpression.js.map