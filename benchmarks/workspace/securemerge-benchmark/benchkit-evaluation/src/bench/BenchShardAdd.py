import os, json
from pathlib import Path
from benchkit.core.bktypes import RecordResult
from benchkit.core.bktypes.callresults import RunResult
from benchkit.core.bktypes.contexts import CollectContext, RunContext


class BenchShardAdd():
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
            nb_privileges_to_add,
            size: str,
            depth_size,
            nb_min_object_paths,
            seed: float,
            iterations: int
    ) -> RunResult:
        benchmark_entrypoint = "../dist/2026-poltree-paper/naive-vs-poltree-sharding/benchShardAddMigration.js"
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
            "--number-of-privileges-to-add",
            f"{nb_privileges_to_add}",
            "--minimum-object-paths",
            f"{nb_min_object_paths}",
            "--seed",
            f"{seed}",
            "--iterations",
            f"{iterations}"
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

        iterations = [
            json.loads(line)
            for line in benchstats.splitlines()
            if line.strip()
        ]

        # print(stats)

        output_records = []
        for iteration in iterations:
            initial_coverage_percent = iteration["privilegeStats"]["initialCoverage"]["coveragePercent"]
            final_coverage_percent = iteration["privilegeStats"]["finalCoverage"]["coveragePercent"]
            nb_object_paths = iteration["sourceObjectStats"]["numberOfPaths"]

            nb_initial_privileges = iteration["privilegeStats"]["initialNumberOfPrivileges"]
            nb_added_privileges = iteration["privilegeStats"]["numberOfAddedPrivileges"]

            measured_migration_time_ns = iteration["measurements"]["measuredMigrationTimeNs"]


            record: RecordResult = {
                "iteration": iteration["iteration"],
                "combined-approach-series": f"{approach}-{nb_object_paths}p",
                "approach": approach,
                "object_series": f"{nb_object_paths} paths",
                "initial_number_of_privileges": nb_initial_privileges,
                "number_of_privileges": nb_initial_privileges + nb_added_privileges,
                "added_number_of_privileges": nb_added_privileges,
                "measured_migration_time_ns": measured_migration_time_ns,
                "measured_migration_time_ms": iteration["measurements"]["measuredMigrationTimeNs"] / 1000000,
                "nb_migrations_per_ns": 1 / measured_migration_time_ns,
                "nb_migrations_per_ms": 1 / (measured_migration_time_ns / 1000000),
                "nb_migrations_per_s": 1 / (measured_migration_time_ns / 1000000000),
                "measured_total_time": iteration["measurements"]["measuredTotalTimeNs"],
                "source_object_size": iteration["sourceObjectStats"]["sizeIndication"],
                "measured_migration_size": iteration["measurements"]["migrationSize"],
                "measured_migration_size_non_gzip": iteration["measurements"]["migrationNonGzip"],
                "delta_coverage_percent": final_coverage_percent - initial_coverage_percent,
                "initial_coverage_percent": initial_coverage_percent,
                "final_coverage_percent": final_coverage_percent,
                "migration_size_percent": iteration["measurements"]["migrationSize"] / iteration["sourceObjectStats"][
                    "sizeIndication"]
            }


            if approach == "srdt-plain-security-policy-with-diff":
                measured_projection_time_without_diff = iteration["measurements"]["measuredProjectionTimeNs"]
                record.update({
                    "measured_projection_time": measured_projection_time_without_diff,
                    "nb_projections_per_ns": 1 / measured_projection_time_without_diff,
                    "nb_projections_per_ms": 1 / (measured_projection_time_without_diff / 1000000),
                    "nb_projections_per_s": 1 / (measured_projection_time_without_diff / 1000000000),
                })
            else:
                record.update({
                    "measured_projection_time": 0,
                    "nb_projections_per_ns": 0,
                    "nb_projections_per_ms": 0,
                    "nb_projections_per_s": 0,
                })

            output_records.append(record)
        return output_records
