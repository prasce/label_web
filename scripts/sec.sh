#!/bin/bash
# Security hook - block dangerous commands

DANGEROUS_PATTERNS=(
  "rm -rf"
  "DROP TABLE"
  "DROP DATABASE"
  "sudo rm"
  "> /dev/null 2>&1 &"
)

INPUT="$*"

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$INPUT" | grep -qi "$pattern"; then
    echo "BLOCKED: Dangerous command detected: $pattern" >&2
    exit 2  # exit 2 = block
  fi
done

exit 0  # allow
