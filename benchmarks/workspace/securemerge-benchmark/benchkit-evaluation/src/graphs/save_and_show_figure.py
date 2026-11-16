import matplotlib.pyplot as plt
from pathlib import Path

def save_and_show_figure(fig, output_dir: Path, filename: str):
    output_dir.mkdir(parents=True, exist_ok=True)
    pdf_path = output_dir / f"{filename}.pdf"
    fig.savefig(pdf_path, format="pdf", bbox_inches="tight")
    plt.show()
    plt.close(fig)
    print(f"Saved PDF: {pdf_path.resolve()}")