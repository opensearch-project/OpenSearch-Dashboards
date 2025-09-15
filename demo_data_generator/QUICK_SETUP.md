# Quick Setup Guide - Fix Dependencies

## 🚨 **Error Fix: Missing Python Dependencies**

You're getting the error because the required Python packages aren't installed. Here's the quick fix:

## 🔧 **Step 1: Install Python Dependencies**

```bash
# You're already in the right directory: ~/OpenSearch-Dashboards/demo_data_generator/

# Install the required Python packages
pip3 install -r requirements.txt

# If pip3 doesn't work, try:
python3 -m pip install -r requirements.txt

# Or install packages individually:
pip3 install faker==19.6.2 numpy==1.24.3 pandas==2.0.3 requests==2.31.0 python-dateutil==2.8.2
```

## 🚀 **Step 2: Generate Demo Data**

```bash
# Now this should work:
python3 generate_demo_data.py --days 7

# You should see output like:
# Generating 7 days of e-commerce transaction data...
# Generating data for 2025-09-08...
# Generating data for 2025-09-09...
# ...
# Generated 8750 transactions
# Data written to: ./output/all_data.ndjson
```

## 🔧 **Step 3: Setup OpenSearch Index**

```bash
# Make the setup script executable
chmod +x setup_index.sh

# Run the setup (make sure OpenSearch is running)
./setup_index.sh

# You should see:
# [INFO] Starting OpenSearch demo data setup...
# [SUCCESS] OpenSearch is running at localhost:9200
# [SUCCESS] Index created successfully
# [SUCCESS] Data loaded successfully
```

## 🐛 **Alternative: If pip3 install fails**

If you get permission errors or pip3 isn't available:

### **Option A: Use Virtual Environment (Recommended)**
```bash
# Create virtual environment
python3 -m venv demo_env

# Activate it
source demo_env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Generate data
python generate_demo_data.py --days 7

# When done, deactivate
deactivate
```

### **Option B: Install with --user flag**
```bash
pip3 install --user -r requirements.txt
python3 generate_demo_data.py --days 7
```

### **Option C: Use system package manager**
```bash
# On Ubuntu/Debian:
sudo apt update
sudo apt install python3-pip python3-faker python3-numpy python3-pandas python3-requests python3-dateutil

# Then run:
python3 generate_demo_data.py --days 7
```

## ✅ **Verification Steps**

After successful installation and data generation:

1. **Check output directory:**
   ```bash
   ls -la output/
   # Should show: all_data.ndjson, mapping.json, summary.json
   ```

2. **Check data file size:**
   ```bash
   wc -l output/all_data.ndjson
   # Should show several thousand lines (one per transaction)
   ```

3. **Check summary:**
   ```bash
   cat output/summary.json
   # Should show statistics like total transactions, error rate, etc.
   ```

## 🎯 **Expected Output After Successful Setup**

```bash
ubuntu@ip-172-31-18-229:~/OpenSearch-Dashboards/demo_data_generator$ python3 generate_demo_data.py --days 7
Generating 7 days of e-commerce transaction data...
Generating data for 2025-09-08...
Generating data for 2025-09-09...
Generating data for 2025-09-10...
Generating data for 2025-09-11...
Generating data for 2025-09-12...
Generating data for 2025-09-13...
Generating data for 2025-09-14...
Generated 8750 transactions
Data written to: ./output/all_data.ndjson
Summary written to: ./output/summary.json
Index mapping written to: ./output/mapping.json
Total transactions: 8750
Error rate: 12.34%
Average response time: 1250ms
```

## 🔍 **Next Steps After Data Generation**

1. **Setup OpenSearch Index:**
   ```bash
   ./setup_index.sh
   ```

2. **Create Index Pattern in OpenSearch Dashboards:**
   - Go to Stack Management → Index Patterns
   - Create pattern: `ecommerce_performance_demo`
   - Select time field: `@timestamp`

3. **Start Investigation Demo:**
   - Go to Explore → Logs
   - Set time range to "Last 7 days"
   - Look for response time spikes and error patterns

The data is now ready for demonstrating the Global Interaction Capture system's SOP generation capabilities!