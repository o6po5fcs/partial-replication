import matplotlib.pyplot as plt
from pathlib import Path
import pandas as pd
import numpy as np
import seaborn as sns
import importlib
import src.graphs.csvs_to_df as csvs_to_df_module
importlib.reload(csvs_to_df_module)
from src.graphs.csvs_to_df import csv_to_df
from src.graphs.save_and_show_figure import save_and_show_figure
from src.graphs.set_common_plot_style import set_common_plot_style
from matplotlib.ticker import FuncFormatter

COL_ITERATION = "iteration"
COL_SERIES = "series"
ROW_SERIES_SRDT = "srdt-plain-security-policy"
ROW_SERIES_POLTREE = "poltree-security-policy"
COL_NB_PRIVILEGES = "nb_privileges"
COL_THROUGHPUT_ALLOWED_PER_NS = "throughput_allowed_per_ns"
COL_THROUGHPUT_DISALLOWED_PER_NS = "throughput_disallowed_per_ns"
COL_THROUGHPUT_ALLOWED_PER_MS = "throughput_allowed_per_ms"
COL_THROUGHPUT_DISALLOWED_PER_MS = "throughput_disallowed_per_ms"
COL_THROUGHPUT_ALLOWED_PER_S = "throughput_allowed_per_s"
COL_THROUGHPUT_DISALLOWED_PER_S = "throughput_disallowed_per_s"
COL_NB_ALLOWED_PATHS = "nb_allowed_paths"
COL_NB_DISALLOWED_PATHS = "nb_disallowed_paths"
COL_NB_CHECKS_PERFORMED = "nb_checks_performed"
COL_TIME_ALLOWED_NS = "time_allowed"
COL_TIME_DISALLOWED_NS = "time_disallowed" 
COL_SPEEDUP = "speedup"
COL_SOURCE_CSV = "source_csv"


CHECK_TYPE_KEY = "Access check type"
APPROACH_PRETTY_NAME = "Approach"
POLTREE_VAL = "PolTree"
SRDT_VAL = "SRDT"

X_LABEL_SHARD_QUERY_SIZE = "Shard query size (# privileges)"
Y_LABEL_THROUGHPUT_CHECKS_PER_MS = "Throughput (checks per millisecond)"
Y_LABEL_SPEEDUP = "Speedup (PolTree / SRDT)"

set_common_plot_style()


def format_decimal_tick(value, _pos):
    # Up to 2 decimals, trailing zeros stripped (0.01, 0.5, 1, 10)
    return f"{value:.2f}".rstrip("0").rstrip(".")


def render_throughput_allowed_checks(df, output_dir: Path, cutoff_nb_privileges=None):
    if cutoff_nb_privileges is not None:
        df = df.loc[df[COL_NB_PRIVILEGES] <= cutoff_nb_privileges]

    df = df.assign(**{COL_SERIES: df[COL_SERIES].map({ ROW_SERIES_SRDT: SRDT_VAL, ROW_SERIES_POLTREE: POLTREE_VAL })})
    df = df.rename(columns={COL_SERIES: APPROACH_PRETTY_NAME})

    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()

    chart = sns.lineplot(
        data=df,
        ax=chart,
        x=COL_NB_PRIVILEGES,
        y=COL_THROUGHPUT_ALLOWED_PER_MS,
        hue=APPROACH_PRETTY_NAME,
        style=APPROACH_PRETTY_NAME,
        errorbar=("sd", 1),
        markers=True,
    )

    chart.set_xlabel(X_LABEL_SHARD_QUERY_SIZE)
    chart.set_ylabel(Y_LABEL_THROUGHPUT_CHECKS_PER_MS)
    chart.set_yscale("log")
    chart.yaxis.set_major_formatter(FuncFormatter(format_decimal_tick))

    fig.tight_layout()

    save_and_show_figure(fig, output_dir, "bench_access_checks_throughput_allowed")


def render_throughput_disallowed_checks(df, output_dir: Path, cutoff_nb_privileges=None):
    if cutoff_nb_privileges is not None:
        df = df.loc[df[COL_NB_PRIVILEGES] < cutoff_nb_privileges]

    df = df.assign(**{COL_SERIES: df[COL_SERIES].map({ ROW_SERIES_SRDT: SRDT_VAL, ROW_SERIES_POLTREE: POLTREE_VAL })})
    df = df.rename(columns={COL_SERIES: APPROACH_PRETTY_NAME})

    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()

    chart = sns.lineplot(
        data=df,
        ax=chart,
        x=COL_NB_PRIVILEGES,
        y=COL_THROUGHPUT_DISALLOWED_PER_MS,
        hue=APPROACH_PRETTY_NAME,
        style=APPROACH_PRETTY_NAME,
        errorbar=("sd", 1),
        markers=True,
    )
    
    chart.set_xlabel(X_LABEL_SHARD_QUERY_SIZE)
    chart.set_ylabel(Y_LABEL_THROUGHPUT_CHECKS_PER_MS)
    chart.set_yscale("log")
    chart.yaxis.set_major_formatter(FuncFormatter(format_decimal_tick))
    fig.tight_layout()

    save_and_show_figure(fig, output_dir, "bench_access_checks_throughput_disallowed")


