from pathlib import Path
import pandas as pd

def csv_to_df(filepath: Path):
    return pd.read_csv(filepath, sep=";", comment="#", engine="python")