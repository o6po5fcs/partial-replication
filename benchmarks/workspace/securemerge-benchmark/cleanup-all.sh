#!/bin/bash

./cleanup-output.sh
rm -rf "${VSC_SCRATCH}/securemerge-prepared" || true
rm -rf "${VSC_SCRATCH}"/securemerge-prepared.job-* || true