import { fc, SecPol } from "../deps.js";
import { accessLevelTupleToPrivilege } from "./security-policy/accessLevelTupleToPrivilege.js";
export function makePlainPrivilege(possibleRoles, possiblePaths, options = {}) {
    const idx = fc.nat(possiblePaths.length);
    const pathSelector = idx.map((idx) => {
        if (idx === possiblePaths.length) {
            return [];
        }
        else {
            return possiblePaths[idx];
        }
    });
    const defaultAccessLevels = [SecPol.AccessLevel.READ, SecPol.AccessLevel.CREATE, SecPol.AccessLevel.UPDATE, SecPol.AccessLevel.DELETE];
    return fc.tuple(fc.constant(SecPol.Permission.ALLOW), fc.constantFrom(...possibleRoles), fc.constantFrom(...(options.includedAccessLevels ?? defaultAccessLevels)), pathSelector).map(([permission, role, accessLevel, pathSelector]) => {
        return {
            privilege: accessLevelTupleToPrivilege(permission, role, accessLevel, pathSelector),
            userEnvPatches: []
        };
    });
}
//# sourceMappingURL=makePlainPrivilege.js.map