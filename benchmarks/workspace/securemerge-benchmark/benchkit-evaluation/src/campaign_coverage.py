from benchkit import CampaignCartesianProduct
from src.bench.BenchSecurityPolicyCoverage import BenchSecurityPolicyCoverage
import random

def main() -> None:
    # Define the parameter space to explore

    nb_runs = 1
    parameter_space = {
        "nb_privileges": list(range(1, 1000)),
        "size": ["large"],
        "depth_size": [25],
        "nb_min_object_paths": [5000],
        "seed": [random.random() for s in range(nb_runs)],
    }


    # Create a campaign that runs all combinations
    campaign = CampaignCartesianProduct(
        name="naive-vs-poltree-access-checks",
        benchmark=BenchSecurityPolicyCoverage(),
        variables=parameter_space,
        nb_runs=nb_runs,
    )

    # Execute the campaign
    campaign.run()

    campaign.generate_graph(
        plot_name="scatterplot",
        x="nb_privileges",
        y="coverage_percent",
        title="Number of privileges vs. coverage",
    )

    campaign.generate_graph(
        plot_name="scatterplot",
        x="nb_privileges",
        y="nb_paths_covered",
        title="Number of privileges vs. number of paths covered",
    )



if __name__ == "__main__":
    main()