from pathlib import Path
import pandas as pd
from src.graphs.csv_to_df import csv_to_df

def csvs_to_df(directory: Path):
    csv_paths = sorted(directory.glob("*.csv"))
    if not csv_paths:
        return pd.DataFrame()
    return pd.concat(
        (csv_to_df(path).assign(source_csv=path.name) for path in csv_paths),
        ignore_index=True,
    )