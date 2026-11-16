#!/bin/bash

#SBATCH --job-name=prepare_shared_env
#SBATCH --mail-type=FAIL
#SBATCH --ntasks=1
#SBATCH --mem-per-cpu=4G
#SBATCH --output=slurm-%j.out
#SBATCH --error=slurm-%j.err

# Wall clock limit:
# d-hh:mm:ss (days, hours, minutes and seconds) format. The - is not a typo!
#SBATCH --time=00:30:00

set -euo pipefail

# Install modules provided by Hydra
# Some packages are part of bundles: numpy/2.3.1, pandas/2.3.3, matplotlib/3.10.3
# use "module spider <package-name>" to find out which bundle a package is part of
module load nodejs

# SOURCE_PROJECT_DIR should point to the repo checkout to snapshot and prepare.
# PREPARED_ROOT is the shared read-only artifact directory that benchmark jobs
# and partition-specific venv prepare jobs should consume.
SOURCE_PROJECT_DIR="${SOURCE_PROJECT_DIR:-${VSC_SCRATCH}/securemerge}"
PREPARED_ROOT="${PREPARED_ROOT:-${VSC_SCRATCH}/securemerge-prepared}"
STAGING_ROOT="${PREPARED_ROOT}.job-${SLURM_JOB_ID}"
PROJECT_DIR="${STAGING_ROOT}/project"

if [[ ! -d "${SOURCE_PROJECT_DIR}" ]]; then
    echo "Source project directory does not exist: ${SOURCE_PROJECT_DIR}" >&2
    exit 1
fi

rm -rf "${STAGING_ROOT}"
mkdir -p "${PROJECT_DIR}"

# Use the same yarn bootstrap steps as the benchmark jobs.
mkdir -p "${STAGING_ROOT}/.npm-global"
export NPM_CONFIG_PREFIX="${STAGING_ROOT}/.npm-global"
export PATH="${NPM_CONFIG_PREFIX}/bin:${PATH}"

# Copy the repository into a staging directory so array jobs can later use a stable snapshot.
cp -R "${SOURCE_PROJECT_DIR}/." "${PROJECT_DIR}"

cd "${PROJECT_DIR}"

npm install -g corepack
yarn set version stable
yarn install
./build.sh

# Publish the prepared snapshot atomically for dependent benchmark jobs.
rm -rf "${PREPARED_ROOT}"
mv "${STAGING_ROOT}" "${PREPARED_ROOT}"

echo "Prepared project: ${PREPARED_ROOT}/project"