from benchkit import CampaignIterateVariables
from benchkit.campaign import cartesian_product
from src.bench.BenchShardAdd import BenchShardAdd
from src.add.graphs import render_migration_size_graphs


def bench_migration_size_vs_initial_privileges(results_dir, tmp_dir, approaches=None, nb_privileges_to_add=None) -> None:
    nb_different_objects = 1  # will be multiplied by number of entries in nb_min_object_paths
    nb_runs = 1
    nb_privileges = [0, 1000, 2000, 3000]
    #privilege_ceiling = 10000

    if not approaches:
        approaches = ["srdt-plain-security-policy", "poltree-security-policy", "srdt-plain-security-policy-with-diff"]

    if not nb_privileges_to_add:
        nb_privileges_to_add = [1,
                                 *[x for x in range(10, 101) if x % 10 == 0],
                                 *[x for x in range(100, 1001) if x % 100 == 0],
                                 *[x for x in range(1001, 10001) if x % 1000 == 0]]
        #nb_privileges_to_add = [1,
        #                        *[x for x in range(1, 2001) if x % 250 == 0],
        #                        *[x for x in range(2000, 10001) if x % 1000 == 0]]

    parameter_space = {
        "approach": approaches,
        "nb_privileges": nb_privileges,
        "nb_privileges_to_add": nb_privileges_to_add,
        "seed": [0.5],
        "size": ["xlarge"],
        "depth_size": [50],
        "nb_min_object_paths": [10000],
        "iterations": [1]
    }

    variables = cartesian_product(parameter_space)

    #def is_below_privilege_ceiling(config):
    #    return config["nb_privileges"] + config["nb_privileges_to_add"] <= privilege_ceiling + 1

    #def is_redundant(config):
    #    return config["approach"] == "srdt-plain-security-policy" and config["nb_privileges"] > 1

    def is_good(config):
        return True
        # return is_below_privilege_ceiling(config)

    campaign = CampaignIterateVariables(
        name="ADD-bench_migration_size_vs_initial_privileges",
        benchmark=BenchShardAdd(),
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
    parser.add_argument("--privileges_to_add", help="A list of nb. of privileges to add (separate via spaces).", type=int, nargs="+")

    args = parser.parse_args()

    results_dir = Path(args.results_dir) if args.results_dir else None
    tmp_dir = Path(args.tmp_dir) if args.tmp_dir else None
    bench_migration_size_vs_initial_privileges(results_dir=results_dir, tmp_dir=tmp_dir, approaches= args.approaches, nb_privileges_to_add=args.privileges_to_add)
