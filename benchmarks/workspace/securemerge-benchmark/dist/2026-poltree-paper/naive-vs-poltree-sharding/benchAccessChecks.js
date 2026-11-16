import { SRDT } from "../../deps.js";
import { Command, Option } from 'commander';
import { generateData } from "../generateData.js";
import { generateDataWithSimpleSecurityPolicy } from "../generateDataWithSimpleSecurityPolicy.js";
const PRINT_OUTPUT = false;
export function benchPlainSecPol(size, depthSize, numberOfPrivileges, numberOfChecks, minimumObjectPathsSize, seed, iterations, insertWildcards = false) {
    if (insertWildcards) {
        const { obj, paths, privileges, userEnv } = generateData(size, depthSize, numberOfPrivileges, minimumObjectPathsSize, seed, true);
        const plainSecurityPolicy = SRDT.makePlainSecurityPolicy(privileges);
        return bench(obj, paths, privileges, userEnv, plainSecurityPolicy, paths, numberOfChecks, iterations);
    }
    else {
        const { obj, paths, privileges, userEnv } = generateDataWithSimpleSecurityPolicy(size, depthSize, numberOfPrivileges, minimumObjectPathsSize, seed);
        const plainSecurityPolicy = SRDT.makePlainSecurityPolicy(privileges);
        return bench(obj, paths, privileges, userEnv, plainSecurityPolicy, paths, numberOfChecks, iterations);
    }
}
export function benchPolTree(size, depthSize, numberOfPrivileges, numberOfChecks, minimumObjectPathsSize, seed, iterations, insertWildcards = false) {
    if (insertWildcards) {
        const { obj, paths, privileges, userEnv } = generateData(size, depthSize, numberOfPrivileges, minimumObjectPathsSize, seed, true);
        const polTree = SRDT.makePolTreeSecurityPolicy(privileges);
        return bench(obj, paths, privileges, userEnv, polTree, paths, numberOfChecks, iterations);
    }
    else {
        const { obj, paths, privileges, userEnv } = generateDataWithSimpleSecurityPolicy(size, depthSize, numberOfPrivileges, minimumObjectPathsSize, seed);
        const polTree = SRDT.makePolTreeSecurityPolicy(privileges);
        return bench(obj, paths, privileges, userEnv, polTree, paths, numberOfChecks, iterations);
    }
}
export function bench(obj, paths, privileges, userEnv, securityPolicy, allPaths, numberOfChecks, iterations) {
    const allowedPaths = [];
    const disallowedPaths = [];
    for (const path of allPaths) {
        if (securityPolicy.isReadable(path, userEnv)) {
            allowedPaths.push(path);
        }
        else {
            disallowedPaths.push(path);
        }
    }
    const outputs = [];
    for (let i = 1; i <= iterations; i++) {
        outputs.push(benchOnce(obj, paths, privileges, userEnv, securityPolicy, allowedPaths, disallowedPaths, numberOfChecks, i));
    }
    return outputs;
}
export function benchOnce(obj, paths, privileges, userEnv, securityPolicy, allowedPaths, disallowedPaths, numberOfChecksToPerform, iterationNr) {
    function getRandomPathIndex(max) {
        return Math.floor(Math.random() * max);
    }
    // An empty pool yields no indices (indexing an empty array would give undefined paths)
    function randomIndices(poolSize) {
        if (poolSize === 0) {
            return [];
        }
        const idxArray = new Array(numberOfChecksToPerform);
        for (let i = 0; i < numberOfChecksToPerform; i++) {
            idxArray[i] = getRandomPathIndex(poolSize);
        }
        return idxArray;
    }
    const allowedCheckPathIndices = randomIndices(allowedPaths.length);
    const disallowedCheckPathIndices = randomIndices(disallowedPaths.length);
    const firstHalfAllowed = allowedCheckPathIndices.slice(0, allowedCheckPathIndices.length / 2);
    const firstHalfDisallowed = disallowedCheckPathIndices.slice(0, disallowedCheckPathIndices.length / 2);
    const combinedCheckPathIndices = firstHalfAllowed.concat(firstHalfDisallowed);
    SRDT.DataGenerators.randomShuffleArray(combinedCheckPathIndices);
    if (PRINT_OUTPUT) {
        console.dir(privileges);
        console.dir(allowedPaths);
        console.dir(disallowedPaths);
        console.dir(combinedCheckPathIndices);
        console.dir(allowedCheckPathIndices);
        console.dir(disallowedCheckPathIndices);
    }
    const timings = {
        combinedPathsNs: -1,
        avgPerCombinedNs: -1,
        allowedNs: -1,
        avgPerAllowedNs: -1,
        disallowedNs: -1,
        avgPerDisallowedNs: -1,
        throughputAllowedPerMs: -1,
        throughputDisallowedPerMs: -1,
        throughputCombinedPerMs: -1,
    };
    {
        const timeBefore = process.hrtime.bigint();
        for (const pathIdx of combinedCheckPathIndices) {
            const path = paths[pathIdx];
            securityPolicy.isReadable(path, userEnv);
        }
        const timeAfter = process.hrtime.bigint();
        timings.combinedPathsNs = Number(timeAfter - timeBefore);
        timings.avgPerCombinedNs = paths.length === 0 ? 0 : Number((timeAfter - timeBefore) / BigInt(combinedCheckPathIndices.length));
        timings.throughputCombinedPerMs = combinedCheckPathIndices.length / (timings.combinedPathsNs / 1000000);
    }
    {
        const timeBefore = process.hrtime.bigint();
        for (const pathIdx of allowedCheckPathIndices) {
            const path = allowedPaths[pathIdx];
            securityPolicy.isReadable(path, userEnv);
        }
        const timeAfter = process.hrtime.bigint();
        timings.allowedNs = Number(timeAfter - timeBefore);
        timings.avgPerAllowedNs = allowedPaths.length === 0 ? 0 : Number((timeAfter - timeBefore) / BigInt(allowedCheckPathIndices.length));
        timings.throughputAllowedPerMs = allowedCheckPathIndices.length / (timings.allowedNs / 1000000);
    }
    {
        const timeBefore = process.hrtime.bigint();
        for (const pathIdx of disallowedCheckPathIndices) {
            const path = disallowedPaths[pathIdx];
            securityPolicy.isReadable(path, userEnv);
        }
        const timeAfter = process.hrtime.bigint();
        timings.disallowedNs = Number(timeAfter - timeBefore);
        timings.avgPerDisallowedNs = disallowedPaths.length === 0 ? 0 : Number((timeAfter - timeBefore) / BigInt(disallowedCheckPathIndices.length));
        timings.throughputDisallowedPerMs = disallowedCheckPathIndices.length / (timings.disallowedNs / 1000000);
    }
    const coverageStats = SRDT.DataGenerators.calcSecurityPolicyCoverage(privileges, userEnv, paths);
    return {
        iteration: iterationNr,
        sourceObjectStats: {
            sizeIndication: `${Buffer.byteLength(JSON.stringify(obj))} bytes`,
            numberOfPaths: paths.length,
            maxDepth: paths.reduce((acc, path) => Math.max(acc, path.length), 0),
            topLevelBreadth: `${Object.keys(obj).length} keys`
        },
        privilegeStats: {
            numberOfPrivileges: privileges.length,
            totalPaths: paths.length,
            allowedPaths: allowedPaths.length,
            disallowedPaths: disallowedPaths.length,
            coverage: {
                totalNumberOfPaths: coverageStats.totalNumberOfPaths,
                numberOfPathsCovered: coverageStats.numberOfPathsCovered,
                coveragePercent: coverageStats.coveragePercent
            },
            userEnvSize: `${SRDT.ObjectManipulation.getAllObjectPaths(userEnv, { leavesOnly: true }).length} paths`,
            numberOfChecksPerformed: numberOfChecksToPerform
        },
        measurements: timings
    };
}
const program = new Command();
program.addOption(new Option('--approach <size>', "Which approach to bench").choices(["srdt-plain-security-policy", "poltree-security-policy"]).makeOptionMandatory());
program.addOption(new Option('--size <size>', "fast-check size of the generated object, will be increased when it is not possible to generate a large enough object for the requested number of privileges (or eventually error)").choices(["xsmall", "small", "medium", "large", "xlarge"]).makeOptionMandatory());
program.requiredOption("--depth-size <number>", "fast-check depth size for the generated object, suggested range 1-50, will be increased when it is not possible to generate a large enough object for the requested number of privileges (or eventually error)", parseInt);
program.requiredOption("--number-of-privileges <number>", "number of privileges to derive from the generated object", parseInt);
program.requiredOption("--number-of-checks <number>", "number of paths to check from the allowed or disallowed paths to check the readability of", parseInt);
// program.requiredOption("--coverage-percent <number>", "Target coverage percent of the security policy, i.e., the % of the generated object that the security policy allows access to", parseFloat);
program.requiredOption("--minimum-object-paths <number>", "Minimum number of paths that a generated object should have (e.g., to accommodate a future security policy)", parseInt);
program.option("--seed <number>", "a number between 0 and 1 that serves as the seed for random generation.", parseFloat, Math.random());
program.requiredOption("--iterations <number>", "how many iterations should be performed? These results are also outputted", parseInt);
program.option("--generate-wildcards", "whether to generate wildcards in the security policy, which significantly slows down generation");
program.parse();
const options = program.opts();
console.log('Options: ', options);
const generateWildcards = options.generateWildcards !== undefined;
console.log(`Generating wildcards? ${generateWildcards}`);
switch (options.approach) {
    case "srdt-plain-security-policy": {
        const outputs = benchPlainSecPol(options.size, options.depthSize, options.numberOfPrivileges, options.numberOfChecks, options.minimumObjectPaths, options.seed, options.iterations, generateWildcards);
        console.log("####-OUTPUT-SECTION-####");
        outputs.map((iteration) => console.log(JSON.stringify(iteration)));
        break;
    }
    case "poltree-security-policy": {
        const outputs = benchPolTree(options.size, options.depthSize, options.numberOfPrivileges, options.numberOfChecks, options.minimumObjectPaths, options.seed, options.iterations, generateWildcards);
        console.log("####-OUTPUT-SECTION-####");
        outputs.map((iteration) => console.log(JSON.stringify(iteration)));
        break;
    }
    default:
        throw new Error(`Unknown approach in command-line arguments`);
}
//# sourceMappingURL=benchAccessChecks.js.map