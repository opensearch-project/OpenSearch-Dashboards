#!/bin/bash

# Function to retry an operation a number of times
# Arguments:
# $1: Name of the operation
# $2: Number of attempts
# $3: Delay between attempts
# $4+: Command to execute
retry_operation() {
    local operation_name=$1
    local max_attempts=$2
    local sleep_time=$3
    shift 3  # Delete the first 3 arguments

    for i in $(seq 1 $max_attempts); do
        if eval "$@"; then
            return 0
        else
            if [ $i -eq $max_attempts ]; then
                echo "Failed to $operation_name after $max_attempts attempts"
                return 1
            fi
            sleep $sleep_time
        fi
    done
}
