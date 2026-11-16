export class SecurityError extends Error {
    constructor(msg) {
        super(msg);
        // Set the prototype explicitly.
        Object.setPrototypeOf(this, SecurityError.prototype);
    }
    toString() {
        return `SecurityError: ${this.message}`;
    }
}
//# sourceMappingURL=SecurityError.js.map