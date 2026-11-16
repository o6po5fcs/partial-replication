#!/bin/bash

rm -r "${VSC_SCRATCH}/benchkit" || true
rm -r "${VSC_SCRATCH}/tmp" || true
rm slurm-*.out || true
rm slurm-*.err || true