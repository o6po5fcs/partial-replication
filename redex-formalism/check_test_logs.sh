#!/bin/bash
# Verifies the logs of a property-based test run.
# Usage: check_test_logs.sh <test_name>

if [ $# -ne 1 ]; then
  echo "Usage: $0 <test_name>" >&2
  exit 2
fi

TEST_NAME=$1
declare -a LOG_FILES=()
shopt -s nullglob
for log in "./logs/${TEST_NAME}-"*.txt; do
  thread=${log#"./logs/${TEST_NAME}-"}
  thread=${thread%.txt}
  if [[ $thread =~ ^[0-9]+$ ]]; then
    LOG_FILES+=("$log")
  fi
done

if [ ${#LOG_FILES[@]} -eq 0 ]; then
  echo "No logs found for ${TEST_NAME}; skipping."
  exit 0
fi

EXIT_CODE=0
for LOG_NAME in "${LOG_FILES[@]}"; do
  i=${LOG_NAME#"./logs/${TEST_NAME}-"}
  i=${i%.txt}
  last_line=$(tail -n 100 "${LOG_NAME}" 2>/dev/null | grep -aF "  ✓ property")
  if [[ $last_line == "  ✓ property"* ]]; then
    echo "Process $i succeeded"
  else
    echo "Process $i failed, check error in log: $(pwd)/${LOG_NAME#./}"
    EXIT_CODE=1
  fi
done

exit $EXIT_CODE
