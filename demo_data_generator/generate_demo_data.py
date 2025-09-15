#!/usr/bin/env python3
"""
E-commerce Performance Demo Data Generator

Generates realistic e-commerce transaction data with performance incidents
for demonstrating the Global Interaction Capture system's SOP generation.
"""

import json
import random
import argparse
from datetime import datetime, timedelta
from faker import Faker
import numpy as np
from typing import Dict, List, Any
import os

fake = Faker()

class EcommerceDataGenerator:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.fake = Faker()
        
        # Error templates for different incident types
        self.error_templates = {
            'payment_timeout': {
                'error_code': 'PAYMENT_TIMEOUT',
                'error_message': 'Payment gateway timeout after 30 seconds',
                'response_code': 500,
                'response_time_range': (25000, 35000),
                'upstream_response_time_range': (25000, 30000),
                'circuit_breaker_state': 'closed'
            },
            'db_connection': {
                'error_code': 'DB_CONN_EXHAUSTED',
                'error_message': 'Database connection pool exhausted',
                'response_code': 503,
                'response_time_range': (3000, 8000),
                'database_query_time_range': (2500, 7500),
                'thread_pool_active_range': (95, 100)
            },
            'circuit_breaker': {
                'error_code': 'CIRCUIT_BREAKER_OPEN',
                'error_message': 'Circuit breaker open - payment service unavailable',
                'response_code': 503,
                'response_time_range': (50, 200),
                'circuit_breaker_state': 'open'
            },
            'memory_pressure': {
                'error_code': 'MEMORY_EXHAUSTED',
                'error_message': 'Out of memory - unable to process request',
                'response_code': 503,
                'response_time_range': (5000, 15000),
                'memory_usage_range': (90, 98),
                'cpu_usage_range': (85, 95)
            },
            'upstream_service': {
                'error_code': 'UPSTREAM_SERVICE_ERROR',
                'error_message': 'Upstream service returned error',
                'response_code': 502,
                'response_time_range': (2000, 10000),
                'upstream_response_time_range': (1500, 8000)
            }
        }
        
        # Product categories and IDs
        self.products = [
            {'category': 'electronics', 'ids': ['laptop_001', 'phone_002', 'tablet_003', 'headphones_004']},
            {'category': 'clothing', 'ids': ['shirt_001', 'jeans_002', 'dress_003', 'shoes_004']},
            {'category': 'books', 'ids': ['novel_001', 'textbook_002', 'cookbook_003', 'biography_004']},
            {'category': 'home', 'ids': ['chair_001', 'table_002', 'lamp_003', 'rug_004']}
        ]
        
        # Server instances and infrastructure
        self.servers = ['checkout-service-01', 'checkout-service-02', 'checkout-service-03']
        self.load_balancers = ['lb-west-01', 'lb-east-01']
        self.payment_gateways = ['stripe', 'paypal', 'square']

    def get_traffic_multiplier(self, hour: int) -> float:
        """Get traffic multiplier based on hour of day"""
        # Traffic pattern: low at night, peaks at lunch and evening
        if 0 <= hour < 6:
            return 0.3  # Night: low traffic
        elif 6 <= hour < 9:
            return 0.6  # Morning: moderate traffic
        elif 9 <= hour < 12:
            return 1.0  # Business hours: normal traffic
        elif 12 <= hour < 14:
            return 1.8  # Lunch: peak traffic
        elif 14 <= hour < 17:
            return 1.2  # Afternoon: moderate-high traffic
        elif 17 <= hour < 20:
            return 2.0  # Evening: peak traffic
        else:
            return 0.8  # Late evening: moderate traffic

    def generate_normal_transaction(self, timestamp: datetime) -> Dict[str, Any]:
        """Generate a normal successful transaction"""
        product = random.choice(self.products)
        product_id = random.choice(product['ids'])
        
        return {
            '@timestamp': timestamp.isoformat() + 'Z',
            'transaction_id': f"txn_{timestamp.strftime('%Y%m%d_%H%M%S')}_{random.randint(1000, 9999)}",
            'session_id': f"sess_user_{random.randint(10000, 99999)}_{timestamp.strftime('%Y%m%d')}",
            'user_id': f"user_{random.randint(10000, 99999)}",
            'event_type': 'checkout_attempt',
            'step': random.choice(['cart_review', 'payment_processing', 'order_confirmation']),
            'status': 'success',
            'response_code': 200,
            'response_time_ms': random.randint(200, 800),
            'error_message': None,
            'error_code': None,
            'payment_gateway': random.choice(self.payment_gateways),
            'amount': round(random.uniform(10.99, 299.99), 2),
            'currency': 'USD',
            'product_category': product['category'],
            'product_id': product_id,
            'user_agent': self.fake.user_agent(),
            'ip_address': self.fake.ipv4(),
            'geo_location': {
                'country': 'US',
                'state': self.fake.state_abbr(),
                'city': self.fake.city()
            },
            'server_instance': random.choice(self.servers),
            'load_balancer': random.choice(self.load_balancers),
            'database_query_time_ms': random.randint(50, 200),
            'cache_hit': random.choice([True, False]),
            'retry_count': 0,
            'upstream_service': f"payment-gateway-{random.choice(self.payment_gateways)}",
            'upstream_response_time_ms': random.randint(100, 500),
            'circuit_breaker_state': 'closed',
            'thread_pool_active': random.randint(10, 40),
            'memory_usage_percent': random.randint(45, 70),
            'cpu_usage_percent': random.randint(20, 60)
        }

    def generate_error_transaction(self, timestamp: datetime, error_type: str, incident_severity: float = 1.0) -> Dict[str, Any]:
        """Generate an error transaction based on error type"""
        base_transaction = self.generate_normal_transaction(timestamp)
        error_template = self.error_templates[error_type]
        
        # Apply error template
        base_transaction.update({
            'status': 'error',
            'error_code': error_template['error_code'],
            'error_message': error_template['error_message'],
            'response_code': error_template['response_code'],
            'retry_count': random.randint(1, 3)
        })
        
        # Apply specific error characteristics
        if 'response_time_range' in error_template:
            min_time, max_time = error_template['response_time_range']
            base_transaction['response_time_ms'] = int(min_time + (max_time - min_time) * incident_severity)
        
        if 'upstream_response_time_range' in error_template:
            min_time, max_time = error_template['upstream_response_time_range']
            base_transaction['upstream_response_time_ms'] = int(min_time + (max_time - min_time) * incident_severity)
        
        if 'database_query_time_range' in error_template:
            min_time, max_time = error_template['database_query_time_range']
            base_transaction['database_query_time_ms'] = int(min_time + (max_time - min_time) * incident_severity)
        
        if 'thread_pool_active_range' in error_template:
            min_val, max_val = error_template['thread_pool_active_range']
            base_transaction['thread_pool_active'] = int(min_val + (max_val - min_val) * incident_severity)
        
        if 'memory_usage_range' in error_template:
            min_val, max_val = error_template['memory_usage_range']
            base_transaction['memory_usage_percent'] = int(min_val + (max_val - min_val) * incident_severity)
        
        if 'cpu_usage_range' in error_template:
            min_val, max_val = error_template['cpu_usage_range']
            base_transaction['cpu_usage_percent'] = int(min_val + (max_val - min_val) * incident_severity)
        
        if 'circuit_breaker_state' in error_template:
            base_transaction['circuit_breaker_state'] = error_template['circuit_breaker_state']
        
        return base_transaction

    def generate_incident(self, start_time: datetime, duration_minutes: int, error_type: str) -> List[Dict[str, Any]]:
        """Generate a performance incident with multiple error transactions"""
        transactions = []
        incident_end = start_time + timedelta(minutes=duration_minutes)
        
        # Calculate transactions during incident
        base_tps = self.config['base_tps']
        traffic_multiplier = self.get_traffic_multiplier(start_time.hour)
        incident_tps = int(base_tps * traffic_multiplier * 1.5)  # Higher traffic during incidents
        
        total_transactions = incident_tps * duration_minutes
        error_rate = random.uniform(0.25, 0.40)  # 25-40% error rate during incidents
        error_count = int(total_transactions * error_rate)
        success_count = total_transactions - error_count
        
        # Generate timestamps for the incident period
        timestamps = []
        current_time = start_time
        while current_time < incident_end:
            timestamps.append(current_time)
            # Add some randomness to transaction timing
            current_time += timedelta(seconds=random.uniform(30, 90))
        
        # Ensure we have the right number of timestamps
        timestamps = timestamps[:total_transactions]
        
        # Generate error transactions
        for i in range(error_count):
            if i < len(timestamps):
                # Incident severity increases over time, then decreases
                progress = i / max(error_count - 1, 1)
                if progress < 0.5:
                    severity = progress * 2  # Ramp up
                else:
                    severity = 2 - (progress * 2)  # Ramp down
                severity = max(0.3, min(1.0, severity))
                
                transaction = self.generate_error_transaction(timestamps[i], error_type, severity)
                transactions.append(transaction)
        
        # Generate successful transactions during incident (degraded but working)
        for i in range(error_count, min(len(timestamps), total_transactions)):
            transaction = self.generate_normal_transaction(timestamps[i])
            # Even successful transactions are slower during incidents
            transaction['response_time_ms'] = random.randint(1000, 3000)
            transaction['memory_usage_percent'] = random.randint(70, 85)
            transaction['cpu_usage_percent'] = random.randint(60, 80)
            transactions.append(transaction)
        
        return sorted(transactions, key=lambda x: x['@timestamp'])

    def generate_day_data(self, date: datetime) -> List[Dict[str, Any]]:
        """Generate a full day of transaction data"""
        transactions = []
        current_time = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_time = current_time + timedelta(days=1)
        
        # Determine incidents for this day
        incidents_count = random.randint(self.config['min_incidents_per_day'], self.config['max_incidents_per_day'])
        incidents = []
        
        for _ in range(incidents_count):
            # Random incident time (avoid night hours)
            incident_hour = random.choice([10, 11, 12, 13, 14, 15, 16, 17, 18, 19])
            incident_minute = random.randint(0, 59)
            incident_start = current_time.replace(hour=incident_hour, minute=incident_minute)
            incident_duration = random.randint(5, 15)  # 5-15 minutes
            incident_type = random.choice(list(self.error_templates.keys()))
            
            incidents.append({
                'start': incident_start,
                'duration': incident_duration,
                'type': incident_type
            })
        
        # Sort incidents by start time
        incidents.sort(key=lambda x: x['start'])
        
        # Generate normal transactions throughout the day
        while current_time < end_time:
            # Check if we're in an incident period
            in_incident = False
            for incident in incidents:
                incident_end = incident['start'] + timedelta(minutes=incident['duration'])
                if incident['start'] <= current_time < incident_end:
                    in_incident = True
                    break
            
            if not in_incident:
                # Generate normal transactions
                traffic_multiplier = self.get_traffic_multiplier(current_time.hour)
                tps = int(self.config['base_tps'] * traffic_multiplier)
                
                # Generate transactions for this minute
                for _ in range(max(1, tps)):
                    if random.random() > self.config['normal_error_rate']:
                        transaction = self.generate_normal_transaction(current_time)
                    else:
                        # Occasional normal errors
                        error_type = random.choice(['upstream_service', 'db_connection'])
                        transaction = self.generate_error_transaction(current_time, error_type, 0.3)
                    
                    transactions.append(transaction)
                    current_time += timedelta(seconds=random.uniform(1, 60))
                    
                    if current_time >= end_time:
                        break
            else:
                current_time += timedelta(minutes=1)
        
        # Generate incident transactions
        for incident in incidents:
            incident_transactions = self.generate_incident(
                incident['start'], 
                incident['duration'], 
                incident['type']
            )
            transactions.extend(incident_transactions)
        
        return sorted(transactions, key=lambda x: x['@timestamp'])

    def generate_data(self, days: int, output_dir: str):
        """Generate data for specified number of days"""
        os.makedirs(output_dir, exist_ok=True)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        all_transactions = []
        
        print(f"Generating {days} days of e-commerce transaction data...")
        
        current_date = start_date
        while current_date < end_date:
            print(f"Generating data for {current_date.strftime('%Y-%m-%d')}...")
            day_transactions = self.generate_day_data(current_date)
            all_transactions.extend(day_transactions)
            current_date += timedelta(days=1)
        
        # Write all data to NDJSON file in bulk format
        output_file = os.path.join(output_dir, 'all_data.ndjson')
        with open(output_file, 'w') as f:
            for transaction in all_transactions:
                # Write bulk action header
                action_header = {"index": {}}
                f.write(json.dumps(action_header) + '\n')
                # Write document data
                f.write(json.dumps(transaction) + '\n')
        
        print(f"Generated {len(all_transactions)} transactions")
        print(f"Data written to: {output_file}")
        
        # Generate summary statistics
        self.generate_summary(all_transactions, output_dir)

    def generate_summary(self, transactions: List[Dict[str, Any]], output_dir: str):
        """Generate summary statistics"""
        total_count = len(transactions)
        error_count = sum(1 for t in transactions if t['status'] == 'error')
        success_count = total_count - error_count
        
        error_types = {}
        response_times = []
        
        for transaction in transactions:
            response_times.append(transaction['response_time_ms'])
            if transaction['status'] == 'error':
                error_code = transaction.get('error_code', 'UNKNOWN')
                error_types[error_code] = error_types.get(error_code, 0) + 1
        
        summary = {
            'total_transactions': total_count,
            'successful_transactions': success_count,
            'error_transactions': error_count,
            'overall_error_rate': f"{(error_count / total_count * 100):.2f}%",
            'error_types': error_types,
            'response_time_stats': {
                'min': min(response_times),
                'max': max(response_times),
                'avg': sum(response_times) / len(response_times),
                'p95': np.percentile(response_times, 95),
                'p99': np.percentile(response_times, 99)
            }
        }
        
        summary_file = os.path.join(output_dir, 'summary.json')
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"Summary written to: {summary_file}")
        print(f"Total transactions: {total_count}")
        print(f"Error rate: {summary['overall_error_rate']}")
        print(f"Average response time: {summary['response_time_stats']['avg']:.0f}ms")

    def create_mapping(self, output_dir: str):
        """Create OpenSearch index mapping"""
        os.makedirs(output_dir, exist_ok=True)
        mapping = {
            "mappings": {
                "properties": {
                    "@timestamp": {"type": "date"},
                    "transaction_id": {"type": "keyword"},
                    "session_id": {"type": "keyword"},
                    "user_id": {"type": "keyword"},
                    "event_type": {"type": "keyword"},
                    "step": {"type": "keyword"},
                    "status": {"type": "keyword"},
                    "response_code": {"type": "integer"},
                    "response_time_ms": {"type": "integer"},
                    "error_message": {
                        "type": "text",
                        "fields": {"keyword": {"type": "keyword"}}
                    },
                    "error_code": {"type": "keyword"},
                    "payment_gateway": {"type": "keyword"},
                    "amount": {"type": "float"},
                    "currency": {"type": "keyword"},
                    "product_category": {"type": "keyword"},
                    "product_id": {"type": "keyword"},
                    "user_agent": {
                        "type": "text",
                        "fields": {"keyword": {"type": "keyword"}}
                    },
                    "ip_address": {"type": "ip"},
                    "geo_location": {
                        "properties": {
                            "country": {"type": "keyword"},
                            "state": {"type": "keyword"},
                            "city": {"type": "keyword"}
                        }
                    },
                    "server_instance": {"type": "keyword"},
                    "load_balancer": {"type": "keyword"},
                    "database_query_time_ms": {"type": "integer"},
                    "cache_hit": {"type": "boolean"},
                    "retry_count": {"type": "integer"},
                    "upstream_service": {"type": "keyword"},
                    "upstream_response_time_ms": {"type": "integer"},
                    "circuit_breaker_state": {"type": "keyword"},
                    "thread_pool_active": {"type": "integer"},
                    "memory_usage_percent": {"type": "integer"},
                    "cpu_usage_percent": {"type": "integer"}
                }
            }
        }
        
        mapping_file = os.path.join(output_dir, 'mapping.json')
        with open(mapping_file, 'w') as f:
            json.dump(mapping, f, indent=2)
        
        print(f"Index mapping written to: {mapping_file}")

def main():
    parser = argparse.ArgumentParser(description='Generate e-commerce performance demo data')
    parser.add_argument('--days', type=int, default=7, help='Number of days to generate')
    parser.add_argument('--output-dir', default='./output', help='Output directory')
    parser.add_argument('--base-tps', type=int, default=20, help='Base transactions per second')
    parser.add_argument('--incidents-per-day', type=int, default=2, help='Average incidents per day')
    parser.add_argument('--create-mapping-only', action='store_true', help='Only create mapping file')
    
    args = parser.parse_args()
    
    config = {
        'base_tps': args.base_tps,
        'min_incidents_per_day': max(1, args.incidents_per_day - 1),
        'max_incidents_per_day': args.incidents_per_day + 1,
        'normal_error_rate': 0.02,  # 2% normal error rate
        'incident_error_rate': 0.35  # 35% error rate during incidents
    }
    
    generator = EcommerceDataGenerator(config)
    
    if args.create_mapping_only:
        generator.create_mapping(args.output_dir)
    else:
        generator.create_mapping(args.output_dir)
        generator.generate_data(args.days, args.output_dir)

if __name__ == '__main__':
    main()