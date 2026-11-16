import os, json
from pathlib import Path
from benchkit.core.bktypes import RecordResult
from benchkit.core.bktypes.callresults import RunResult
from benchkit.core.bktypes.contexts import CollectContext, RunContext



class BenchAccessCheck():
    """
    This class implements all phases of the benchkit protocol:
    - run: Execute one instance of the benchmark
    - collect: Parse performance metrics from output
    """

    def run(
        self,
        ctx: RunContext,
        approach: str,
        security_policy_size_to_check: int,
        number_of_checks: int,
        size: str,
        depth_size: int,
        nb_min_object_paths: int,
        seed: float,
        iterations: int,
        generate_wildcards: bool,
    ) -> RunResult:
        benchmark_entrypoint = "../dist/2026-poltree-paper/naive-vs-poltree-sharding/benchAccessChecks.js"
        run_command = [
            "node",
            "--max-old-space-size-percentage=90",
            benchmark_entrypoint,
            "--approach",
            approach,
            "--size",
            f"{size}",
            "--depth-size",
            f"{depth_size}",
            "--number-of-privileges",
            f"{security_policy_size_to_check}",
            "--number-of-checks",
            f"{number_of_checks}",
            "--minimum-object-paths",
            f"{nb_min_object_paths}",
            "--seed",
            f"{seed}",
            "--iterations",
            f"{iterations}"
        ]

        if generate_wildcards:
            run_command.extend(["--generate-wildcards"])

        cwd = Path(__file__).parents[2]
        exec_out = ctx.exec(argv=run_command, cwd=cwd, print_output=False, output_is_log=True, env=os.environ)

        result = RunResult(outputs=[exec_out])
        return result

    def collect(
        self,
        ctx: CollectContext,
        approach: str
    ) -> RecordResult:
        """
        Parse performance metrics from output.
        """
        output = ctx.run_result.outputs[-1].stdout

        # ------------------------------------------------------------------
        # 1) Parse patched benchstats line
        # ------------------------------------------------------------------
        if "####-OUTPUT-SECTION-####" not in output:
            raise ValueError(f"Incoherent output from benchmark (missing ####-OUTPUT-SECTION-#### line):\n{output}")

        benchstats = output.split("####-OUTPUT-SECTION-####")[-1].strip()
        iterations = [
            json.loads(line)
            for line in benchstats.splitlines()
            if line.strip()
        ]
        # print(stats)

        output_records = []
        for iteration in iterations:
            nb_privileges = iteration["privilegeStats"]["numberOfPrivileges"]

            record: RecordResult = {
                "iteration": iteration["iteration"],
                "series": approach,
                "nb_privileges": nb_privileges,
                "nb_checks_performed": iteration["privilegeStats"]["numberOfChecksPerformed"],
                "nb_allowed_paths": iteration["privilegeStats"]["allowedPaths"],
                "nb_disallowed_paths": iteration["privilegeStats"]["disallowedPaths"],
                "coveragePercent": iteration["privilegeStats"]["coverage"]["coveragePercent"],
                "time_combined_ns": iteration["measurements"]["combinedPathsNs"],
                "time_allowed": iteration["measurements"]["allowedNs"],
                "time_avg_allowed": iteration["measurements"]["avgPerAllowedNs"],
                "time_disallowed": iteration["measurements"]["disallowedNs"],
                "time_avg_disallowed": iteration["measurements"]["avgPerDisallowedNs"],
                "throughput_allowed_per_ms": iteration["measurements"]["throughputAllowedPerMs"],
                "throughput_disallowed_per_ms": iteration["measurements"]["throughputDisallowedPerMs"],
                "throughput_combined_per_ms":  iteration["measurements"]["throughputCombinedPerMs"],
            }

            output_records.append(record)

        return output_records
