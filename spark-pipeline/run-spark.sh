#!/usr/bin/env bash
# ==============================================================================
# MARISLINK Spark Runner Script
# Invokes TelemetryProcessor with strict Java 17 module options & Spark 3.5.9
# ==============================================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

INPUT_PATH="${1:-$PROJECT_ROOT/data/spark-datasets/marislink_underwater_telemetry_primary.csv}"
OUTPUT_PATH="${2:-$PROJECT_ROOT/server/jobs/latest_results.json}"

# Resolve to absolute paths first
[[ "$INPUT_PATH" = /* ]] || INPUT_PATH="$PROJECT_ROOT/$INPUT_PATH"
[[ "$OUTPUT_PATH" = /* ]] || OUTPUT_PATH="$PROJECT_ROOT/$OUTPUT_PATH"

echo "================================================================================"
echo " MARISLINK REAL APACHE SPARK LAUNCHER"
echo " Execution Time : $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo " Project Root   : $PROJECT_ROOT"
echo " Input Dataset  : $INPUT_PATH"
echo " Output Target  : $OUTPUT_PATH"
echo "================================================================================"

if [ ! -f "$INPUT_PATH" ]; then
  echo "[ERROR] Input dataset file not found: $INPUT_PATH" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_PATH")"

cd "$SCRIPT_DIR"

# Compute relative paths from SCRIPT_DIR to avoid any parent directory space issues
REL_INPUT=$(realpath --relative-to="$SCRIPT_DIR" "$INPUT_PATH")
REL_OUTPUT=$(realpath --relative-to="$SCRIPT_DIR" "$OUTPUT_PATH")

export SBT_OPTS="-Xms512M -Xmx2048M"
sbt "run \"$REL_INPUT\" \"$REL_OUTPUT\""
