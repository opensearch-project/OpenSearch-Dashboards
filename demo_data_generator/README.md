# E-commerce Performance Demo Data Generator

## 🎯 **Overview**
This directory contains scripts to generate realistic e-commerce performance data for demonstrating the Global Interaction Capture system's SOP generation capabilities.

## 📁 **Directory Structure**
```
demo_data_generator/
├── README.md                    # This file
├── generate_demo_data.py        # Main data generation script
├── mapping.json                 # OpenSearch index mapping
├── config.json                  # Configuration for data generation
├── setup_index.sh              # Script to create index and load data
├── sample_output/               # Sample generated data files
│   ├── normal_data.ndjson      # Normal operation data
│   ├── incident_data.ndjson    # Performance incident data
│   └── recovery_data.ndjson    # Recovery period data
└── templates/                   # Data templates
    ├── normal_transaction.json
    ├── error_templates.json
    └── infrastructure_metrics.json
```

## 🚀 **Quick Start**

### **Step 1: Generate Data**
```bash
cd demo_data_generator
python generate_demo_data.py --days 7 --output-dir ./output
```

### **Step 2: Setup OpenSearch Index**
```bash
./setup_index.sh --host localhost:9200 --index ecommerce_performance_demo
```

### **Step 3: Load Data**
```bash
curl -X POST "localhost:9200/ecommerce_performance_demo/_bulk" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary @output/all_data.ndjson
```

## ⚙️ **Configuration Options**

### **Data Generation Parameters**
- `--days`: Number of days to generate (default: 7)
- `--incidents-per-day`: Number of performance incidents per day (default: 2-3)
- `--base-tps`: Base transactions per second during normal operation (default: 20)
- `--peak-multiplier`: Traffic multiplier during peak hours (default: 2.5)
- `--error-rate-normal`: Normal error rate percentage (default: 1-2%)
- `--error-rate-incident`: Error rate during incidents (default: 25-40%)

### **Incident Types**
1. **Payment Gateway Timeout** (Most common)
2. **Database Connection Pool Exhaustion**
3. **Memory Pressure**
4. **Circuit Breaker Activation**
5. **Upstream Service Degradation**

## 📊 **Data Patterns**

### **Normal Operation**
- **Volume**: 20 TPS base, 50 TPS peak hours
- **Response Time**: 200-800ms
- **Error Rate**: 1-2%
- **Success Rate**: 98-99%

### **Performance Incidents**
- **Duration**: 5-15 minutes
- **Response Time**: 5,000-35,000ms
- **Error Rate**: 25-40%
- **Recovery Time**: 5-10 minutes

### **Daily Schedule**
```
00:00-06:00: Low traffic (10 TPS)
06:00-09:00: Morning ramp (15-30 TPS)
09:00-12:00: Business hours (25-40 TPS)
12:00-14:00: Lunch peak (35-50 TPS)
14:00-17:00: Afternoon business (30-45 TPS)
17:00-20:00: Evening peak (40-60 TPS)
20:00-24:00: Evening decline (20-10 TPS)
```

## 🔧 **Installation Requirements**

### **Python Dependencies**
```bash
pip install -r requirements.txt
```

**requirements.txt:**
```
faker==19.6.2
numpy==1.24.3
pandas==2.0.3
requests==2.31.0
python-dateutil==2.8.2
```

### **System Requirements**
- Python 3.8+
- OpenSearch/Elasticsearch cluster
- 2GB+ available disk space for data generation
- curl (for data loading)

## 📋 **Detailed Setup Steps**

### **1. Create Demo Data Directory**
```bash
mkdir -p demo_data_generator/{sample_output,templates,output}
cd demo_data_generator
```

### **2. Install Dependencies**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install faker numpy pandas requests python-dateutil
```

### **3. Generate Mapping and Data**
```bash
# Generate the index mapping
python generate_demo_data.py --create-mapping-only

