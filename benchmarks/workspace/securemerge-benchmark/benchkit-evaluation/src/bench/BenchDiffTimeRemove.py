import os, json
from pathlib import Path
from benchkit.core.bktypes import RecordResult
from benchkit.core.bktypes.callresults import RunResult
from benchkit.core.bktypes.contexts import CollectContext, RunContext


class BenchDiffTimeRemove():
    """
    This class implements all phases of the benchkit protocol:
    - run: Execute one instance of the benchmark
    - collect: Parse performance metrics from output
    """

    def run(
            self,
            ctx: RunContext,
            approach: str,
            nb_privileges,
            nb_privileges_to_remove,
            size: str,
            depth_size,
            nb_min_object_paths,
            seed: float
    ) -> RunResult:
        benchmark_entrypoint = "../dist/2026-poltree-paper/naive-vs-poltree-sharding/benchShardRemoveMigration.js"
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
            f"{nb_privileges}",
            "--number-of-privileges-to-remove",
            f"{nb_privileges_to_remove}",
            "--minimum-object-paths",
            f"{nb_min_object_paths}",
            "--seed",
            f"{seed}"
        ]

        cwd = Path(__file__).parents[2]
        exec_out = ctx.exec(argv=run_command, cwd=cwd, print_output=False, output_is_log=True, env=os.environ)

        result = RunResult(outputs=[exec_out])
        return result

    def collect(
            self,
            ctx: CollectContext,
            approach: str,
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
        stats = json.loads(benchstats)
        # print(stats)

        nb_initial_privileges = stats["privilegeStats"]["initialNumberOfPrivileges"]
        nb_removed_privileges = stats["privilegeStats"]["numberOfRemovedPrivileges"]

        if approach == "poltree-security-policy":
            time_key = "measuredMigrationTimeNs"
        elif approach == "srdt-plain-security-policy-with-diff":
            time_key = "measuredDiffTimeNs"
        else:
            raise RuntimeError

        measured_migration_time_ns = stats["measurements"][time_key]
        record: RecordResult = {
            "approach": approach,
            "number_of_privileges": nb_initial_privileges - nb_removed_privileges,
            "measured_migration_time_ns": measured_migration_time_ns,
            "measured_migration_time_ms": stats["measurements"][time_key] / 1000000,
            "measured_total_time": stats["measurements"]["measuredTotalTime"],
            "source_object_size": stats["sourceObjectStats"]["sizeIndication"],
            "measured_migration_size": stats["measurements"]["migrationSize"],
            "measured_migration_size_non_gzip": stats["measurements"]["migrationNonGzip"],
            "migration_size_percent": stats["measurements"]["migrationSize"] / stats["sourceObjectStats"][
                "sizeIndication"],
            "nb_diffs_per_ns": 1 / measured_migration_time_ns,
            "nb_diffs_per_ms": 1 / (measured_migration_time_ns / 1000000),
            "nb_diffs_per_s": 1 / (measured_migration_time_ns / 1000000000),
        }

        return record
