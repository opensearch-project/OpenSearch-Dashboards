#!/bin/bash
# Array of configurations
declare -a configs=(
    "data_logs_small_time_2 --doc-count 10000"
    "data_logs_small_no_time_2 --doc-count 10000 --no-timestamp"
    "data_logs_large_time_2 --doc-count 100000"
)
# Log file
LOG_FILE="data_generation.log"
echo "Starting data generation at $(date)" > $LOG_FILE
# Loop through configurations and generate data
for config in "${configs[@]}"
do
    echo "Generating data for: $config"
    echo "Starting $config at $(date)" >> $LOG_FILE
    
    if node scripts/generate_data/index.js $config >> $LOG_FILE 2>&1; then
        echo "Successfully generated data for $config" | tee -a $LOG_FILE
    else
        echo "Failed to generate data for $config" | tee -a $LOG_FILE
        exit 1
    fi
done
echo "All data generation completed successfully!"
echo "Completed all data generation at $(date)" >> $LOG_FILE