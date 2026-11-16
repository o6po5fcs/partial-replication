
from benchkit import CampaignCartesianProduct
from src.bench.BenchDiffTimeAdd import BenchDiffTimeAdd
import random

def bench_diff_speed(nb_runs, results_dir, tmp_dir) -> None:
    nb_different_objects = 1  # will be multiplied by number of entries in nb_min_object_paths

    parameter_space = {
        "approach": ["poltree-security-policy", "srdt-plain-security-policy-with-diff"],
        "nb_privileges": [0],
        "nb_privileges_to_add": [1, *[x for x in range(1, 5000) if x % 250 == 0]],
        "size": ["xlarge"],
        "depth_size": [50],
        "nb_min_object_paths": [10000],
        "seed": [0.5]# [random.random() for s in range(nb_different_objects)],
    }


    # Create a campaign that runs all combinations
    campaign = CampaignCartesianProduct(
        name="ADD-bench_diff_speed",
        benchmark=BenchDiffTimeAdd(),
        variables=parameter_space,
        nb_runs=nb_runs,
        results_dir=results_dir,
        tmp_dir=tmp_dir
    )

    # Execute the campaign
    campaign.run()

    campaign.generate_graph(
        title="Nb. of added privileges vs. time to establish diff (Add)",
        plot_name="lineplot",
        x="number_of_privileges",
        xlabel=f"Number of privileges",
        y="measured_migration_time_ms",
        ylabel="Time (milliseconds)",
        hue="approach",
        errorbar=('ci', 95),
        markers=True,
    )

if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser()
    parser.add_argument("--nb_runs", help="Number of times to repeat the experiment", type=int)
    parser.add_argument("--results_dir", help="Directory where to store results", type=str)
    parser.add_argument("--tmp_dir", help="Directory where to store tmp values", type=str)


    args = parser.parse_args()

    results_dir = Path(args.results_dir) if args.results_dir else None
    tmp_dir = Path(args.tmp_dir) if args.tmp_dir else None
    bench_diff_speed(nb_runs=args.nb_runs if args.nb_runs else 2, results_dir=results_dir, tmp_dir=tmp_dir)
