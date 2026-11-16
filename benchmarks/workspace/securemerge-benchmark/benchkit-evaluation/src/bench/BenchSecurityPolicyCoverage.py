import os, json
from pathlib import Path
from benchkit.core.bktypes import RecordResult
from benchkit.core.bktypes.callresults import RunResult
from benchkit.core.bktypes.contexts import CollectContext, RunContext


class BenchSecurityPolicyCoverage():
    """
    This class implements all phases of the benchkit protocol:
    - run: Execute one instance of the benchmark
    - collect: Parse performance metrics from output
    """

    def run(
            self,
            ctx: RunContext,
            nb_privileges: int,
            size: str,
            depth_size: int,
            nb_min_object_paths: int,
            seed: float
    ) -> RunResult:
        benchmark_entrypoint = "../dist/2026-poltree-paper/benchSecurityPolicyCoverage.js"
        run_command = [
            "node",
            "--max-old-space-size-percentage=90",
            benchmark_entrypoint,
            "--size",
            f"{size}",
            "--depth-size",
            f"{depth_size}",
            "--number-of-privileges",
            f"{nb_privileges}",
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

        record: RecordResult = {
            "nb_privileges": stats["numberOfPrivileges"],
            "coverage_percent": stats["coverage"]["coveragePercent"],
            "nb_total_paths": stats["coverage"]["totalNumberOfPaths"],
            "nb_paths_covered": stats["coverage"]["numberOfPathsCovered"]
        }

        return record
