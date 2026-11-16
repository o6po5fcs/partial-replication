#!/bin/bash

#SBATCH --job-name=bench_access_checks
#SBATCH --mail-type=FAIL
#SBATCH --array=1-10
#SBATCH --ntasks=11
#SBATCH --mem-per-cpu=2G
#SBATCH --output=slurm-%A_%a.out
#SBATCH --error=slurm-%A_%a.err
#SBATCH --partition=zen4

# Wall clock limit:
# d-hh:mm:ss (days, hours, minutes and seconds) format. The - is not a typo!
#SBATCH --time=1-00:00:00

set -euo pipefail

# Install modules provided by Hydra
# Some packages are part of bundles: numpy/2.3.1, pandas/2.3.3, matplotlib/3.10.3
# use "module spider <package-name>" to find out which bundle a package is part of
module load TorchGeo/0.9.0-foss-2025a Python/3.13.1-GCCcore-14.2.0 SciPy-bundle/2025.06-gfbf-2025a matplotlib/3.10.3-gfbf-2025a Seaborn/0.13.2-gfbf-2025a nodejs/24.12.0-GCCcore-14.2.0

# Input data directory in VSC_DATA
JOB_CONSOLE_OUTPUT_FILES_DIR="${VSC_SCRATCH}/securemerge/securemerge-benchmark"
PREPARED_ROOT="${PREPARED_ROOT:-${VSC_SCRATCH}/securemerge-prepared}"
PROJECT_DIR="${PREPARED_ROOT}/project"
WORKDIR="${VSC_SCRATCH}/tmp/${SLURM_JOB_NAME}_${SLURM_JOB_ID}"
PREPARED_VENV_ROOT="${PREPARED_ROOT}/venvs"
OUT_DIR="${VSC_SCRATCH}/benchkit/${SLURM_JOB_NAME}/${SLURM_ARRAY_JOB_ID}"

if [[ -n "${SLURM_JOB_PARTITION:-}" ]]; then
	PYTHON_VENV="${PREPARED_VENV_ROOT}/${SLURM_JOB_PARTITION}"
else
	echo "Could not determine which prepared Python venv to use." >&2
	exit 1
fi

if [[ ! -d "${PROJECT_DIR}" || ! -d "${PYTHON_VENV}" ]]; then
	echo "Prepared environment missing. Expected ${PROJECT_DIR} and ${PYTHON_VENV}" >&2
	exit 1
fi

mkdir -p "${WORKDIR}" "${OUT_DIR}"
source "${PYTHON_VENV}/bin/activate"


# Run program
cd "${PROJECT_DIR}/securemerge-benchmark/benchkit-evaluation"

DELAYED_PYTHON="${PROJECT_DIR}/securemerge-benchmark/delayed_python.sh"

# Base random jitter to desynchronize different jobs.
base_jitter_s=$(( ( RANDOM % 60 )  + 1 ))
base_jitter_ms=$((RANDOM % 1000))
sleep "${base_jitter_s}.$(printf '%03d' "${base_jitter_ms}")"

(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 10 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/1" --security_policy_sizes_to_check 1 10 100 200 300 400 500 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 20 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/2" --security_policy_sizes_to_check 600 700 800 900 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 30 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/3" --security_policy_sizes_to_check 1000 2000 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 40 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/4" --security_policy_sizes_to_check 3000 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 50 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/5" --security_policy_sizes_to_check 4000 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 60 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/6" --security_policy_sizes_to_check 5000 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 70 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/7" --security_policy_sizes_to_check 6000 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 80 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/8" --security_policy_sizes_to_check 7000 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 90 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/9" --security_policy_sizes_to_check 8000 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 100 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/10" --security_policy_sizes_to_check 9000 --number_of_checks 10000 --generate-wildcards) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 110 -m src.accesschecks.bench_access_checks --iterations 20 --nb_runs 1 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/11" --security_policy_sizes_to_check 10000 --number_of_checks 10000 --generate-wildcards) &
wait

mv "${JOB_CONSOLE_OUTPUT_FILES_DIR}/slurm-${SLURM_ARRAY_JOB_ID}_${SLURM_ARRAY_TASK_ID}.err" "${OUT_DIR}"
mv "${JOB_CONSOLE_OUTPUT_FILES_DIR}/slurm-${SLURM_ARRAY_JOB_ID}_${SLURM_ARRAY_TASK_ID}.out" "${OUT_DIR}"
deactivate

rm -r "${WORKDIR}"

