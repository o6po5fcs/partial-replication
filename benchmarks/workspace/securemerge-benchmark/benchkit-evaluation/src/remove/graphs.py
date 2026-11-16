import matplotlib.pyplot as plt
import matplotlib.ticker
from matplotlib.ticker import FuncFormatter
from pathlib import Path
import pandas as pd
import seaborn as sns
import numpy as np

from src.graphs.csv_to_df import csv_to_df
from src.graphs.set_common_plot_style import set_common_plot_style
from src.graphs.save_and_show_figure import save_and_show_figure

set_common_plot_style()

COL_APPROACH = "approach"
ROW_APPROACH_SRDT = "srdt-plain-security-policy"
ROW_APPROACH_POLTREE = "poltree-security-policy"
ROW_APPROACH_BLAZEDIFF = "srdt-plain-security-policy-with-diff"
COL_INITIAL_NB_PRIVILEGES = "initial_number_of_privileges"
COL_NB_PRIVILEGES_REMOVED = "removed_number_of_privileges"
COL_NB_MIGRATIONS_PER_S = "nb_migrations_per_s"
COL_NB_PRIVILEGES = "number_of_privileges"
COL_NB_PROJECTIONS_PER_S = "nb_projections_per_s"

CHECK_TYPE_KEY = "Access check type"
approach_pretty_name = "Approach"
initial_nb_privileges_pretty_name = "Initial shard query size"
poltree_pretty_key = "PolTree"
srdt_pretty_key = "SRDT"
srdt_with_diff_pretty_key = "SRDT + BlazeDiff"

y_label_throughput_projections_pretty = "Throughput (projections per second)"
y_label_throughput_migrations_pretty = "Throughput (migrations per second)"
x_label_shard_query_size_pretty = "Shard query size (# privileges)"





COL_MEASURED_MIGRATION_SIZE = "measured_migration_size"
COL_MEASURED_MIGRATION_SIZE_NON_GZIP = "measured_migration_size_non_gzip"
COL_MEASURED_MIGRATION_SIZE_KB = "measured_migration_size_kb"
COL_MEASURED_MIGRATION_SIZE_KB_NON_GZIP = "measured_migration_size_kb_non_gzip"
COL_ADDED_NB_PRIVILEGES = "added_number_of_privileges"
COL_REMOVED_NB_PRIVILEGES = "removed_number_of_privileges"
COL_ITERATION = "iteration"
COL_BYTES_ADVANTAGE = "bytes_advantage"
COL_BYTES_ADVANTAGE_NON_GZIP = "bytes_advantage_non_gzip"
COL_KBYTES_ADVANTAGE = "kbytes_advantage"
COL_KBYTES_ADVANTAGE_NON_GZIP = "kbytes_advantage_non_gzip"
COL_COMPRESSION_RATIO = "compression_ratio_percent"
COL_COMPRESSION_RATIO_NON_GZIP = "compression_ratio_non_gzip_percent"

X_LABEL_SHARD_QUERY_SIZE = "Shard query size (# privileges)"
X_LABEL_DECREASE_SHARD_QUERY_SIZE = "Shard query size decrease (# privileges removed)"
Y_LABEL_BYTES_ADVANTAGE = "Migration size difference (bytes, gzip)"
Y_LABEL_KBYTES_ADVANTAGE = "Migration size comparison (gzip)"
Y_LABEL_BYTES_ADVANTAGE_NON_GZIPPED = "Bytes advantage vs SRDT (non-gzipped)"
Y_LABEL_MIGRATION_SIZE_KB_GZIP = "Migration size (gzip)"

poltree_pretty_name = "PolTree"
srdt_pretty_name = "SRDT"
blazediff_pretty_name = "SRDT + BlazeDiff"




