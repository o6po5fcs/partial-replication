
import seaborn as sns

def set_common_plot_style(): 
    PLOT_STYLE = {
        "font.size": 14,              # base font
        "axes.titlesize": 16,         # subplot title
        "axes.labelsize": 14,         # x/y labels
        "xtick.labelsize": 13,
        "ytick.labelsize": 13,
        "legend.fontsize": 13,
        "legend.title_fontsize": 13,
        "figure.titlesize": 16,
    }

    sns.set_theme(style="whitegrid", rc=PLOT_STYLE)