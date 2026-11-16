import { fc, getAllObjectPaths } from "../deps.js";
import { makeAutomergeCompatibleObject } from "./makeAutomergeCompatibleObject.js";
import { makeSecurityPolicy2 } from "./makeSecurityPolicy2.js";
export function makeConfiguration(size = "small", depthSize = "small", maxNrOfRoles) {
    return fc.tuple(makeAutomergeCompatibleObject(size, depthSize), fc.integer({
        min: 1, max: maxNrOfRoles
    }).map((nrOfRoles) => {
        return new Array(nrOfRoles).fill(0).map((_, idx) => `role#${idx}`);
    })).chain(([obj, roles]) => {
        const paths = getAllObjectPaths(obj);
        return fc.tuple(fc.constant(obj), fc.constant(roles), makeSecurityPolicy2(obj, roles, paths, {
            introduceEnvironmentLookups: true,
            introduceWildcards: true
        }), fc.constant(paths));
    }).map(([obj, roles, secPol, paths]) => {
        const privileges = secPol.privileges;
        const userEnv = secPol.userEnv;
        return {
            data: obj,
            roles: roles,
            privileges: privileges,
            allObjectPaths: paths,
            userEnv: userEnv
        };
    });
}
//# sourceMappingURL=makeConfiguration.js.map