#!/bin/bash

#SBATCH --job-name=prepare_python_venv_zen4
#SBATCH --mail-type=FAIL
#SBATCH --partition=zen4
#SBATCH --ntasks=1
#SBATCH --mem-per-cpu=4G
#SBATCH --output=slurm-%j.out
#SBATCH --error=slurm-%j.err

# Wall clock limit:
# d-hh:mm:ss (days, hours, minutes and seconds) format. The - is not a typo!
#SBATCH --time=00:15:00

set -euo pipefail

# Install modules provided by Hydra.
# Some packages are part of bundles: numpy/2.3.1, pandas/2.3.3, matplotlib/3.10.3
# use "module spider <package-name>" to find out which bundle a package is part of
module load TorchGeo/0.9.0-foss-2025a Python/3.13.1-GCCcore-14.2.0 SciPy-bundle/2025.06-gfbf-2025a matplotlib/3.10.3-gfbf-2025a Seaborn/0.13.2-gfbf-2025a nodejs/24.12.0-GCCcore-14.2.0

PREPARED_ROOT="${PREPARED_ROOT:-${VSC_SCRATCH}/securemerge-prepared}"
PROJECT_DIR="${PREPARED_ROOT}/project"
PYTHON_VENV_ROOT="${PREPARED_ROOT}/venvs"
PYTHON_VENV="${PYTHON_VENV_ROOT}/${SLURM_JOB_PARTITION}"
STAGING_VENV="${PYTHON_VENV}.job-${SLURM_JOB_ID}"

if [[ ! -d "${PROJECT_DIR}" ]]; then
    echo "Prepared project missing. Expected ${PROJECT_DIR}" >&2
    exit 1
fi

rm -rf "${STAGING_VENV}"
mkdir -p "${PYTHON_VENV_ROOT}"

python -m venv "${STAGING_VENV}" --system-site-packages
source "${STAGING_VENV}/bin/activate"
python -m pip install pip --upgrade
python -m pip install -e "${PROJECT_DIR}/securemerge-benchmark/benchkit-evaluation/" --no-cache-dir
deactivate

rm -rf "${PYTHON_VENV}"
mv "${STAGING_VENV}" "${PYTHON_VENV}"

echo "Prepared Python venv: ${PYTHON_VENV}"
