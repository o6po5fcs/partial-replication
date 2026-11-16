#!/bin/bash

if [ $# -ne 0 ]; then
  echo "Usage: $0" >&2
  exit 2
fi

DIR="$(dirname "$0")"

TESTS=(
  "check-projection-equivalence"
  "check-projection-confidentiality"
  "check-shard-query-PolTree-equivalence"
  "check-PolTree-migration-remove-correctness"
  "check-PolTree-migration-add-correctness"
)

EXIT_CODE=0
for test in "${TESTS[@]}"; do
  echo "${test}:"
  "${DIR}/check_test_logs.sh" "${test}" || EXIT_CODE=1
  echo ""
done

exit $EXIT_CODE
