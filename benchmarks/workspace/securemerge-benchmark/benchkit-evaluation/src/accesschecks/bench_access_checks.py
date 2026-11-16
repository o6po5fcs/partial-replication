from benchkit import CampaignCartesianProduct
from src.accesschecks.graphs import render_access_check_graphs
from src.bench.BenchAccessCheck import BenchAccessCheck

def bench_access_checks(nb_runs, results_dir, tmp_dir, security_policy_sizes_to_check, number_of_checks, iterations, generate_wildcards, graphs_nb_warmup_runs_to_ignore) -> None:
    parameter_space = {
        "approach": ["srdt-plain-security-policy", "poltree-security-policy"],
        "security_policy_size_to_check": security_policy_sizes_to_check,
        "number_of_checks": [number_of_checks],
        "size": ["xlarge"],
        "depth_size": [50],
        "nb_min_object_paths": [10000],
        "seed": [0.5],
        "iterations": [iterations],
        "generate_wildcards": [generate_wildcards],
    }

    # Create a campaign that runs all combinations
    campaign = CampaignCartesianProduct(
        name="bench_access_checks",
        benchmark=BenchAccessCheck(),
        variables=parameter_space,
        nb_runs=nb_runs,
        results_dir=results_dir,
        tmp_dir=tmp_dir
    )

    # Execute the campaign
    campaign.run()
    render_access_check_graphs(campaign.csv_output_abs_path(), graphs_nb_warmup_runs_to_ignore)




if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser()
    parser.add_argument("--nb_runs", help="Number of times to repeat the experiment", type=int)
    parser.add_argument("--results_dir", help="Directory where to store results", type=str)
    parser.add_argument("--tmp_dir", help="Directory where to store tmp values", type=str)
    parser.add_argument("--iterations", help="How many iterations to perform within a single nodejs process", type=int)
    parser.add_argument("--graphs_nb_warmup_runs_to_ignore", help="How many iterations to ignore for graphing purposes", type=int)
    parser.add_argument("--security_policy_sizes_to_check",
                        help="A list of security policy sizes to check (separate via spaces).",
                        type=int, nargs="+")
    parser.add_argument("--number_of_checks", help="How many access checks to perform, randomly sampled (separate via spaces).", type=int)
    parser.add_argument("--generate-wildcards", help="Whether to include wildcards in the generation process", action=argparse.BooleanOptionalAction)


    args = parser.parse_args()
    results_dir = Path(args.results_dir) if args.results_dir else None
    tmp_dir = Path(args.tmp_dir) if args.tmp_dir else None
    iterations = args.iterations if args.iterations else 1
    security_policy_sizes_to_check = args.security_policy_sizes_to_check if args.security_policy_sizes_to_check else [1000]
    number_of_checks = args.number_of_checks if args.number_of_checks else 100
    graphs_nb_warmup_runs_to_ignore = args.graphs_nb_warmup_runs_to_ignore if args.graphs_nb_warmup_runs_to_ignore is not None else 10

    bench_access_checks(args.nb_runs if args.nb_runs else 2,
                        results_dir=results_dir,
                        tmp_dir=tmp_dir,
                        security_policy_sizes_to_check=security_policy_sizes_to_check,
                        number_of_checks=number_of_checks,
                        iterations=iterations,
                        generate_wildcards=args.generate_wildcards,
                        graphs_nb_warmup_runs_to_ignore=graphs_nb_warmup_runs_to_ignore)
