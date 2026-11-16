from benchkit import CampaignIterateVariables
from benchkit.campaign import cartesian_product
from src.bench.BenchShardRemove import BenchShardRemove
from src.remove.graphs import render_migration_size_graphs


def bench_migration_size(results_dir, tmp_dir, approaches=None, nb_privileges_to_remove=None) -> None:
    nb_different_objects = 1
    nb_runs = 1
    nb_privileges = [10000, 9000, 8000, 7000]

    if not approaches:
        approaches = ["srdt-plain-security-policy", "poltree-security-policy", "srdt-plain-security-policy-with-diff"]

    if not nb_privileges_to_remove:
        nb_privileges_to_remove = [1,
                                   *[x for x in range(1, 2001) if x % 250 == 0],
                                   *[x for x in range(2000, 10001) if x % 1000 == 0]]

    parameter_space = {
        "approach": approaches,
        "nb_privileges": nb_privileges,
        "nb_privileges_to_remove": nb_privileges_to_remove,
        "seed": [0.5],  # [random.random() for s in range(nb_different_objects)],
        "size": ["xlarge"],
        "depth_size": [50],
        "nb_min_object_paths": [10000],
        "iterations": [1]
    }

    variables = cartesian_product(parameter_space)

    def is_possible_config(config):
        return (config["nb_privileges"] - config["nb_privileges_to_remove"]) >= 0

    def is_good(config):
        return is_possible_config(config)

    # Create a parameter space that includes all combinations, but filter out impossible combinations that
    # should not be run. The goal is to have the value of nb_privileges_to_remove to be dependent on nb_privileges
    # E.g., for nb_privileges=500, nb_privileges_to_remove should be an array from 500 to 0,
    #       and for nb_privileges=100 it should only go from 100 to 0
    #       nb_privileges=100 with nb_privileges_to_remove > 100 would be an impossible combination that is filtered.
    campaign = CampaignIterateVariables(
        name="REMOVE-bench_migration_size_vs_initial_privileges",
        benchmark=BenchShardRemove(),
        nb_runs=nb_runs,
        variables=filter(is_good, variables),
        results_dir=results_dir,
        tmp_dir=tmp_dir
    )

    # Execute the campaign
    campaign.run()
    render_migration_size_graphs(campaign.csv_output_abs_path())

if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser()
    parser.add_argument("--results_dir", help="Directory where to store results", type=str)
    parser.add_argument("--tmp_dir", help="Directory where to store tmp values", type=str)
    parser.add_argument("--approaches", help="A list of approaches to run (separate via spaces).", type=str, nargs="+")
    parser.add_argument("--privileges_to_remove",
                        help="A list of nb. of privileges to remove (separate via spaces).",
                        type=int, nargs="+")

    args = parser.parse_args()
    results_dir = Path(args.results_dir) if args.results_dir else None
    tmp_dir = Path(args.tmp_dir) if args.tmp_dir else None

    bench_migration_size(results_dir=results_dir, tmp_dir=tmp_dir, approaches=args.approaches, nb_privileges_to_remove=args.privileges_to_remove)
