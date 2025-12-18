#!/bin/bash

# Copyright OpenSearch Contributors
# SPDX-License-Identifier: Apache-2.0

set -e

# Script to configure OpenSearch for Cypress tests in CI environments
# This script increases JVM heap size and circuit breaker limits to prevent memory issues

OPENSEARCH_DIR=$1

if [ -z "$OPENSEARCH_DIR" ]; then
  echo "Error: OpenSearch directory not specified"
  echo "Usage: $0 <opensearch_directory>"
  exit 1
fi

if [ ! -d "$OPENSEARCH_DIR" ]; then
  echo "Error: OpenSearch directory does not exist: $OPENSEARCH_DIR"
  exit 1
fi

echo "Configuring OpenSearch in: $OPENSEARCH_DIR"

# Configure JVM heap size (increase from default ~1GB to 2GB for large trace queries)
JVM_OPTIONS_FILE="$OPENSEARCH_DIR/config/jvm.options"
if [ -f "$JVM_OPTIONS_FILE" ]; then
  echo "Configuring JVM heap size..."

  # Create backup
  cp "$JVM_OPTIONS_FILE" "$JVM_OPTIONS_FILE.backup"

  # Remove existing Xms and Xmx settings
  sed -i.bak '/^-Xms/d' "$JVM_OPTIONS_FILE"
  sed -i.bak '/^-Xmx/d' "$JVM_OPTIONS_FILE"

  # Set heap size to 2GB (needed for large trace data queries)
  echo "-Xms2g" >> "$JVM_OPTIONS_FILE"
  echo "-Xmx2g" >> "$JVM_OPTIONS_FILE"

  echo "✓ JVM heap size set to 2GB"
else
  echo "Warning: jvm.options file not found at $JVM_OPTIONS_FILE"
fi

# Configure circuit breaker limits
OPENSEARCH_YML="$OPENSEARCH_DIR/config/opensearch.yml"
if [ -f "$OPENSEARCH_YML" ]; then
  echo "Configuring circuit breaker limits..."

  # Create backup
  cp "$OPENSEARCH_YML" "$OPENSEARCH_YML.backup"

  # Add circuit breaker settings
  # These settings increase the limits to prevent circuit_breaking_exception
  # Default parent limit is 95%, request is 60%, fielddata is 40%
  cat >> "$OPENSEARCH_YML" <<EOF

# Circuit breaker settings for CI tests
# Increased to handle large trace data queries (default parent: 95%, request: 60%)
indices.breaker.total.limit: 98%
indices.breaker.request.limit: 70%
indices.breaker.fielddata.limit: 60%
EOF

  echo "✓ Circuit breaker limits configured"
else
  echo "Warning: opensearch.yml file not found at $OPENSEARCH_YML"
fi

echo "OpenSearch configuration complete!"
echo ""
echo "Configuration summary:"
echo "  - JVM Heap: 2GB (2048MB)"
echo "  - Total circuit breaker limit: 98% of heap (~1.96GB)"
echo "  - Request circuit breaker limit: 70% of heap (~1.4GB)"
echo "  - Fielddata circuit breaker limit: 60% of heap (~1.2GB)"
