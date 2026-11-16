export const SECURITY_POLICY = Symbol.for("_srdt_security_policy"); // symbol used to hide the security policy srdt objects
export const USER_ENVIRONMENT = Symbol.for("_srdt_user_environment"); // symbol used to hide the user environment on srdt objects
export function isProp(val) {
    return val !== null && (typeof val === "string" || typeof val === "number");
}
//# sourceMappingURL=types.js.map