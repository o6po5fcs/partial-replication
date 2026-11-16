
from benchkit import CampaignCartesianProduct
from src.bench.BenchShardAdd import BenchShardAdd
from src.add.graphs import render_migration_speed_graphs




def bench_migration_speed(nb_runs, results_dir, tmp_dir, iterations, graphs_nb_warmup_runs_to_ignore, nb_privileges_to_add=None) -> None:
    nb_privileges = [0, 1000, 2000, 3000]

    if not nb_privileges_to_add:
        nb_privileges_to_add = [1,
                                 *[x for x in range(10, 101) if x % 10 == 0],
                                 *[x for x in range(100, 1001) if x % 100 == 0],
                                 *[x for x in range(1000, 10001) if x % 1000 == 0]]


    parameter_space = {
        "approach": ["poltree-security-policy", "srdt-plain-security-policy-with-diff"],
        "nb_privileges": nb_privileges,
        "nb_privileges_to_add": nb_privileges_to_add,
        "size": ["xlarge"],
        "depth_size": [50],
        "nb_min_object_paths": [10000],
        "seed": [0.5],
        "iterations": [iterations]
    }


    # Create a campaign that runs all combinations
    campaign = CampaignCartesianProduct(
        name="naive-vs-poltree-shard-add",
        benchmark=BenchShardAdd(),
        variables=parameter_space,
        nb_runs=nb_runs,
        results_dir=results_dir,
        tmp_dir=tmp_dir
    )

    # Execute the campaign
    campaign.run()
    render_migration_speed_graphs(campaign.csv_output_abs_path(), graphs_nb_warmup_runs_to_ignore)



if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser()
    parser.add_argument("--nb_runs", help="Number of times to repeat the experiment", type=int)
    parser.add_argument("--results_dir", help="Directory where to store results", type=str)
    parser.add_argument("--tmp_dir", help="Directory where to store tmp values", type=str)
    parser.add_argument("--iterations", help="How many iterations to perform within a single nodejs process", type=int)
    parser.add_argument("--graphs_nb_warmup_runs_to_ignore", help="How many iterations to ignore for graphing purposes", type=int)

    parser.add_argument("--privileges_to_add",
                        help="A list of nb. of privileges to add (separate via spaces).",
                        type=int, nargs="+")

    args = parser.parse_args()
    results_dir = Path(args.results_dir) if args.results_dir else None
    tmp_dir = Path(args.tmp_dir) if args.tmp_dir else None
    iterations = args.iterations if args.iterations else 1
    graphs_nb_warmup_runs_to_ignore = args.graphs_nb_warmup_runs_to_ignore if args.graphs_nb_warmup_runs_to_ignore is not None else 10


    bench_migration_speed(args.nb_runs if args.nb_runs else 2, results_dir=results_dir, tmp_dir=tmp_dir, iterations=iterations, graphs_nb_warmup_runs_to_ignore=graphs_nb_warmup_runs_to_ignore, nb_privileges_to_add=args.privileges_to_add)