def render_migration_throughput(df, output_dir: Path):
    blazediff_rows = df[df[COL_APPROACH] == ROW_APPROACH_BLAZEDIFF]
    poltree_rows = df[df[COL_APPROACH] == ROW_APPROACH_POLTREE]

    srdt_df = pd.DataFrame({
        COL_APPROACH: ROW_APPROACH_SRDT,
        COL_NB_PRIVILEGES: blazediff_rows[COL_NB_PRIVILEGES],
        COL_NB_MIGRATIONS_PER_S: blazediff_rows[COL_NB_PROJECTIONS_PER_S],
        COL_INITIAL_NB_PRIVILEGES: blazediff_rows[COL_INITIAL_NB_PRIVILEGES]
    })
    poltree_df = poltree_rows[[COL_APPROACH, COL_NB_PRIVILEGES, COL_NB_MIGRATIONS_PER_S, COL_INITIAL_NB_PRIVILEGES]]
    plot_df = pd.concat([srdt_df, poltree_df], ignore_index=True)

    plot_df = plot_df.replace({COL_APPROACH: {ROW_APPROACH_POLTREE: poltree_pretty_key,
                                              ROW_APPROACH_SRDT: srdt_pretty_key}})
    plot_df = plot_df.rename(columns={COL_APPROACH: approach_pretty_name,
                                      COL_INITIAL_NB_PRIVILEGES: initial_nb_privileges_pretty_name})

    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()
    chart = sns.lineplot(
        data=plot_df,
        x=COL_NB_PRIVILEGES,
        y=COL_NB_MIGRATIONS_PER_S,
        hue=approach_pretty_name,
        style=initial_nb_privileges_pretty_name,
        style_order=sorted(plot_df[initial_nb_privileges_pretty_name].unique(), reverse=True),
        errorbar=("sd", 1),
        markers=True,
    )
    legend_handles, legend_labels = chart.get_legend_handles_labels()
    if srdt_pretty_key in legend_labels:
        srdt_color = legend_handles[legend_labels.index(srdt_pretty_key)].get_color()
        for line in chart.lines:
            if line.get_color() == srdt_color:
                line.set_linewidth(4)
    chart.set_yscale("log")
    y_formatter = FuncFormatter(lambda value, _: str(value) if value > 0 else f"{value:.3f}")
    chart.yaxis.set_major_formatter(y_formatter)
    chart.invert_xaxis()

    chart.set_xlabel(x_label_shard_query_size_pretty)
    chart.set_ylabel(y_label_throughput_migrations_pretty)

    sns.move_legend(chart, "upper right", bbox_to_anchor=(0.98, 0.98), borderaxespad=0.4)
    legend = chart.get_legend()
    if legend is not None:
        for label, handle in zip(legend.get_texts(), legend.get_lines()):
            if label.get_text() == srdt_pretty_key:
                handle.set_linewidth(4)
    save_and_show_figure(fig, output_dir, "bench_migration_speed_remove_throughput")


def render_migration_speed_graphs(csv_file_path, nb_iterations_to_ignore):
    df = csv_to_df(Path(csv_file_path))
    pdf_output_dir = Path(csv_file_path).parent / "pdf_figures"
    df_without_warmup = df[df.iterations >= nb_iterations_to_ignore]

    render_migration_throughput(df_without_warmup, pdf_output_dir)

    configs = df[[COL_INITIAL_NB_PRIVILEGES, COL_NB_PRIVILEGES_REMOVED]].drop_duplicates()
    print(f"Number of benchmark configurations: {len(configs)}")
    print(f"  distinct {COL_INITIAL_NB_PRIVILEGES}: {configs[COL_INITIAL_NB_PRIVILEGES].nunique()}")
    print(f"  distinct {COL_NB_PRIVILEGES_REMOVED}: {configs[COL_NB_PRIVILEGES_REMOVED].nunique()}")

    # Per initial value: which removed values are absent
    print(configs.groupby(COL_INITIAL_NB_PRIVILEGES)[COL_NB_PRIVILEGES_REMOVED].nunique())







def initial_privileges_legend_kwargs(df):
    # A categorical dtype used for both hue and style makes seaborn pair legend entries with the wrong lines,
    # so keep the column numeric and fix the order and colors explicitly.
    levels = sorted(df[initial_nb_privileges_pretty_name].unique())
    return dict(
        hue_order=levels,
        style_order=levels,
        palette=sns.color_palette(n_colors=len(levels)),
    )


