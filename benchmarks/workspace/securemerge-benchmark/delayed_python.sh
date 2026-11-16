#!/bin/bash
# Usage: delayed_python.sh <delay_seconds> <python args...>
sleep "$1"
shift
exec python "$@"
