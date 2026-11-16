import { equal } from "./equal.js";
import { includes } from "./includes.js";
export var KeyPredicates;
(function (KeyPredicates) {
    KeyPredicates["equal"] = "equal";
})(KeyPredicates || (KeyPredicates = {}));
export var EnvPredicates;
(function (EnvPredicates) {
    EnvPredicates["equal"] = "equal";
    EnvPredicates["includes"] = "includes";
})(EnvPredicates || (EnvPredicates = {}));
const keyOperators = new Map([
    [KeyPredicates.equal, equal]
]);
const envOperators = new Map([
    [EnvPredicates.equal, equal],
    [EnvPredicates.includes, includes]
]);
export function findKeyPredicate(name) {
    const op = keyOperators.get(name);
    if (op) {
        return op;
    }
    else {
        throw new RangeError("not found");
    }
}
export function findEnvPredicate(name) {
    const op = envOperators.get(name);
    if (op) {
        return op;
    }
    else {
        throw new RangeError("not found");
    }
}
//# sourceMappingURL=index.js.map