def build_migration_size_advantage_df(df):
    join_columns = [
        COL_INITIAL_NB_PRIVILEGES,
        COL_REMOVED_NB_PRIVILEGES,
        COL_ITERATION
    ]

    COL_SRDT_MEASURED_MIGRATION_SIZE = "srdt_measured_migration_size"
    COL_SRDT_MEASURED_MIGRATION_SIZE_NON_GZIP = "srdt_measured_migration_size_non_gzip"

    srdt_baseline = df.loc[df[COL_APPROACH] == ROW_APPROACH_SRDT, join_columns + [COL_MEASURED_MIGRATION_SIZE, COL_MEASURED_MIGRATION_SIZE_NON_GZIP]].rename(
        columns={COL_MEASURED_MIGRATION_SIZE: COL_SRDT_MEASURED_MIGRATION_SIZE,
                 COL_MEASURED_MIGRATION_SIZE_NON_GZIP: COL_SRDT_MEASURED_MIGRATION_SIZE_NON_GZIP})

    advantage_df = df.loc[df[COL_APPROACH] == ROW_APPROACH_POLTREE].copy()
    advantage_df = advantage_df.merge(srdt_baseline, on=join_columns, how="left")

    advantage_df[COL_BYTES_ADVANTAGE] = advantage_df[COL_SRDT_MEASURED_MIGRATION_SIZE] - advantage_df[COL_MEASURED_MIGRATION_SIZE]
    advantage_df[COL_BYTES_ADVANTAGE_NON_GZIP] = advantage_df[COL_SRDT_MEASURED_MIGRATION_SIZE_NON_GZIP] - advantage_df[COL_MEASURED_MIGRATION_SIZE_NON_GZIP]

    advantage_df[COL_KBYTES_ADVANTAGE] = advantage_df[COL_BYTES_ADVANTAGE] / 1000
    advantage_df[COL_KBYTES_ADVANTAGE_NON_GZIP] = advantage_df[COL_BYTES_ADVANTAGE_NON_GZIP] / 1000

    srdt_gzip = advantage_df[COL_SRDT_MEASURED_MIGRATION_SIZE]
    srdt_non_gzip = advantage_df[COL_SRDT_MEASURED_MIGRATION_SIZE_NON_GZIP]

    # Positive values mean PolTree is smaller than SRDT; negative values mean it is larger.
    advantage_df[COL_COMPRESSION_RATIO] = (advantage_df[COL_BYTES_ADVANTAGE] / srdt_gzip.where(srdt_gzip != 0)) * 100
    advantage_df[COL_COMPRESSION_RATIO_NON_GZIP] = (advantage_df[COL_BYTES_ADVANTAGE_NON_GZIP] / srdt_non_gzip.where(srdt_non_gzip != 0)) * 100

    advantage_df[COL_APPROACH] = advantage_df[COL_APPROACH].astype("category")

    return advantage_df


def render_migration_size_blazediff(df, output_dir: Path):
    df_filtered = df.loc[df[COL_INITIAL_NB_PRIVILEGES] == 8000].copy()
    df_filtered[COL_APPROACH] = df_filtered[COL_APPROACH].map(
        {
            ROW_APPROACH_SRDT: srdt_pretty_name,
            ROW_APPROACH_POLTREE: poltree_pretty_name,
            ROW_APPROACH_BLAZEDIFF: blazediff_pretty_name,
        }
    )
    df_filtered = df_filtered.rename(columns={COL_APPROACH: approach_pretty_name})

    approach_order = [srdt_pretty_name, poltree_pretty_name, blazediff_pretty_name]
    approach_markers = {srdt_pretty_name: "o", poltree_pretty_name: "X", blazediff_pretty_name: "s"}
    approach_dashes = {srdt_pretty_name: "", poltree_pretty_name: (4, 1.5), blazediff_pretty_name: (1, 1)}

    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()
    chart = sns.lineplot(
        data=df_filtered,
        x=COL_REMOVED_NB_PRIVILEGES,
        y=COL_MEASURED_MIGRATION_SIZE_KB,
        hue=approach_pretty_name,
        hue_order=approach_order,
        style=approach_pretty_name,
        style_order=approach_order,
        markers=approach_markers,
        dashes=approach_dashes,
        errorbar=("sd", 1),
    )
    chart.set_xlabel(X_LABEL_DECREASE_SHARD_QUERY_SIZE)
    chart.set_ylabel("Migration size (gzip)")
    chart.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda value, _: f"{value:g} KB"))
    fig.tight_layout()

    save_and_show_figure(fig, output_dir, "bench_migration_size_remove_blazediff")


