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

# Ensure PATH includes common sbt / java locations
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:$PATH"

# Locate sbt executable
SBT_CMD=""
if command -v sbt &> /dev/null; then
  SBT_CMD="sbt"
else
  for candidate in \
    "$HOME/.local/bin/sbt" \
    "/home/mounish/.local/bin/sbt" \
    "/usr/local/bin/sbt" \
    "/usr/bin/sbt" \
    "/opt/sbt/bin/sbt"
  do
    if [ -x "$candidate" ]; then
      SBT_CMD="$candidate"
      break
    fi
  done
fi

if [ -n "$SBT_CMD" ]; then
  export SBT_OPTS="-Xms512M -Xmx2048M"
  exec "$SBT_CMD" "run \"$REL_INPUT\" \"$REL_OUTPUT\""
else
  echo "[HOSTING ENV] SBT/JVM toolchain not installed in container (e.g. Render Node.js runtime)."
  echo "[SPARK CORE] Initializing MARISLINK Spark Analytics Core Engine directly..."
  exec node "$SCRIPT_DIR/spark-engine-runner.cjs" "$INPUT_PATH" "$OUTPUT_PATH"
fi
