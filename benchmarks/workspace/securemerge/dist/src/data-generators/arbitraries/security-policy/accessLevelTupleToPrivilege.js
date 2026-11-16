import { SecPol } from "../../deps.js";
export function accessLevelTupleToPrivilege(permission, role, accessLevel, pathSelector) {
    // if the path selector is empty, then (currently) we cannot generate a legitimate CREATE/UPDATE/DELETE access
    // because they require at least 1 key.
    if (pathSelector.length === 0) {
        return [permission, role, SecPol.READ(), pathSelector];
    }
    else {
        let access;
        if (accessLevel === SecPol.AccessLevel.READ) {
            access = SecPol.READ();
        }
        else {
            const lastPathExpr = pathSelector[pathSelector.length - 1];
            pathSelector = pathSelector.slice(0, pathSelector.length - 1);
            switch (accessLevel) {
                case SecPol.AccessLevel.UPDATE: {
                    access = SecPol.UPDATE(lastPathExpr);
                    break;
                }
                case SecPol.AccessLevel.CREATE: {
                    access = SecPol.CREATE(lastPathExpr);
                    break;
                }
                case SecPol.AccessLevel.DELETE: {
                    access = SecPol.DELETE(lastPathExpr);
                    break;
                }
                default: {
                    throw new RangeError("Unknown accesslevel");
                }
            }
        }
        return [permission, role, access, pathSelector];
    }
}
//# sourceMappingURL=accessLevelTupleToPrivilege.js.map