def render_migration_size(df, output_dir: Path):
    df_filtered = df.loc[df[COL_APPROACH] != ROW_APPROACH_BLAZEDIFF].copy()
    df_filtered[COL_INITIAL_NB_PRIVILEGES] = df_filtered[COL_INITIAL_NB_PRIVILEGES].astype("category")

    df_filtered[COL_APPROACH] = df_filtered[COL_APPROACH].map(
        {
            ROW_APPROACH_POLTREE: poltree_pretty_name,
            ROW_APPROACH_SRDT: srdt_pretty_name,
        }
    )
    df_filtered = df_filtered.rename(columns={
        COL_APPROACH: approach_pretty_name,
        COL_INITIAL_NB_PRIVILEGES: initial_nb_privileges_pretty_name
        })
    
    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()
    chart = sns.lineplot(
        data=df_filtered,
        x=COL_NB_PRIVILEGES,
        y=COL_MEASURED_MIGRATION_SIZE_KB,
        hue=approach_pretty_name,
        style=initial_nb_privileges_pretty_name,
        size=approach_pretty_name,
        sizes={srdt_pretty_name: 4.0, poltree_pretty_name: 1.5}, 
        errorbar="sd",
        markers=True,
    )
    chart.set_xlabel(X_LABEL_SHARD_QUERY_SIZE)
    chart.set_ylabel(Y_LABEL_MIGRATION_SIZE_KB_GZIP)
    fig.tight_layout()
    chart.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda value, _: f"{value:g} KB"))
    chart.xaxis.set_inverted(True)
    save_and_show_figure(fig, output_dir, "bench_migration_size_remove_gzip")

def render_migration_size_advantage_gzipped(df, output_dir: Path):
    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()
    chart = sns.lineplot(
        data=df,
        x=COL_REMOVED_NB_PRIVILEGES,
        y=COL_KBYTES_ADVANTAGE,
        hue=initial_nb_privileges_pretty_name,
        style=initial_nb_privileges_pretty_name,
        errorbar=("sd", 1),
        markers=True,
        **initial_privileges_legend_kwargs(df),
    )
    chart.axhline(y=0, color="black", linewidth=1, alpha=0.9)
    y_min, y_max = chart.get_ylim()
    y_min, y_max = min(y_min, 0), max(y_max, 0)
    chart.set_ylim(y_min, y_max)
    # Labels in the right margin, centered on the positive and negative regions (axes fraction, since the scale is non-linear)
    zero_frac = chart.transAxes.inverted().transform(chart.transData.transform((0, 0)))[1]
    label_kwargs = dict(xycoords="axes fraction", textcoords="offset points", xytext=(2, 0), fontsize=11, color="dimgray", rotation=90, ha="left", va="center", annotation_clip=False)
    chart.annotate("Advantage", (1, (zero_frac + 1) / 2), **label_kwargs)
    chart.annotate("Disadvantage", (1, zero_frac / 2), **label_kwargs)
    #chart.set_title("Migration size advantage")
    chart.set_xlabel(X_LABEL_DECREASE_SHARD_QUERY_SIZE)
    chart.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda value, _: f"{value:g} KB"))
    chart.set_ylabel(Y_LABEL_KBYTES_ADVANTAGE)
    fig.tight_layout()

    save_and_show_figure(fig, output_dir, "bench_migration_size_remove_advantage_gzipped")


def render_migration_size_gzipped_ratio(df, output_dir: Path, y_lower: float = -100):
    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()
    chart = sns.lineplot(
        data=df,
        x=COL_REMOVED_NB_PRIVILEGES,
        y=COL_COMPRESSION_RATIO,
        hue=initial_nb_privileges_pretty_name,
        style=initial_nb_privileges_pretty_name,
        errorbar="sd",
        markers=True,
        **initial_privileges_legend_kwargs(df),
    )
    chart.axhline(y=0, color="black", linewidth=1, alpha=0.9)
    # The ratio is capped at 100%, so the top is fixed. The bottom is the smallest raw value; autoscaled limits are not used because
    # the sd band around heavily skewed means can extend far beyond the data and would stretch the axis.
    # Pad the lower limit so the lowest markers are not cut in half by the axes frame
    y_min, y_max = min(df[COL_COMPRESSION_RATIO].min(), 0) * 1.2, 105
    # Linear down to -t, logarithmic below it. k is chosen so the log section is as deep below 0 as y_max is above it,
    # which keeps the full data range visible while extreme negative values cannot squash everything else.
    t = 25
    k = (y_max - t) / (t * np.log(-y_min / t)) if -y_min > t else 1
    forward = lambda y: np.maximum(y, -t) - k * t * np.log(np.maximum(-y, t) / t)
    inverse = lambda x: np.maximum(x, -t) + t * (1 - np.exp(-(np.minimum(x, -t) + t) / (k * t)))
    chart.set_yscale("function", functions=(forward, inverse))
    chart.set_ylim(y_min, y_max)
    # One tick per decade below -t: the log section is short, so denser ticks overlap
    log_ticks = [-10 ** e for e in range(2, 8) if t < 10 ** e]
    ticks = [v for v in [-t] + log_ticks + [0, 25, 50, 75, 100] if y_min <= v <= y_max]
    chart.yaxis.set_major_locator(matplotlib.ticker.FixedLocator(ticks))
    chart.yaxis.set_major_formatter(matplotlib.ticker.FuncFormatter(lambda value, _: f"{value:,.0f}%"))
    # Labels in the right margin, centered on the positive and negative regions (axes fraction, since the scale is non-linear)
    #zero_frac = chart.transAxes.inverted().transform(chart.transData.transform((0, 0)))[1]
    #label_kwargs = dict(xycoords="axes fraction", textcoords="offset points", xytext=(2, 0), fontsize=11, color="dimgray", rotation=90, ha="left", va="center", annotation_clip=False)
    #chart.annotate("Advantage", (1, (zero_frac + 1) / 2), **label_kwargs)
    #chart.annotate("Disadvantage", (1, zero_frac / 2), **label_kwargs)
    
    #chart.set_title("Migration compression ratio")
    chart.set_xlabel(X_LABEL_DECREASE_SHARD_QUERY_SIZE)
    chart.set_ylabel("Compression ratio over SRDT (%)")
    fig.tight_layout()

    save_and_show_figure(fig, output_dir, "bench_migration_size_remove_gzipped_ratio_percent")


