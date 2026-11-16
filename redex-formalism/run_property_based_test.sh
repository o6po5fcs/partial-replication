#!/bin/bash

if [ $# -ne 3 ]; then
  echo "Usage: $0 <num_threads> <test_name> <nr_of_tests>" >&2
  exit 2
fi

NUM_THREADS=$1
TEST_NAME=$2
NR_OF_TESTS=$3

# Keep the product within the range of Bash arithmetic, including on macOS.
for value in "$NUM_THREADS" "$NR_OF_TESTS"; do
  if [[ ! $value =~ ^[1-9][0-9]{0,8}$ ]]; then
    echo "Thread and test counts must be positive integers of at most 9 digits." >&2
    exit 2
  fi
done

SCRIPT_START_TIME=$(date +%s)
mkdir -p logs || exit 1
exec > >(tee "logs/terminal_log.txt") 2>&1

MIN_REFRESH_INTERVAL=30
REFRESH_INTERVAL=5
EXPECTED_TOTAL_TESTS=$((NUM_THREADS * NR_OF_TESTS))
declare -a TESTS_DONE_PER_PROCESS
declare -a PIDS
declare -a REAPED
TOTAL_TESTS_DONE=0
ERROR_FOUND=0

print_progress() {
  local i log_name progress attempt failed pid status previous
  TOTAL_TESTS_DONE=0
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Progress:"

  for ((i=1; i<=NUM_THREADS; i++)); do
    log_name="./logs/${TEST_NAME}-${i}.txt"
    pid=${PIDS[$i]}
    if [[ ${REAPED[$i]:-0} == 1 ]]; then
      status=finished
    elif kill -0 "$pid" 2>/dev/null; then
      status=running
    else
      status=finished
      if ! wait "$pid"; then
        echo "Process ${i} (pid $pid) exited unsuccessfully."
        ERROR_FOUND=1
      fi
      REAPED[$i]=1
    fi

    attempt=0
    failed=0
    if [[ -f $log_name ]]; then
      if ! progress=$(LC_ALL=C awk '
        /##################### attempt [0-9]+/ { attempt = $3 }
        /errortrace\.\.\.:/ || /Failed after [0-9]+ tests:/ { failed = 1 }
        END { printf "%.0f %d\n", attempt + 0, failed + 0 }
      ' "$log_name"); then
        echo "Could not read log: $log_name" >&2
        ERROR_FOUND=1
        return 1
      fi
      read -r attempt failed <<< "$progress"
    fi

    if (( attempt == 0 )); then
      echo "Process ${i} (pid $pid, ${status}), last attempt: undefined"
    else
      previous=${TESTS_DONE_PER_PROCESS[$i]:-0}
      TOTAL_TESTS_DONE=$((TOTAL_TESTS_DONE + attempt))
      echo "Process ${i} (pid $pid, ${status}), last attempt: ${attempt} (+$((attempt - previous)))"
    fi
    TESTS_DONE_PER_PROCESS[$i]=$attempt
    if (( failed )); then
      echo "Process ${i} reported a failure; stopping."
      ERROR_FOUND=1
    fi
  done
}

run_tests() {
  local i log_name start_time progress_seconds now elapsed remaining
  local percentage estimated_seconds eta alive next_refresh

  for ((i=1; i<=NUM_THREADS; i++)); do
    log_name="./logs/${TEST_NAME}-${i}.txt"
    racket -l racket/base --lib racket/base --lib errortrace -t "./testing/rackcheck.rkt" -e "(${TEST_NAME} ${NR_OF_TESTS})" > "$log_name" 2>&1 &
    PIDS[$i]=$!
  done

  while true; do
    start_time=$(date +%s)
    print_progress || return 1
    progress_seconds=$(($(date +%s) - start_time))
    if [[ $progress_seconds -gt $((REFRESH_INTERVAL / 10)) || $progress_seconds -lt $((REFRESH_INTERVAL / 30)) ]]; then
      next_refresh=$((progress_seconds * 30))
      REFRESH_INTERVAL=$((next_refresh > MIN_REFRESH_INTERVAL ? next_refresh : MIN_REFRESH_INTERVAL))
    fi

    now=$(date +%s)
    elapsed=$((now - SCRIPT_START_TIME))
    remaining=$((EXPECTED_TOTAL_TESTS - TOTAL_TESTS_DONE))
    (( remaining < 0 )) && remaining=0
    percentage=$(awk -v done="$TOTAL_TESTS_DONE" -v total="$EXPECTED_TOTAL_TESTS" 'BEGIN { printf "%.2f", 100 * done / total }')
    eta=unknown
    if (( TOTAL_TESTS_DONE > 0 && elapsed > 0 )); then
      estimated_seconds=$(awk -v elapsed="$elapsed" -v done="$TOTAL_TESTS_DONE" -v remaining="$remaining" 'BEGIN { printf "%.0f", elapsed * remaining / done }')
      eta="$((estimated_seconds/3600))h $(((estimated_seconds/60)%60))m $((estimated_seconds%60))s"
    fi
    echo "Attempts: ${TOTAL_TESTS_DONE}/${EXPECTED_TOTAL_TESTS} (${percentage}%) -- estimated time remaining ${eta} (next refresh in $REFRESH_INTERVAL seconds)"

    (( ERROR_FOUND )) && return 1
    alive=0
    for ((i=1; i<=NUM_THREADS; i++)); do
      [[ ${REAPED[$i]:-0} == 1 ]] || alive=1
    done
    (( alive )) || return 0

    sleep "$REFRESH_INTERVAL"
  done
}

stop_processes() {
  local i pid running=0
  for ((i=1; i<=NUM_THREADS; i++)); do
    pid=${PIDS[$i]:-}
    if [[ -n $pid && ${REAPED[$i]:-0} != 1 ]] && kill -0 "$pid" 2>/dev/null; then
      kill -TERM "$pid" 2>/dev/null
      running=1
    fi
  done
  (( running )) && sleep 2
  for ((i=1; i<=NUM_THREADS; i++)); do
    pid=${PIDS[$i]:-}
    if [[ -n $pid && ${REAPED[$i]:-0} != 1 ]]; then
      if kill -0 "$pid" 2>/dev/null; then
        kill -KILL "$pid" 2>/dev/null
      fi
      wait "$pid" 2>/dev/null
      REAPED[$i]=1
    fi
  done
}

trap 'echo; echo "Interrupted, stopping processes..."; stop_processes; exit 130' INT
trap 'echo; echo "Terminated, stopping processes..."; stop_processes; exit 143' TERM

echo "${TEST_NAME} tests:"
time run_tests
if (( $? != 0 )); then
  ERROR_FOUND=1
  stop_processes
fi

EXIT_CODE=0
"$(dirname "$0")/check_test_logs.sh" "$TEST_NAME" || EXIT_CODE=1
(( ERROR_FOUND )) && EXIT_CODE=1
echo ""
exit "$EXIT_CODE"
