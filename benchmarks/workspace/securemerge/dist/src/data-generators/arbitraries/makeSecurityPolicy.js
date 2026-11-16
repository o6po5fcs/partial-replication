import { fc, SecPol, setObjectValue, SeedRandom } from "../deps.js";
import { introduceWildcards } from "./security-policy/introduceWildcards.js";
import { introduceEnvironmentLookups } from "./security-policy/introduceEnvironmentLookups.js";
import { randomShuffleArray } from "../randomShuffleArray.js";
export function makeSecurityPolicy(data, roles, allPaths, options = {}) {
    const initialRngSeed = options.seed ? options.seed : Math.random();
    const mySeededRng = SeedRandom(initialRngSeed.toString());
    const idx = fc.nat(allPaths.length);
    const pathSelector = idx.map((idx) => {
        if (idx === allPaths.length) {
            return [];
        }
        else {
            return allPaths[idx];
        }
    });
    return fc.array(fc.tuple(fc.constant(SecPol.Permission.ALLOW), fc.constantFrom(...roles), fc.constantFrom(...(options.includedAccessLevels ?? [SecPol.AccessLevel.READ, SecPol.AccessLevel.CREATE, SecPol.AccessLevel.UPDATE, SecPol.AccessLevel.DELETE])), pathSelector).map(([permission, role, accessLevel, pathSelector]) => {
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
    }), {
        minLength: options.minLength,
        maxLength: options.maxLength
    }).map((plainPrivileges) => {
        let privileges = plainPrivileges;
        const userEnv = {};
        if (options.introduceEnvironmentLookups ?? false) {
            const modificationResult = introduceEnvironmentLookups(privileges, initialRngSeed);
            privileges = modificationResult.privileges;
            for (const userEnvPatch of modificationResult.userEnvPatches) {
                if (mySeededRng() < 0.5) {
                    setObjectValue(userEnv, userEnvPatch.path, userEnvPatch.value);
                }
            }
        }
        if (options.introduceWildcards ?? false) {
            privileges = introduceWildcards(privileges, {
                coverageCutoffOptions: {
                    allPaths: allPaths,
                    userEnv: userEnv,
                    maxCoveragePercent: 100
                },
                numberGenerator: mySeededRng
            });
        }
        // randomly shuffle the array to remove any bias introduced by the generation/manipulation process.
        randomShuffleArray(privileges, mySeededRng);
        return {
            privileges: privileges,
            userEnv: userEnv
        };
    });
}
//# sourceMappingURL=makeSecurityPolicy.js.map