def render_migration_size_non_gzipped(df, output_dir: Path):
    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()
    chart = sns.lineplot(
        data=df,
        x=COL_REMOVED_NB_PRIVILEGES,
        y="bytes_advantage_non_gzip",
        hue=initial_nb_privileges_pretty_name,
        style=initial_nb_privileges_pretty_name,
        errorbar="sd",
        markers=True,
        **initial_privileges_legend_kwargs(df),
    )
    chart.axhline(y=0, color="black", linewidth=1, alpha=0.9)
    y_min, y_max = chart.get_ylim()
    y_min, y_max = min(y_min, 0), max(y_max, 0)
    chart.set_ylim(y_min, y_max)
    label_kwargs = dict(xycoords=chart.get_yaxis_transform(), textcoords="offset points", ha="left", fontsize=12)
    #chart.annotate("Advantage", (0.02, 0), xytext=(0, 6), va="bottom", **label_kwargs)
    #chart.annotate("Disadvantage", (0.02, 0), xytext=(0, -6), va="top", **label_kwargs)
    #chart.set_title("Migration size advantage")
    chart.set_xlabel(X_LABEL_DECREASE_SHARD_QUERY_SIZE)
    chart.set_ylabel(Y_LABEL_BYTES_ADVANTAGE_NON_GZIPPED)
    fig.tight_layout()

    save_and_show_figure(fig, output_dir, "bench_migration_size_remove_non_gzipped")


def print_compression_ratio_stats(df, benchmark_name):
    ratios = (df[COL_MEASURED_MIGRATION_SIZE] / df[COL_MEASURED_MIGRATION_SIZE_NON_GZIP].where(df[COL_MEASURED_MIGRATION_SIZE_NON_GZIP] != 0)) * 100
    stats_df = df.assign(compression_ratio_percent=ratios).dropna(subset=[COL_COMPRESSION_RATIO])
    print(
        "The ratio is the compressed size as a percentage of the original "
        "non-gzipped size; e.g. 44% means the compressed data is 44% of "
        "the original (56% smaller)."
    )
    print(f"Compression ratio stats compared to {benchmark_name}:")
    print(stats_df[COL_COMPRESSION_RATIO].describe().to_string())
    print("\nBy initial privilege count:")
    print(
        stats_df.groupby(initial_nb_privileges_pretty_name, observed=True)[
            COL_COMPRESSION_RATIO
        ].describe().to_string()
    )


def render_migration_size_srdt_only(df, output_dir: Path):
    df = df.copy()
    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()
    chart = sns.lineplot(
        data=df,
        x=COL_REMOVED_NB_PRIVILEGES,
        y=COL_MEASURED_MIGRATION_SIZE_KB,
        hue=initial_nb_privileges_pretty_name,
        style=initial_nb_privileges_pretty_name,
        errorbar="sd",
        markers=True,
        **initial_privileges_legend_kwargs(df),
    )
    #chart.set_title("Shrinking shard query vs. shard size")
    chart.set_xlabel(X_LABEL_DECREASE_SHARD_QUERY_SIZE)
    chart.set_ylabel("Shard size (KB, gzipped)")
    fig.tight_layout()

    save_and_show_figure(fig, output_dir, "bench_migration_size_remove_srdt_only")


