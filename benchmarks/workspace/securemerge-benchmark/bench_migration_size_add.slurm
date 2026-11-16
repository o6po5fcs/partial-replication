#!/bin/bash

#SBATCH --job-name=bench_migration_size_add
#SBATCH --mail-type=FAIL
#SBATCH --ntasks=45
#SBATCH --mem-per-cpu=2G
#SBATCH --output=slurm-%A.out
#SBATCH --error=slurm-%A.err
#SBATCH --partition=zen4

# Wall clock limit:
# d-hh:mm:ss (days, hours, minutes and seconds) format. The - is not a typo!
#SBATCH --time=2-12:00:00

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
OUT_DIR="${VSC_SCRATCH}/benchkit/${SLURM_JOB_NAME}/${SLURM_JOB_ID}"

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

(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 10 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/1"  --approaches srdt-plain-security-policy --privileges_to_add 1 250) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 20 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/2"  --approaches srdt-plain-security-policy --privileges_to_add 500 750) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 30 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/3"  --approaches srdt-plain-security-policy --privileges_to_add 1000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 40 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/4"  --approaches srdt-plain-security-policy --privileges_to_add 1250) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 50 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/5"  --approaches srdt-plain-security-policy --privileges_to_add 1500) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 60 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/6"  --approaches srdt-plain-security-policy --privileges_to_add 1750) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 70 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/7"  --approaches srdt-plain-security-policy --privileges_to_add 2000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 80 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/8"  --approaches srdt-plain-security-policy --privileges_to_add 3000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 90 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/9"  --approaches srdt-plain-security-policy --privileges_to_add 4000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 100 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/10" --approaches srdt-plain-security-policy --privileges_to_add 5000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 110 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/11" --approaches srdt-plain-security-policy --privileges_to_add 6000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 120 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/12" --approaches srdt-plain-security-policy --privileges_to_add 7000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 130 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/13" --approaches srdt-plain-security-policy --privileges_to_add 8000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 140 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/14" --approaches srdt-plain-security-policy --privileges_to_add 9000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 150 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/15" --approaches srdt-plain-security-policy --privileges_to_add 10000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 160 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/16" --approaches poltree-security-policy --privileges_to_add 1 250) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 170 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/17" --approaches poltree-security-policy --privileges_to_add 500 750) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 180 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/18" --approaches poltree-security-policy --privileges_to_add 1000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 190 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/19" --approaches poltree-security-policy --privileges_to_add 1250) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 200 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/20" --approaches poltree-security-policy --privileges_to_add 1500) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 210 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/21" --approaches poltree-security-policy --privileges_to_add 1750) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 220 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/22" --approaches poltree-security-policy --privileges_to_add 2000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 230 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/23" --approaches poltree-security-policy --privileges_to_add 3000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 240 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/24" --approaches poltree-security-policy --privileges_to_add 4000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 250 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/25" --approaches poltree-security-policy --privileges_to_add 5000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 260 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/26" --approaches poltree-security-policy --privileges_to_add 6000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 270 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/27" --approaches poltree-security-policy --privileges_to_add 7000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 280 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/28" --approaches poltree-security-policy --privileges_to_add 8000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 290 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/29" --approaches poltree-security-policy --privileges_to_add 9000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 300 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/30" --approaches poltree-security-policy --privileges_to_add 10000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 310 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/31" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 1 250) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 320 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/32" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 500 750) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 330 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/33" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 1000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 340 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/34" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 1250) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 350 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/35" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 1500) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 360 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/36" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 1750) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 370 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/37" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 2000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 380 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/38" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 3000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 390 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/39" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 4000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 400 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/40" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 5000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 410 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/41" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 6000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 420 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/42" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 7000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 430 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/43" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 8000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 440 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/44" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 9000) &
(srun --mpi=none --ntasks=1 --exact "${DELAYED_PYTHON}" 450 -m src.add.bench_migration_size --results_dir "${OUT_DIR}" --tmp_dir "${WORKDIR}/45" --approaches srdt-plain-security-policy-with-diff --privileges_to_add 10000) &
wait

mv "${JOB_CONSOLE_OUTPUT_FILES_DIR}/slurm-${SLURM_JOB_ID}.err" "${OUT_DIR}"
mv "${JOB_CONSOLE_OUTPUT_FILES_DIR}/slurm-${SLURM_JOB_ID}.out" "${OUT_DIR}"
deactivate

rm -r "${WORKDIR}"


