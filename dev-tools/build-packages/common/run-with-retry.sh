#!/bin/bash

# Shared retry helper for shell scripts that need to tolerate transient failures.
#
# Environment variables:
#   RETRY_MAX_ATTEMPTS - number of times to retry (default: 3)
#   RETRY_DELAY_SECONDS - seconds to wait between retries (default: 15)

if ! declare -f run_with_retry >/dev/null 2>&1; then
  run_with_retry() {
    local max_attempts=${RETRY_MAX_ATTEMPTS:-3}
    local delay=${RETRY_DELAY_SECONDS:-15}
    local attempt=1
    local exit_code=0

    while [ "${attempt}" -le "${max_attempts}" ]; do
      "$@"
      exit_code=$?
      if [ ${exit_code} -eq 0 ]; then
        return 0
      fi

      if [ "${attempt}" -ge "${max_attempts}" ]; then
        echo "Command failed after ${max_attempts} attempts (exit code ${exit_code}): $*" >&2
        return ${exit_code}
      fi

      if [ "${delay}" -gt 0 ]; then
        echo "Command failed (attempt ${attempt}/${max_attempts}, exit ${exit_code}). Retrying in ${delay}s..." >&2
        sleep "${delay}"
      else
        echo "Command failed (attempt ${attempt}/${max_attempts}, exit ${exit_code}). Retrying..." >&2
      fi

      attempt=$((attempt + 1))
    done
  }
fi
