import { isProp } from "../../types.js";
export var Permission;
(function (Permission) {
    Permission["ALLOW"] = "ALLOW";
    /*DENY = "DENY"*/
})(Permission || (Permission = {}));
export var AccessLevel;
(function (AccessLevel) {
    AccessLevel["CREATE"] = "CREATE";
    AccessLevel["READ"] = "READ";
    AccessLevel["UPDATE"] = "UPDATE";
    AccessLevel["DELETE"] = "DELETE";
})(AccessLevel || (AccessLevel = {}));
export function CREATE(pathExpression) {
    return {
        type: AccessLevel.CREATE,
        pathExpression: pathExpression
    };
}
export function isCreateAccess(access) {
    return access.type === AccessLevel.CREATE;
}
export function READ() {
    return {
        type: AccessLevel.READ,
    };
}
export function isReadAccess(access) {
    return access.type === AccessLevel.READ;
}
export function UPDATE(pathExpression) {
    return {
        type: AccessLevel.UPDATE,
        pathExpression: pathExpression
    };
}
export function isUpdateAccess(access) {
    return access.type === AccessLevel.UPDATE;
}
export function DELETE(pathExpression) {
    return {
        type: AccessLevel.DELETE,
        pathExpression: pathExpression,
    };
}
export function isDeleteAccess(access) {
    return access.type === AccessLevel.DELETE;
}
export const Wildcard = "*";
export const Union = "∪";
export const Home = "~";
export function isPathExpressionKey(val) {
    return isProp(val) && val !== Wildcard;
}
//# sourceMappingURL=types.js.map