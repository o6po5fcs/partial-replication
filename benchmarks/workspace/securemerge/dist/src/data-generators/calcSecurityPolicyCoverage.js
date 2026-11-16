import { SecPol } from "./deps.js";
export function calcSecurityPolicyCoverage(securityPolicy, userEnv, allPaths) {
    const allowedPaths = [];
    const disallowedPaths = [];
    for (const path of allPaths) {
        if (SecPol.isReadable(path, securityPolicy, userEnv)) {
            allowedPaths.push(path);
        }
        else {
            disallowedPaths.push(path);
        }
    }
    const allowed = allowedPaths.length;
    return {
        totalNumberOfPaths: allPaths.length,
        numberOfPathsCovered: allowed,
        coveragePercent: (allowed / allPaths.length) * 100,
        allowedPaths: allowedPaths,
        disallowedPaths: disallowedPaths
    };
}
//# sourceMappingURL=calcSecurityPolicyCoverage.js.map