# Generate sample data (7 days with incidents)
python generate_demo_data.py --days 7 --incidents-per-day 2
```

### **4. Setup OpenSearch Index**
```bash
# Create index with mapping
curl -X PUT "localhost:9200/ecommerce_performance_demo" \
  -H "Content-Type: application/json" \
  -d @mapping.json

# Verify index creation
curl -X GET "localhost:9200/ecommerce_performance_demo/_mapping"
```

### **5. Load Data**
```bash
# Load all generated data
curl -X POST "localhost:9200/ecommerce_performance_demo/_bulk" \
  -H "Content-Type: application/x-ndjson" \
  --data-binary @output/all_data.ndjson

# Verify data loading
curl -X GET "localhost:9200/ecommerce_performance_demo/_count"
```

### **6. Create Index Pattern in OpenSearch Dashboards**
1. Navigate to **Stack Management** → **Index Patterns**
2. Click **Create Index Pattern**
3. Enter pattern: `ecommerce_performance_demo`
4. Select time field: `@timestamp`
5. Click **Create Index Pattern**

## 🎯 **Demo Scenarios**

### **Scenario 1: Payment Gateway Timeout Investigation**
- **Time Range**: Today 14:25-14:35
- **Pattern**: Response time spike from 300ms to 30,000ms
- **Root Cause**: Payment gateway timeout cascade
- **Evidence**: 65 payment timeout errors, circuit breaker activation

### **Scenario 2: Database Connection Pool Exhaustion**
- **Time Range**: Yesterday 12:15-12:25
- **Pattern**: Connection errors during lunch peak
- **Root Cause**: Database connection pool exhaustion
- **Evidence**: Thread pool saturation, memory pressure

### **Scenario 3: Memory Pressure Incident**
- **Time Range**: 2 days ago 18:30-18:45
- **Pattern**: Gradual performance degradation
- **Root Cause**: Memory leak in checkout service
- **Evidence**: Increasing memory usage, GC pressure

## 🔍 **Validation Queries**

### **Check Data Distribution**
```json
GET ecommerce_performance_demo/_search
{
  "size": 0,
  "aggs": {
    "status_distribution": {
      "terms": { "field": "status" }
    },
    "response_time_stats": {
      "stats": { "field": "response_time_ms" }
    },
    "timeline": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "1h"
      }
    }
  }
}
```

### **Find Performance Incidents**
```json
GET ecommerce_performance_demo/_search
{
  "query": {
    "bool": {
      "must": [
        { "range": { "response_time_ms": { "gte": 5000 } } },
        { "term": { "status": "error" } }
      ]
    }
  },
  "sort": [{ "@timestamp": "desc" }],
  "size": 10
}
```

## 🚀 **Next Steps**

After data generation and loading:

1. **Test Visualization**: Create line charts showing response time over time
2. **Test Filtering**: Apply time range filters to isolate incidents
3. **Test Document Expansion**: Expand error documents to see detailed fields
4. **Test Global Interaction Capture**: Perform investigation workflow to generate SOPs

## 🐛 **Troubleshooting**

### **Common Issues**
- **Memory Error**: Reduce `--days` parameter or increase system memory
- **Connection Refused**: Verify OpenSearch is running on specified host/port
- **Index Already Exists**: Delete existing index with `curl -X DELETE "localhost:9200/ecommerce_performance_demo"`
- **Bulk Load Timeout**: Split data into smaller chunks or increase timeout

### **Data Validation**
```bash
# Check document count
curl -X GET "localhost:9200/ecommerce_performance_demo/_count"

# Check index health
curl -X GET "localhost:9200/_cluster/health/ecommerce_performance_demo"

# Sample documents
curl -X GET "localhost:9200/ecommerce_performance_demo/_search?size=5&pretty"
```

This comprehensive setup will provide realistic, investigation-friendly data that perfectly demonstrates the Global Interaction Capture system's ability to understand and document user investigation workflows.