def render_migration_size_graphs(csv_file_path):
    df = csv_to_df(Path(csv_file_path))
    pdf_output_dir = Path(csv_file_path).parent / "pdf_figures"
    df[COL_MEASURED_MIGRATION_SIZE_KB] = df[COL_MEASURED_MIGRATION_SIZE] / 1000
    df[COL_MEASURED_MIGRATION_SIZE_KB_NON_GZIP] = df[COL_MEASURED_MIGRATION_SIZE_NON_GZIP] / 1000


    df_advantage = build_migration_size_advantage_df(df)
    df_advantage_filtered = df_advantage[(df_advantage[COL_INITIAL_NB_PRIVILEGES] != 0)].copy()
    df_advantage_filtered[COL_REMOVED_NB_PRIVILEGES] = df_advantage_filtered[COL_REMOVED_NB_PRIVILEGES]
    df_advantage_graph = df_advantage_filtered.rename(
        columns={COL_INITIAL_NB_PRIVILEGES: initial_nb_privileges_pretty_name}
    )

    print_compression_ratio_stats(
        df_advantage_graph,
        "bench_migration_size_remove_non_gzipped",
    )
    render_migration_size_blazediff(df, pdf_output_dir)
    render_migration_size(df, pdf_output_dir)
    #render_migration_size_advantage_gzipped(df_advantage_graph, pdf_output_dir)
    render_migration_size_gzipped_ratio(df_advantage_graph, pdf_output_dir)
    #render_migration_size_non_gzipped(df_advantage_graph, pdf_output_dir)


    #df_srdt_only = df.loc[df[COL_APPROACH] == ROW_APPROACH_SRDT]
    #df_srdt_only_filtered = df_srdt_only[(df_srdt_only[COL_INITIAL_NB_PRIVILEGES] != 0)].copy()
    #df_srdt_only_graph = df_srdt_only_filtered.rename(columns={COL_INITIAL_NB_PRIVILEGES: initial_nb_privileges_pretty_name})
    #df_srdt_only_graph[COL_REMOVED_NB_PRIVILEGES] = df_srdt_only_graph[COL_REMOVED_NB_PRIVILEGES]
    #render_migration_size_srdt_only(df_srdt_only_graph, pdf_output_dir)

    """
    df_debug = csv_to_df(Path(csv_file_path))
    approach_order = [ROW_APPROACH_SRDT, ROW_APPROACH_POLTREE, ROW_APPROACH_BLAZEDIFF]
    df_debug[COL_APPROACH] = pd.Categorical(df_debug[COL_APPROACH], categories=approach_order, ordered=True)
    approach_markers = {ROW_APPROACH_SRDT: "o", ROW_APPROACH_POLTREE: "X", ROW_APPROACH_BLAZEDIFF: "s"}
    approach_dashes = {ROW_APPROACH_SRDT: "", ROW_APPROACH_POLTREE: (4, 1.5), ROW_APPROACH_BLAZEDIFF: (1, 1.5)}
    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()
    chart = sns.lineplot(
            data=df_debug,
            x=COL_NB_PRIVILEGES,
            y=COL_MEASURED_MIGRATION_SIZE_NON_GZIP,
            hue=COL_APPROACH,
            hue_order=approach_order,
            style=COL_APPROACH,
            style_order=approach_order,
            markers=approach_markers,
            dashes=approach_dashes,
            errorbar="sd",
    )
    sns.move_legend(chart, "upper left", bbox_to_anchor=(1, 1))
    chart.invert_xaxis()

    fig = plt.figure(dpi=150)
    chart = fig.add_subplot()
    chart = sns.lineplot(
            data=df_debug,
            x=COL_NB_PRIVILEGES,
            y=COL_MEASURED_MIGRATION_SIZE,
            hue=COL_APPROACH,
            hue_order=approach_order,
            style=COL_APPROACH,
            style_order=approach_order,
            markers=approach_markers,
            dashes=approach_dashes,
            errorbar="sd",
    )
    sns.move_legend(chart, "upper left", bbox_to_anchor=(1, 1))
    chart.invert_xaxis()
    """