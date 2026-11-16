import { SRDT } from "../../deps.js";
import { gzipSync } from "node:zlib";
import { Command, Option } from "commander";
import util from "node:util";
import { diff } from '@blazediff/object';
import { generateDataWithSimpleSecurityPolicy } from "../generateDataWithSimpleSecurityPolicy.js";
// check the correctness of the output of the PolTree approach
const CORRECTNESS_CHECK = false;
const PRINT_OUTPUT = false;
export function benchPlainSecPolShardAddMigration(size, depthSize, securityPolicySize, nrOfPrivilegesToAdd, minimumObjectPathsSize, seed, iterations) {
    const { obj, paths, privileges, userEnv } = generateDataWithSimpleSecurityPolicy(size, depthSize, securityPolicySize + nrOfPrivilegesToAdd, minimumObjectPathsSize, seed);
    const privilegesForInitialSecurityPolicy = privileges.slice(0, securityPolicySize);
    const extendedSecurityPolicy = SRDT.makePlainSecurityPolicy(privileges);
    if (PRINT_OUTPUT) {
        console.dir(privileges, { depth: null });
    }
    const outputs = [];
    for (let i = 1; i <= iterations; i++) {
        outputs.push(benchOnce_PlainSecPolShardAddMigration({ obj, paths, privileges, userEnv }, privilegesForInitialSecurityPolicy, extendedSecurityPolicy, i));
    }
    return outputs;
}
export function benchOnce_PlainSecPolShardAddMigration({ obj, paths, privileges, userEnv }, privilegesForInitialSecurityPolicy, extendedSecurityPolicy, iterationNb) {
    // compute a shard after adding privileges
    const timeBefore = process.hrtime.bigint();
    const newShard = SRDT.projectData(obj, extendedSecurityPolicy, userEnv);
    const timeAfter = process.hrtime.bigint();
    if (PRINT_OUTPUT) {
        console.dir(privileges, { depth: null, maxArrayLength: null });
    }
    const initialCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privilegesForInitialSecurityPolicy, userEnv, paths);
    const finalCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privileges, userEnv, paths);
    return {
        iteration: iterationNb,
        sourceObjectStats: {
            sizeIndication: Buffer.byteLength(JSON.stringify(obj)),
            numberOfPaths: paths.length,
            maxDepth: paths.reduce((acc, path) => Math.max(acc, path.length), 0),
            topLevelBreadth: Object.keys(obj).length
        },
        privilegeStats: {
            initialNumberOfPrivileges: privilegesForInitialSecurityPolicy.length,
            numberOfAddedPrivileges: privileges.length - privilegesForInitialSecurityPolicy.length,
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
export function benchPlainSecPolPlusDiffShardAddMigration(size, depthSize, securityPolicySize, nrOfPrivilegesToAdd, minimumObjectPathsSize, seed, iterations) {
    const { obj, paths, privileges, userEnv } = generateDataWithSimpleSecurityPolicy(size, depthSize, securityPolicySize + nrOfPrivilegesToAdd, minimumObjectPathsSize, seed);
    const privilegesForInitialSecurityPolicy = privileges.slice(0, securityPolicySize);
    const extendedSecurityPolicy = SRDT.makePlainSecurityPolicy(privileges);
    if (PRINT_OUTPUT) {
        console.dir(privileges, { depth: null, maxArrayLength: null });
    }
    const outputs = [];
    for (let i = 1; i <= iterations; i++) {
        outputs.push(benchOnce_PlainSecPolPlusDiffShardAddMigration({ obj, paths, privileges, userEnv }, privilegesForInitialSecurityPolicy, extendedSecurityPolicy, i));
    }
    return outputs;
}
export function benchOnce_PlainSecPolPlusDiffShardAddMigration({ obj, paths, privileges, userEnv }, privilegesForInitialSecurityPolicy, extendedSecurityPolicy, iterationNb) {
    const initialSecurityPolicy = SRDT.makePlainSecurityPolicy(privilegesForInitialSecurityPolicy);
    const initialShard = SRDT.projectData(obj, initialSecurityPolicy, userEnv);
    // compute a shard after adding privileges
    const timeBeforeShard = process.hrtime.bigint();
    const newShard = SRDT.projectData(obj, extendedSecurityPolicy, userEnv);
    const timeAfterShard = process.hrtime.bigint();
    const differences = diff(initialShard, newShard);
    const timeAfterBench = process.hrtime.bigint();
    if (PRINT_OUTPUT) {
        console.log(util.inspect(newShard, { depth: null }));
        console.log(util.inspect(differences, { depth: null, maxArrayLength: null }));
    }
    const initialCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privilegesForInitialSecurityPolicy, userEnv, paths);
    const finalCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privileges, userEnv, paths);
    return {
        iteration: iterationNb,
        sourceObjectStats: {
            sizeIndication: Buffer.byteLength(JSON.stringify(obj)),
            numberOfPaths: paths.length,
            maxDepth: paths.reduce((acc, path) => Math.max(acc, path.length), 0),
            topLevelBreadth: Object.keys(obj).length
        },
        privilegeStats: {
            initialNumberOfPrivileges: privilegesForInitialSecurityPolicy.length,
            numberOfAddedPrivileges: privileges.length - privilegesForInitialSecurityPolicy.length,
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
            measuredMigrationTimeNs: Number(timeAfterBench - timeBeforeShard),
            measuredTotalTimeNs: Number(timeAfterBench - timeBeforeShard),
            measuredProjectionTimeNs: Number(timeAfterShard - timeBeforeShard),
            measuredDiffTimeNs: Number(timeAfterBench - timeAfterShard),
            migrationSize: Buffer.byteLength(gzipSync(Buffer.from(JSON.stringify(differences), "utf16le"))),
            migrationNonGzip: Buffer.byteLength(Buffer.from(JSON.stringify(differences), "utf16le"))
        }
    };
}
export function benchPolTreeShardAddMigration(size, depthSize, securityPolicySize, nrOfPrivilegesToAdd, minimumObjectPathsSize, seed, iterations) {
    const { obj, paths, privileges, userEnv } = generateDataWithSimpleSecurityPolicy(size, depthSize, securityPolicySize + nrOfPrivilegesToAdd, minimumObjectPathsSize, seed);
    const privilegesForInitialSecurityPolicy = privileges.slice(0, securityPolicySize);
    const privilegesToAdd = privileges.slice(securityPolicySize, privileges.length);
    if (PRINT_OUTPUT) {
        console.dir(privileges, { depth: null, maxArrayLength: null });
    }
    const outputs = [];
    for (let i = 1; i <= iterations; i++) {
        outputs.push(benchOnce_PolTreeShardAddMigration({ obj, paths, privileges, userEnv }, privilegesForInitialSecurityPolicy, privilegesToAdd, i));
    }
    return outputs;
}
export function benchOnce_PolTreeShardAddMigration({ obj, paths, privileges, userEnv }, privilegesForInitialSecurityPolicy, privilegesToAdd, iterationNb) {
    const polTreeSecurityPolicy = SRDT.makePolTreeSecurityPolicy(privilegesForInitialSecurityPolicy);
    let shard = SRDT.projectData(obj, polTreeSecurityPolicy, userEnv);
    const totalTimeBefore = process.hrtime.bigint();
    for (const privilege of privilegesToAdd) {
        polTreeSecurityPolicy.addPrivilege(privilege);
    }
    const addMigration = [];
    const timeBefore = process.hrtime.bigint();
    for (const privilege of privilegesToAdd) {
        const delta = polTreeSecurityPolicy.migrateAdd(privilege, obj, shard, userEnv);
        // apply the patch to the shard for the next iteration
        for (const patch of delta) {
            SRDT.ObjectManipulation.setObjectValue(shard, patch.path, patch.value);
        }
        // bookkeeping
        addMigration.push(...delta);
    }
    const timeAfter = process.hrtime.bigint();
    const totalAddMigrationCalculationTimeElapsed = timeAfter - timeBefore;
    const totalTimeEnd = process.hrtime.bigint();
    if (PRINT_OUTPUT) {
        console.log(util.inspect(privilegesToAdd, { depth: null, maxArrayLength: null }));
        console.log(util.inspect(addMigration, { depth: null, maxArrayLength: null }));
        console.log(util.inspect(shard, { depth: null }));
    }
    if (CORRECTNESS_CHECK) {
        const plainSecurityPolicy = SRDT.makePlainSecurityPolicy(privileges);
        const plainShard = SRDT.projectData(obj, plainSecurityPolicy, userEnv);
        const differences = diff(shard, plainShard);
        if (differences.length !== 0) {
            console.log(util.inspect(differences, { depth: null }));
            throw new Error(`Output is not equal`);
        }
    }
    const initialCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privilegesForInitialSecurityPolicy, userEnv, paths);
    const finalCoverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privileges, userEnv, paths);
    return {
        iteration: iterationNb,
        sourceObjectStats: {
            sizeIndication: Buffer.byteLength(JSON.stringify(obj)),
            numberOfPaths: paths.length,
            maxDepth: paths.reduce((acc, path) => Math.max(acc, path.length), 0),
            topLevelBreadth: Object.keys(obj).length
        },
        privilegeStats: {
            initialNumberOfPrivileges: privilegesForInitialSecurityPolicy.length,
            numberOfAddedPrivileges: privileges.length - privilegesForInitialSecurityPolicy.length,
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
            measuredMigrationTimeNs: Number(totalAddMigrationCalculationTimeElapsed),
            measuredTotalTimeNs: Number(totalTimeEnd - totalTimeBefore),
            migrationSize: Buffer.byteLength(gzipSync(Buffer.from(JSON.stringify(addMigration), "utf16le"))),
            migrationOpsNr: addMigration.length,
            migrationNonGzip: Buffer.byteLength(Buffer.from(JSON.stringify(addMigration), "utf16le"))
        }
    };
}
const program = new Command();
program.addOption(new Option('--approach <size>', "Which approach to bench").choices(["srdt-plain-security-policy", "poltree-security-policy", "srdt-plain-security-policy-with-diff"]).makeOptionMandatory());
program.addOption(new Option('--size <size>', "fast-check size of the generated object, will be increased when it is not possible to generate a large enough object for the requested number of privileges (or eventually error)").choices(["xsmall", "small", "medium", "large", "xlarge"]).makeOptionMandatory());
program.requiredOption("--depth-size <number>", "fast-check depth size for the generated object, suggested range 1-50, will be increased when it is not possible to generate a large enough object for the requested number of privileges (or eventually error)", parseInt);
program.requiredOption("--number-of-privileges <number>", "number of privileges to derive from the generated object", parseInt);
program.requiredOption("--number-of-privileges-to-add <number>", "number of privileges to add", parseInt);
program.requiredOption("--minimum-object-paths <number>", "Minimum number of paths that a generated object should have (e.g., to accommodate a future security policy)", parseInt);
program.requiredOption("--iterations <number>", "how many iterations should be performed? These results are also outputted", parseInt);
program.option("--seed <number>", "a number between 0 and 1 that serves as the seed for random generation.", parseFloat);
program.parse();
const options = program.opts();
console.log('Options: ', options);
switch (options.approach) {
    case "srdt-plain-security-policy": {
        const outputs = benchPlainSecPolShardAddMigration(options.size, options.depthSize, options.numberOfPrivileges, options.numberOfPrivilegesToAdd, options.minimumObjectPaths, options.seed, options.iterations);
        console.log("####-OUTPUT-SECTION-####");
        outputs.map((iteration) => console.log(JSON.stringify(iteration)));
        break;
    }
    case "srdt-plain-security-policy-with-diff": {
        const outputs = benchPlainSecPolPlusDiffShardAddMigration(options.size, options.depthSize, options.numberOfPrivileges, options.numberOfPrivilegesToAdd, options.minimumObjectPaths, options.seed, options.iterations);
        console.log("####-OUTPUT-SECTION-####");
        outputs.map((iteration) => console.log(JSON.stringify(iteration)));
        break;
    }
    case "poltree-security-policy": {
        const outputs = benchPolTreeShardAddMigration(options.size, options.depthSize, options.numberOfPrivileges, options.numberOfPrivilegesToAdd, options.minimumObjectPaths, options.seed, options.iterations);
        console.log("####-OUTPUT-SECTION-####");
        outputs.map((iteration) => console.log(JSON.stringify(iteration)));
        break;
    }
    default:
        throw new Error(`Unknown approach in command-line arguments`);
}
//# sourceMappingURL=benchShardAddMigration.js.map