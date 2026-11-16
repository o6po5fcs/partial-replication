#!/bin/bash

if [ $# -ne 2 ]; then
  echo "Usage: $0 <num_threads> <num_runs>" >&2
  exit 2
fi

NUM_THREADS=$1
NUM_RUNS=$2

./run_property_based_test.sh ${NUM_THREADS} "check-projection-equivalence" ${NUM_RUNS}
./run_property_based_test.sh ${NUM_THREADS} "check-projection-confidentiality" ${NUM_RUNS}
./run_property_based_test.sh ${NUM_THREADS} "check-shard-query-PolTree-equivalence" ${NUM_RUNS}
./run_property_based_test.sh ${NUM_THREADS} "check-PolTree-migration-remove-correctness" ${NUM_RUNS}
./run_property_based_test.sh ${NUM_THREADS} "check-PolTree-migration-add-correctness" ${NUM_RUNS}