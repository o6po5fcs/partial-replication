#!/bin/bash

#SBATCH --job-name=bench_migration_speed_remove
#SBATCH --mail-type=FAIL
#SBATCH --array=1-10
#SBATCH --ntasks=29
#SBATCH --mem-per-cpu=2G
#SBATCH --output=slurm-%A_%a.out
#SBATCH --error=slurm-%A_%a.err
#SBATCH --partition=zen4

# Wall clock limit:
# d-hh:mm:ss (days, hours, minutes and seconds) format. The - is not a typo!
#SBATCH --time=5-00:00:00

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

(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 10 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/1"  --privileges_to_remove 1) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 20 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/2"  --privileges_to_remove 10) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 30 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/3"  --privileges_to_remove 20) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 40 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/4"  --privileges_to_remove 30) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 50 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/5"  --privileges_to_remove 40) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 60 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/6"  --privileges_to_remove 50) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 70 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/7"  --privileges_to_remove 60) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 80 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/8"  --privileges_to_remove 70) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 90 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/9"  --privileges_to_remove 80) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 100 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/10"  --privileges_to_remove 90) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 110 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/11"  --privileges_to_remove 100) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 120 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/12"  --privileges_to_remove 200) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 130 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/13"  --privileges_to_remove 300) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 140 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/14"  --privileges_to_remove 400) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 150 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/15"  --privileges_to_remove 500) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 160 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/16"  --privileges_to_remove 600) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 170 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/17"  --privileges_to_remove 700) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 180 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/18"  --privileges_to_remove 800) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 190 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/19"  --privileges_to_remove 900) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 200 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/20"  --privileges_to_remove 1000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 210 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/21"  --privileges_to_remove 2000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 220 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/22"  --privileges_to_remove 3000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 230 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/23"  --privileges_to_remove 4000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 240 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/24"  --privileges_to_remove 5000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 250 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/25"  --privileges_to_remove 6000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 260 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/26"  --privileges_to_remove 7000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 270 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/27"  --privileges_to_remove 8000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 280 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/28"  --privileges_to_remove 9000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 290 -m src.remove.bench_migration_speed --nb_runs 1 --iterations 20 --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/29"  --privileges_to_remove 10000) &
wait

mv "${JOB_CONSOLE_OUTPUT_FILES_DIR}/slurm-${SLURM_ARRAY_JOB_ID}_${SLURM_ARRAY_TASK_ID}.err" "${OUT_DIR}"
mv "${JOB_CONSOLE_OUTPUT_FILES_DIR}/slurm-${SLURM_ARRAY_JOB_ID}_${SLURM_ARRAY_TASK_ID}.out" "${OUT_DIR}"
deactivate

rm -r "${WORKDIR}"


