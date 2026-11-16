import { isCreateAccess, isDeleteAccess, isReadAccess, isUpdateAccess, Wildcard } from "./types.js";
import { isUnionPathExpression } from "./isUnionPathExpression.js";
import { isPathExpressionEnvOperator } from "./isPathExpressionEnvOperator.js";
import { isPathExpressionKeyOperator } from "./isPathExpressionKeyOperator.js";
/**
 * Pretty print a security policy in S-Expression syntax
 * @param secPol A security policy to pretty print
 */
export function prettyPrint(secPol) {
    const maxRoleLength = getMaxRoleLength(secPol);
    const maxAccessLength = getMaxAccessLength(secPol);
    return secPol.map((priv) => {
        return printPrivilege(priv, maxRoleLength, maxAccessLength);
    }).join(`\n`);
}
export function getMaxRoleLength(secPol) {
    return secPol.reduce((previousMax, [permission, role, access, pathSelector]) => {
        return Math.max(previousMax, role.length);
    }, 0);
}
export function getMaxAccessLength(secPol) {
    return secPol.reduce((previousMax, [permission, role, access, pathSelector]) => {
        return Math.max(previousMax, printAccess(access).length);
    }, 0);
}
function printPrivilege([permission, role, access, pathSelector], maxRoleLength, maxAccessLength) {
    const printedRole = printRole(role).padEnd(maxRoleLength, " ");
    const printedAccess = printAccess(access).padEnd(maxAccessLength, " ");
    return `(${printPermission(permission)} ${printedRole} ${printedAccess} ${printPathSelector(pathSelector)})`;
}
function printPermission(permission) {
    return permission;
}
function printRole(role) {
    return role;
}
function printAccess(access) {
    if (isReadAccess(access)) {
        return access.type;
    }
    else if (isCreateAccess(access) || isUpdateAccess(access) || isDeleteAccess(access)) {
        return `(${access.type} ${printPathExpression(access.pathExpression)})`;
    }
    else {
        throw new RangeError(`Unsupported access type`);
    }
}
function printPathSelector(pathSelector) {
    return `(${pathSelector.map(printPathExpression).join(" ")})`;
}
function printPathExpression(pathExpression) {
    if (pathExpression === Wildcard) {
        return Wildcard;
    }
    else if (typeof pathExpression === "string" || typeof pathExpression === "number") {
        return `${pathExpression}`;
    }
    else if (isUnionPathExpression(pathExpression)) {
        const [union, ...keys] = pathExpression;
        return (`[${union} ${keys.join(" ")}]`);
    }
    else if (isPathExpressionEnvOperator(pathExpression)) {
        const [predicate, [home, ...keys]] = pathExpression;
        const lookupStr = `[${home} ${keys.join(" ")}]`;
        return `[${predicate} ${lookupStr}]`;
    }
    else if (isPathExpressionKeyOperator(pathExpression)) {
        const [predicate, key] = pathExpression;
        return `[${predicate}} ${key}]`;
    }
    else {
        throw new RangeError(`Unsupported type of path expression`);
    }
}
//# sourceMappingURL=prettyPrint.js.map