def render_speedup(df, output_dir: Path, cutoff_nb_privileges=None):
    from matplotlib.ticker import LogLocator, ScalarFormatter

    throughput_cols = [COL_THROUGHPUT_ALLOWED_PER_MS, COL_THROUGHPUT_DISALLOWED_PER_MS]
    if cutoff_nb_privileges is not None:
        df = df.loc[df[COL_NB_PRIVILEGES] <= cutoff_nb_privileges]

    join_keys = [COL_SOURCE_CSV, COL_NB_PRIVILEGES, COL_ITERATION]

    srdt = df[df[COL_SERIES] == ROW_SERIES_SRDT][join_keys + throughput_cols]
    poltree = df[df[COL_SERIES] == ROW_SERIES_POLTREE][join_keys + throughput_cols]
    paired = poltree.merge(srdt, on=join_keys, suffixes=("_poltree", "_srdt"))

    speedup_df = pd.concat([
        pd.DataFrame({
            COL_NB_PRIVILEGES: paired[COL_NB_PRIVILEGES],
            CHECK_TYPE_KEY: "Allowed checks",
            COL_SPEEDUP: paired[COL_THROUGHPUT_ALLOWED_PER_MS + "_poltree"] / paired[COL_THROUGHPUT_ALLOWED_PER_MS + "_srdt"],
        }),
        pd.DataFrame({
            COL_NB_PRIVILEGES: paired[COL_NB_PRIVILEGES],
            CHECK_TYPE_KEY: "Disallowed checks",
            COL_SPEEDUP: paired[COL_THROUGHPUT_DISALLOWED_PER_MS + "_poltree"] / paired[COL_THROUGHPUT_DISALLOWED_PER_MS + "_srdt"],
        }),
    ], ignore_index=True)

    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()

    chart = sns.lineplot(
        data=speedup_df,
        ax=chart,
        x=COL_NB_PRIVILEGES,
        y=COL_SPEEDUP,
        hue=CHECK_TYPE_KEY,
        style=CHECK_TYPE_KEY,
        errorbar="sd",
        markers=True,
    )

    chart.set_xlabel(X_LABEL_SHARD_QUERY_SIZE)
    chart.set_ylabel(Y_LABEL_SPEEDUP)
    chart.ticklabel_format(axis="y", style="plain")
    #chart.set_yscale("log")
    fig.tight_layout()

    
    save_and_show_figure(fig, output_dir, "bench_access_checks_speedup")


def render_access_check_graphs(csv_file_path, nb_iterations_to_ignore):

    df = csv_to_df(Path(csv_file_path))
    df[COL_SOURCE_CSV] = Path(csv_file_path).name
    df[COL_THROUGHPUT_ALLOWED_PER_NS] = df[COL_NB_CHECKS_PERFORMED] / df[COL_TIME_ALLOWED_NS]
    df[COL_THROUGHPUT_DISALLOWED_PER_NS] = df[COL_NB_CHECKS_PERFORMED] / df[COL_TIME_DISALLOWED_NS]
    df[COL_THROUGHPUT_ALLOWED_PER_MS] = df[COL_NB_CHECKS_PERFORMED] / (df[COL_TIME_ALLOWED_NS] / 1000000)
    df[COL_THROUGHPUT_DISALLOWED_PER_MS] = df[COL_NB_CHECKS_PERFORMED] / (df[COL_TIME_DISALLOWED_NS] / 1000000)

    df_without_warmup_runs = df.loc[df[COL_ITERATION] >= nb_iterations_to_ignore].copy()

    pdf_output_dir = Path(csv_file_path).parent / "pdf_figures"

    render_throughput_allowed_checks(df_without_warmup_runs, pdf_output_dir, cutoff_nb_privileges=None)
    render_throughput_disallowed_checks(df_without_warmup_runs, pdf_output_dir, cutoff_nb_privileges=None)
    render_speedup(df_without_warmup_runs, pdf_output_dir, cutoff_nb_privileges=None)
