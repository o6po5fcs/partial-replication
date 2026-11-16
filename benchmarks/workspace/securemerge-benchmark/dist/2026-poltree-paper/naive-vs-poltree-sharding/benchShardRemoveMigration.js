import { SRDT } from "../../deps.js";
import { gzipSync } from "node:zlib";
import { Command, Option } from "commander";
import util from "node:util";
import { diff } from "@blazediff/object";
import { generateDataWithSimpleSecurityPolicy } from "../generateDataWithSimpleSecurityPolicy.js";
// check the correctness of the output of the PolTree approach
const CORRECTNESS_CHECK = false;
const PRINT_OUTPUT = false;
export function benchPlainSecPolShardRemoveMigration(size, depthSize, securityPolicySize, nrOfPrivilegesToRemove, minimumObjectPathsSize, seed, iterations) {
    const { obj, paths, privileges, userEnv } = generateDataWithSimpleSecurityPolicy(size, depthSize, securityPolicySize, minimumObjectPathsSize, seed);
    const reducedPrivileges = privileges.slice(nrOfPrivilegesToRemove, privileges.length);
    const reducedSecurityPolicy = SRDT.makePlainSecurityPolicy(reducedPrivileges);
    if (PRINT_OUTPUT) {
        console.dir(privileges, { depth: null, maxArrayLength: null });
    }
    const outputs = [];
    for (let i = 1; i <= iterations; i++) {
        outputs.push(benchOnce_PlainSecPolShardRemoveMigration({ obj, paths, privileges, userEnv }, reducedPrivileges, reducedSecurityPolicy, i));
    }
    return outputs;
}
export function benchOnce_PlainSecPolShardRemoveMigration({ obj, paths, privileges, userEnv }, reducedPrivileges, reducedSecurityPolicy, iterationNb) {
    // compute a shard after removing privileges
    const timeBefore = process.hrtime.bigint();
    const newShard = SRDT.projectData(obj, reducedSecurityPolicy, userEnv);
    const timeAfter = process.hrtime.bigint();
    if (PRINT_OUTPUT) {
        console.log(util.inspect(newShard, { depth: null }));
    }
    const initialCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privileges, userEnv, paths);
    const finalCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(reducedPrivileges, userEnv, paths);
    return {
        iteration: iterationNb,
        sourceObjectStats: {
            sizeIndication: Buffer.byteLength(JSON.stringify(obj)),
            numberOfPaths: paths.length,
            maxDepth: paths.reduce((acc, path) => Math.max(acc, path.length), 0),
            topLevelBreadth: Object.keys(obj).length
        },
        privilegeStats: {
            initialNumberOfPrivileges: privileges.length,
            numberOfRemovedPrivileges: privileges.length - reducedPrivileges.length,
            initialCoverage: {
                totalNumberOfPaths: initialCoverageStats.totalNumberOfPaths,
                numberOfPathsCovered: initialCoverageStats.numberOfPathsCovered,
                coveragePercent: initialCoverageStats.coveragePercent
            },
            finalCoverage: {
                totalNumberOfPaths: finalCoverageStats.totalNumberOfPaths,
                numberOfPathsCovered: finalCoverageStats.numberOfPathsCovered,
                coveragePercent: finalCoverageStats.coveragePercent
            },
            userEnvSize: `${SRDT.ObjectManipulation.getAllObjectPaths(userEnv, { leavesOnly: true }).length} paths`
        },
        measurements: {
            measuredMigrationTimeNs: Number(timeAfter - timeBefore),
            measuredTotalTimeNs: Number(timeAfter - timeBefore),
            migrationSize: Buffer.byteLength(gzipSync(Buffer.from(JSON.stringify(newShard), "utf16le"))),
            migrationNonGzip: Buffer.byteLength(Buffer.from(JSON.stringify(newShard), "utf16le"))
        }
    };
}
export function benchPlainSecPolShardRemoveMigrationBladediff(size, depthSize, securityPolicySize, nrOfPrivilegesToRemove, minimumObjectPathsSize, seed, iterations) {
    const { obj, paths, privileges, userEnv } = generateDataWithSimpleSecurityPolicy(size, depthSize, securityPolicySize, minimumObjectPathsSize, seed);
    if (PRINT_OUTPUT) {
        console.dir(privileges, { depth: null, maxArrayLength: null });
    }
    const reducedPrivileges = privileges.slice(nrOfPrivilegesToRemove, privileges.length);
    const outputs = [];
    for (let i = 1; i <= iterations; i++) {
        outputs.push(benchOnce_PlainSecPolShardRemoveMigrationBladediff({ obj, paths, privileges, userEnv }, reducedPrivileges, i));
    }
    return outputs;
}
export function benchOnce_PlainSecPolShardRemoveMigrationBladediff({ obj, paths, privileges, userEnv }, reducedPrivileges, iterationNb) {
    const initialSecurityPolicy = SRDT.makePlainSecurityPolicy(privileges);
    const reducedSecurityPolicy = SRDT.makePlainSecurityPolicy(reducedPrivileges);
    const initialShard = SRDT.projectData(obj, initialSecurityPolicy, userEnv);
    // compute a shard after removing privileges
    const timeBeforeProjection = process.hrtime.bigint();
    const newShard = SRDT.projectData(obj, reducedSecurityPolicy, userEnv);
    const timeAfterProjection = process.hrtime.bigint();
    const differences = diff(initialShard, newShard);
    const timeAfterDifferences = process.hrtime.bigint();
    if (PRINT_OUTPUT) {
        console.log(util.inspect(newShard, { depth: null }));
        console.log(util.inspect(differences, { depth: null }));
    }
    const initialCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privileges, userEnv, paths);
    const finalCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(reducedPrivileges, userEnv, paths);
    return {
        iteration: iterationNb,
        sourceObjectStats: {
            sizeIndication: Buffer.byteLength(JSON.stringify(obj)),
            numberOfPaths: paths.length,
            maxDepth: paths.reduce((acc, path) => Math.max(acc, path.length), 0),
            topLevelBreadth: Object.keys(obj).length
        },
        privilegeStats: {
            initialNumberOfPrivileges: privileges.length,
            numberOfRemovedPrivileges: privileges.length - reducedPrivileges.length,
            initialCoverage: {
                totalNumberOfPaths: initialCoverageStats.totalNumberOfPaths,
                numberOfPathsCovered: initialCoverageStats.numberOfPathsCovered,
                coveragePercent: initialCoverageStats.coveragePercent
            },
            finalCoverage: {
                totalNumberOfPaths: finalCoverageStats.totalNumberOfPaths,
                numberOfPathsCovered: finalCoverageStats.numberOfPathsCovered,
                coveragePercent: finalCoverageStats.coveragePercent
            },
            userEnvSize: `${SRDT.ObjectManipulation.getAllObjectPaths(userEnv, { leavesOnly: true }).length} paths`,
        },
        measurements: {
            differencesSize: differences.length,
            measuredMigrationTimeNs: Number(timeAfterDifferences - timeBeforeProjection),
            measuredTotalTimeNs: Number(timeAfterDifferences - timeBeforeProjection),
            measuredDiffTimeNs: Number(timeAfterDifferences - timeAfterProjection),
            measuredProjectionTimeNs: Number(timeAfterProjection - timeBeforeProjection),
            migrationSize: Buffer.byteLength(gzipSync(Buffer.from(JSON.stringify(differences), "utf16le"))),
            migrationNonGzip: Buffer.byteLength(Buffer.from(JSON.stringify(differences), "utf16le"))
        }
    };
}
export function benchPolTreeShardRemoveMigration(size, depthSize, securityPolicySize, nrOfPrivilegesToRemove, minimumObjectPathsSize, seed, iterations) {
    const { obj, paths, privileges, userEnv } = generateDataWithSimpleSecurityPolicy(size, depthSize, securityPolicySize, minimumObjectPathsSize, seed);
    if (PRINT_OUTPUT) {
        console.dir(privileges, { depth: null, maxArrayLength: null });
    }
    const privilegesToRemove = privileges.slice(0, nrOfPrivilegesToRemove);
    const outputs = [];
    for (let i = 1; i <= iterations; i++) {
        outputs.push(benchOnce_PolTreeShardRemoveMigration({ obj, paths, privileges, userEnv }, privilegesToRemove, nrOfPrivilegesToRemove, i));
    }
    return outputs;
}
export function benchOnce_PolTreeShardRemoveMigration({ obj, paths, privileges, userEnv }, privilegesToRemove, nrOfPrivilegesToRemove, iterationNb) {
    const polTreeSecurityPolicy = SRDT.makePolTreeSecurityPolicy([]);
    const privilegesAndIds = privileges.map((privilege) => [polTreeSecurityPolicy.addPrivilege(privilege), privilege]);
    const privilegesAndIdsToRemove = privilegesAndIds.slice(0, nrOfPrivilegesToRemove);
    const privilegesRemaining = privilegesAndIds.slice(nrOfPrivilegesToRemove, privilegesAndIds.length).map(([_, privilege]) => privilege);
    let shard = SRDT.projectData(obj, polTreeSecurityPolicy, userEnv);
    const totalTimeBefore = process.hrtime.bigint();
    const removeMigration = [];
    for (const [privilegeId, privilege] of privilegesAndIdsToRemove) {
        polTreeSecurityPolicy.removePrivilegeById(privilegeId);
    }
    const timeBefore = process.hrtime.bigint();
    for (const [privilegeId, privilege] of privilegesAndIdsToRemove) {
        const delta = polTreeSecurityPolicy.migrateRemove(privilege, shard, userEnv);
        // apply the patch to the shard for the next itation
        for (const patch of delta) {
            SRDT.ObjectManipulation.removeObjectValue(shard, patch.path);
        }
        // bookkeeping
        removeMigration.push(...delta);
    }
    const timeAfter = process.hrtime.bigint();
    const totalRemoveMigrationCalculationTimeElapsed = timeAfter - timeBefore;
    const totalTimeEnd = process.hrtime.bigint();
    if (PRINT_OUTPUT) {
        console.log(util.inspect(removeMigration, { depth: null, maxArrayLength: null }));
    }
    if (CORRECTNESS_CHECK) {
        const plainSecurityPolicy = SRDT.makePlainSecurityPolicy(privilegesRemaining);
        const plainShard = SRDT.projectData(obj, plainSecurityPolicy, userEnv);
        const differences = diff(shard, plainShard);
        if (differences.length !== 0) {
            console.log(util.inspect(differences, { depth: null, maxArrayLength: null }));
            throw new Error(`Output is not equal`);
        }
    }
    const initialCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privileges, userEnv, paths);
    const finalCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privilegesRemaining, userEnv, paths);
    return {
        iteration: iterationNb,
        sourceObjectStats: {
            sizeIndication: Buffer.byteLength(JSON.stringify(obj)),
            numberOfPaths: paths.length,
            maxDepth: paths.reduce((acc, path) => Math.max(acc, path.length), 0),
            topLevelBreadth: Object.keys(obj).length
        },
        privilegeStats: {
            initialNumberOfPrivileges: privileges.length,
            numberOfRemovedPrivileges: privilegesAndIdsToRemove.length,
            initialCoverage: {
                totalNumberOfPaths: initialCoverageStats.totalNumberOfPaths,
                numberOfPathsCovered: initialCoverageStats.numberOfPathsCovered,
                coveragePercent: initialCoverageStats.coveragePercent
            },
            finalCoverage: {
                totalNumberOfPaths: finalCoverageStats.totalNumberOfPaths,
                numberOfPathsCovered: finalCoverageStats.numberOfPathsCovered,
                coveragePercent: finalCoverageStats.coveragePercent
            },
            userEnvSize: `${SRDT.ObjectManipulation.getAllObjectPaths(userEnv, { leavesOnly: true }).length} paths`
        },
        measurements: {
            measuredMigrationTimeNs: Number(totalRemoveMigrationCalculationTimeElapsed),
            measuredTotalTimeNs: Number(totalTimeEnd - totalTimeBefore),
            migrationSize: Buffer.byteLength(gzipSync(Buffer.from(JSON.stringify(removeMigration), "utf16le"))),
            migrationOpsNr: removeMigration.length,
            migrationNonGzip: Buffer.byteLength(Buffer.from(JSON.stringify(removeMigration), "utf16le"))
        },
    };
}
const program = new Command();
program.addOption(new Option('--approach <size>', "Which approach to bench").choices(["srdt-plain-security-policy", "poltree-security-policy", "srdt-plain-security-policy-with-diff"]).makeOptionMandatory());
program.addOption(new Option('--size <size>', "fast-check size of the generated object, will be increased when it is not possible to generate a large enough object for the requested number of privileges (or eventually error)").choices(["xsmall", "small", "medium", "large", "xlarge"]).makeOptionMandatory());
program.requiredOption("--depth-size <number>", "fast-check depth size for the generated object, suggested range 1-50, will be increased when it is not possible to generate a large enough object for the requested number of privileges (or eventually error)", parseInt);
program.requiredOption("--number-of-privileges <number>", "number of privileges to derive from the generated object", parseInt);
program.addOption(new Option("--number-of-privileges-to-remove <number>", "number of privileges to remove").argParser(parseInt).makeOptionMandatory());
program.requiredOption("--minimum-object-paths <number>", "Minimum number of paths that a generated object should have (e.g., to accommodate a future security policy)", parseInt);
program.requiredOption("--iterations <number>", "how many iterations should be performed? These results are also outputted", parseInt);
program.option("--seed <number>", "a number between 0 and 1 that serves as the seed for random generation.", parseFloat);
program.parse();
const options = program.opts();
console.log('Options: ', options);
switch (options.approach) {
    case "srdt-plain-security-policy": {
        const outputs = benchPlainSecPolShardRemoveMigration(options.size, options.depthSize, options.numberOfPrivileges, options.numberOfPrivilegesToRemove, options.minimumObjectPaths, options.seed, options.iterations);
        console.log("####-OUTPUT-SECTION-####");
        outputs.map((iteration) => console.log(JSON.stringify(iteration)));
        break;
    }
    case "srdt-plain-security-policy-with-diff": {
        const outputs = benchPlainSecPolShardRemoveMigrationBladediff(options.size, options.depthSize, options.numberOfPrivileges, options.numberOfPrivilegesToRemove, options.minimumObjectPaths, options.seed, options.iterations);
        console.log("####-OUTPUT-SECTION-####");
        outputs.map((iteration) => console.log(JSON.stringify(iteration)));
        break;
    }
    case "poltree-security-policy": {
        const outputs = benchPolTreeShardRemoveMigration(options.size, options.depthSize, options.numberOfPrivileges, options.numberOfPrivilegesToRemove, options.minimumObjectPaths, options.seed, options.iterations);
        console.log("####-OUTPUT-SECTION-####");
        outputs.map((iteration) => console.log(JSON.stringify(iteration)));
        break;
    }
    default:
        throw new Error(`Unknown approach in command-line arguments`);
}
//# sourceMappingURL=benchShardRemoveMigration.js.map