import { isUnionPathExpression } from "./isUnionPathExpression.js";
import { isPathExpressionKeyOperator } from "./isPathExpressionKeyOperator.js";
import { isPathExpressionEnvOperator } from "./isPathExpressionEnvOperator.js";
import { Wildcard } from "./types.js";
import { findEnvPredicate, findKeyPredicate } from "./PathExpressionOperators/index.js";
import { pathExistsInObject, getObjectValue } from "../../../object-manipulation/mod.js";
/**
 * Checks whether a key from a field access path matches with a path expression
 * @param key A key from an object
 * @param pathExpression A path expression
 * @param userEnv A user environment which is used to correctly interpret all possibilities for {@link pathExpression}.
 */
export function keyMatchesPathExpression(key, pathExpression, userEnv) {
    if (key === pathExpression) {
        // the key matches the path expression exactly
        return true;
    }
    else if (pathExpression === Wildcard) {
        // the path expression is a wildcard, so it matches
        return true;
    }
    else if (typeof pathExpression == "string" && key !== pathExpression) {
        // the path expression is a string, but it does not match the wildcard (as seen above) or the key
        return false;
    }
    else if (isUnionPathExpression(pathExpression)) {
        // the path expression is a union, i.e., something of the form ["∪", "x", "y", ...]
        // the key from the path must be included in the list of keys specified in the union
        const [_, ...unionKeys] = pathExpression;
        return unionKeys.includes(key);
    }
    else if (isPathExpressionKeyOperator(pathExpression)) {
        // the path expression is an operator on the keys of the object.
        // when giving the key given in the operator and the key from the path (which should be a key from the object)
        // as argument to said operator, it should return a boolean that denotes whether it matches or not.
        // E.g., obj {x: 1} with path expression [eq? y] only gives access to the field y at the specified level in the
        // object. The operator "eq?" would be invoked with "y" and "x" as argument, returning false.
        const [operatorName, arg] = pathExpression;
        const operator = findKeyPredicate(operatorName);
        return operator(arg, key);
    }
    else if (isPathExpressionEnvOperator(pathExpression)) {
        // the path expression is an operator on the user environment.
        // when giving the key given in the path and a value from the user env as argument,
        // it should return a boolean that denotes whether it matches or not.
        // E.g., obj {x: 1} and user env {y: z} with path expression [eq? [~ y]] only gives access to the field x
        // by looking up the value of y. The operator "eq?" would be invoked with "z" and "x" as argument,
        // returning false.
        const [operatorName, homeExpr] = pathExpression;
        const [_, ...homePath] = homeExpr;
        // check whether the path exists in the user environment, otherwise fail.
        if (pathExistsInObject(userEnv, homePath)) {
            const homeValue = getObjectValue(userEnv, homePath);
            const operator = findEnvPredicate(operatorName);
            return operator(homeValue, key);
        }
        else {
            return false;
        }
    }
    else {
        throw new RangeError("Unsupported type of path expression");
    }
}
//# sourceMappingURL=keyMatchesPathExpression.js.map