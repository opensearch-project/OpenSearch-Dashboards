#!/bin/bash

# E-commerce Performance Demo Data Setup Script
# Creates OpenSearch index and loads demo data

set -e

# Default configuration
OPENSEARCH_HOST="localhost:9200"
INDEX_NAME="ecommerce_performance_demo"
DATA_DIR="./output"
MAPPING_FILE="$DATA_DIR/mapping.json"
DATA_FILE="$DATA_DIR/all_data.ndjson"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if OpenSearch is running
check_opensearch() {
    print_status "Checking OpenSearch connection..."
    if curl -s -f "http://$OPENSEARCH_HOST/_cluster/health" > /dev/null; then
        print_success "OpenSearch is running at $OPENSEARCH_HOST"
    else
        print_error "Cannot connect to OpenSearch at $OPENSEARCH_HOST"
        print_error "Please ensure OpenSearch is running and accessible"
        exit 1
    fi
}

# Function to delete existing index
delete_index() {
    print_status "Checking if index '$INDEX_NAME' exists..."
    if curl -s -f "http://$OPENSEARCH_HOST/$INDEX_NAME" > /dev/null; then
        print_warning "Index '$INDEX_NAME' already exists"
        read -p "Do you want to delete it and recreate? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deleting existing index..."
            curl -X DELETE "http://$OPENSEARCH_HOST/$INDEX_NAME"
            print_success "Index deleted"
        else
            print_error "Aborted. Index already exists."
            exit 1
        fi
    fi
}

# Function to create index with mapping
create_index() {
    print_status "Creating index '$INDEX_NAME' with mapping..."
    
    if [ ! -f "$MAPPING_FILE" ]; then
        print_error "Mapping file not found: $MAPPING_FILE"
        print_error "Please run the data generator first: python generate_demo_data.py --create-mapping-only"
        exit 1
    fi
    
    response=$(curl -s -w "%{http_code}" -X PUT "http://$OPENSEARCH_HOST/$INDEX_NAME" \
        -H "Content-Type: application/json" \
        -d @"$MAPPING_FILE")
    
    http_code="${response: -3}"
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        print_success "Index created successfully"
    else
        print_error "Failed to create index. HTTP code: $http_code"
        echo "Response: ${response%???}"
        exit 1
    fi
}

# Function to load data
load_data() {
    print_status "Loading data from '$DATA_FILE'..."
    
    if [ ! -f "$DATA_FILE" ]; then
        print_error "Data file not found: $DATA_FILE"
        print_error "Please run the data generator first: python generate_demo_data.py"
        exit 1
    fi
    
    # Get file size for progress indication
    file_size=$(wc -l < "$DATA_FILE")
    print_status "Loading $file_size documents..."
    
    # Load data using bulk API
    response=$(curl -s -w "%{http_code}" -X POST "http://$OPENSEARCH_HOST/$INDEX_NAME/_bulk" \
        -H "Content-Type: application/x-ndjson" \
        --data-binary @"$DATA_FILE")
    
    http_code="${response: -3}"
    if [ "$http_code" -eq 200 ]; then
        print_success "Data loaded successfully"
        
        # Parse response to check for errors
        response_body="${response%???}"
        errors=$(echo "$response_body" | grep -o '"errors":true' || true)
        if [ -n "$errors" ]; then
            print_warning "Some documents failed to index. Check the response for details."
        fi
    else
        print_error "Failed to load data. HTTP code: $http_code"
        echo "Response: ${response%???}"
        exit 1
    fi
}

# Function to verify data loading
verify_data() {
    print_status "Verifying data loading..."
    
    # Wait a moment for indexing to complete
    sleep 2
    
    # Get document count
    response=$(curl -s "http://$OPENSEARCH_HOST/$INDEX_NAME/_count")
    count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d':' -f2)
    
    if [ -n "$count" ] && [ "$count" -gt 0 ]; then
        print_success "Data verification successful: $count documents indexed"
    else
        print_error "Data verification failed: No documents found"
        exit 1
    fi
    
    # Show sample document
    print_status "Sample document:"
    curl -s "http://$OPENSEARCH_HOST/$INDEX_NAME/_search?size=1&pretty" | head -30
}

# Function to create index pattern instructions
show_index_pattern_instructions() {
    print_success "Setup complete!"
    echo
    print_status "Next steps to use the data in OpenSearch Dashboards:"
    echo "1. Open OpenSearch Dashboards in your browser"
    echo "2. Navigate to 'Stack Management' → 'Index Patterns'"
    echo "3. Click 'Create Index Pattern'"
    echo "4. Enter index pattern: '$INDEX_NAME'"
    echo "5. Select time field: '@timestamp'"
    echo "6. Click 'Create Index Pattern'"
    echo
    print_status "Then you can:"
    echo "• Go to 'Explore' → 'Logs' to view the transaction data"
    echo "• Create visualizations showing response times over time"
    echo "• Filter for error transactions to investigate incidents"
    echo "• Expand documents to see detailed error information"
    echo
    print_status "Demo scenarios to try:"
    echo "• Set time range to 'Last 24 hours' and look for response time spikes"
    echo "• Filter by status:error to see performance incidents"
    echo "• Expand error documents to see payment timeout details"
    echo "• Create line chart of response_time_ms over time to spot anomalies"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --host HOST       OpenSearch host (default: localhost:9200)"
    echo "  -i, --index NAME      Index name (default: ecommerce_performance_demo)"
    echo "  -d, --data-dir DIR    Data directory (default: ./output)"
    echo "  --help                Show this help message"
    echo
    echo "Examples:"
    echo "  $0                                    # Use defaults"
    echo "  $0 -h localhost:9200 -i my_demo     # Custom host and index"
    echo "  $0 -d /path/to/data                  # Custom data directory"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            OPENSEARCH_HOST="$2"
            shift 2
            ;;
        -i|--index)
            INDEX_NAME="$2"
            shift 2
            ;;
        -d|--data-dir)
            DATA_DIR="$2"
            MAPPING_FILE="$DATA_DIR/mapping.json"
            DATA_FILE="$DATA_DIR/all_data.ndjson"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status "Starting OpenSearch demo data setup..."
    print_status "Host: $OPENSEARCH_HOST"
    print_status "Index: $INDEX_NAME"
    print_status "Data directory: $DATA_DIR"
    echo
    
    check_opensearch
    delete_index
    create_index
    load_data
    verify_data
    show_index_pattern_instructions
}

# Run main function
main