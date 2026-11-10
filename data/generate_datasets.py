#!/usr/bin/env python3
"""
MARISLINK Underwater Telemetry Dataset Generator
Generates realistic benchmark and testing datasets for Apache Spark & Scala processing.
"""

import csv
import random
from datetime import datetime, timedelta

NODES = [
    {"id": "DC-01", "name": "Terrestrial Data Center", "depth": 0.0, "temp_range": (24.0, 26.0), "press_range": (0.1, 0.1), "base_latency": 15.0, "base_loss": 0.2, "sig_range": (-40.0, -35.0)},
    {"id": "SR-01", "name": "Surface Receiver Alpha", "depth": 2.5, "temp_range": (21.5, 23.5), "press_range": (0.12, 0.15), "base_latency": 45.0, "base_loss": 1.2, "sig_range": (-55.0, -48.0)},
    {"id": "MN-01", "name": "Main Underwater Node", "depth": 2000.0, "temp_range": (2.8, 3.4), "press_range": (20.1, 20.4), "base_latency": 142.0, "base_loss": 3.8, "sig_range": (-72.0, -65.0)},
    {"id": "MN-02", "name": "Backup Main Node", "depth": 1800.0, "temp_range": (3.1, 3.8), "press_range": (18.2, 18.5), "base_latency": 158.0, "base_loss": 4.2, "sig_range": (-75.0, -68.0)},
    {"id": "SUB-A", "name": "Sub-Node Alpha", "depth": 2800.0, "temp_range": (2.1, 2.6), "press_range": (28.4, 28.7), "base_latency": 210.0, "base_loss": 6.5, "sig_range": (-82.0, -74.0)},
    {"id": "SUB-B", "name": "Sub-Node Beta", "depth": 2600.0, "temp_range": (2.3, 2.7), "press_range": (26.3, 26.6), "base_latency": 195.0, "base_loss": 5.9, "sig_range": (-80.0, -73.0)},
    {"id": "SUB-C", "name": "Sub-Node Seafloor Hub", "depth": 3200.0, "temp_range": (1.8, 2.2), "press_range": (32.5, 32.9), "base_latency": 245.0, "base_loss": 7.4, "sig_range": (-86.0, -79.0)},
    {"id": "SUB-D", "name": "Sub-Node Deep Relay", "depth": 3500.0, "temp_range": (1.5, 1.9), "press_range": (35.6, 36.1), "base_latency": 268.0, "base_loss": 8.1, "sig_range": (-89.0, -82.0)},
    {"id": "S-01", "name": "Sensor CTD Mooring", "depth": 850.0, "temp_range": (6.2, 7.5), "press_range": (8.6, 8.8), "base_latency": 92.0, "base_loss": 2.4, "sig_range": (-66.0, -59.0)},
    {"id": "S-02", "name": "Acoustic Hydrophone Array", "depth": 1200.0, "temp_range": (4.8, 5.6), "press_range": (12.2, 12.5), "base_latency": 118.0, "base_loss": 3.1, "sig_range": (-69.0, -62.0)},
    {"id": "S-03", "name": "Benthic Boundary Monitor", "depth": 2400.0, "temp_range": (2.5, 3.0), "press_range": (24.3, 24.7), "base_latency": 182.0, "base_loss": 5.0, "sig_range": (-78.0, -71.0)},
    {"id": "S-04", "name": "Hydrothermal Vent Probe", "depth": 3100.0, "temp_range": (18.5, 32.0), "press_range": (31.4, 31.8), "base_latency": 238.0, "base_loss": 7.9, "sig_range": (-85.0, -78.0)},
]

HEADERS = [
    "node_id",
    "timestamp",
    "depth_m",
    "temperature_c",
    "pressure_mpa",
    "battery_level",
    "signal_strength",
    "latency_ms",
    "packet_loss",
    "communication_status",
    "node_status"
]

def generate_primary_dataset(filepath, count=150):
    start_time = datetime(2026, 11, 5, 8, 0, 0)
    rows = []
    
    for i in range(count):
        node = random.choice(NODES)
        timestamp = (start_time + timedelta(seconds=i * 24)).strftime("%Y-%m-%d %H:%M:%S")
        depth = round(node["depth"] + random.uniform(-1.5, 1.5) if node["depth"] > 0 else 0.0, 2)
        temp = round(random.uniform(*node["temp_range"]), 2)
        press = round(random.uniform(*node["press_range"]), 3)
        battery = round(max(15.0, 98.5 - (i * 0.08) - (random.uniform(0, 1.5))), 1)
        sig = round(random.uniform(*node["sig_range"]), 1)
        lat = round(node["base_latency"] + random.uniform(-8.0, 14.0), 1)
        loss = round(max(0.0, node["base_loss"] + random.uniform(-0.8, 1.5)), 2)
        
        if loss < 3.0 and lat < 120.0:
            comm_status = "OPTIMAL"
            node_status = "ACTIVE"
        elif loss < 6.0 and lat < 220.0:
            comm_status = "STABLE"
            node_status = "ACTIVE"
        elif loss < 10.0:
            comm_status = "DEGRADED"
            node_status = "WARNING"
        else:
            comm_status = "CRITICAL"
            node_status = "FAILOVER"

        rows.append([
            node["id"], timestamp, depth, temp, press, battery, sig, lat, loss, comm_status, node_status
        ])
        
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(HEADERS)
        writer.writerows(rows)
    print(f"Generated primary dataset: {filepath} ({len(rows)} records)")

def generate_anomalous_dataset(filepath, total_count=180, anomaly_count=24):
    start_time = datetime(2026, 11, 5, 9, 30, 0)
    rows = []
    
    # Valid rows
    for i in range(total_count - anomaly_count):
        node = random.choice(NODES)
        timestamp = (start_time + timedelta(seconds=i * 18)).strftime("%Y-%m-%d %H:%M:%S")
        depth = round(node["depth"] + random.uniform(-2.0, 2.0) if node["depth"] > 0 else 0.0, 2)
        temp = round(random.uniform(*node["temp_range"]), 2)
        press = round(random.uniform(*node["press_range"]), 3)
        battery = round(max(20.0, 95.0 - (i * 0.05)), 1)
        sig = round(random.uniform(*node["sig_range"]), 1)
        lat = round(node["base_latency"] + random.uniform(-5.0, 12.0), 1)
        loss = round(max(0.0, node["base_loss"] + random.uniform(-0.5, 1.2)), 2)
        comm_status = "OPTIMAL" if loss < 4.0 else "DEGRADED"
        node_status = "ACTIVE" if battery > 30 else "WARNING"
        rows.append([
            node["id"], timestamp, depth, temp, press, battery, sig, lat, loss, comm_status, node_status
        ])
        
    # Anomaly rows for testing Spark data cleaning & filtering
    anomalies = [
        # Missing node_id
        ["", "2026-11-05 10:01:00", 2000.0, 3.1, 20.2, 85.0, -70.0, 140.0, 3.5, "UNKNOWN", "ACTIVE"],
        [None, "2026-11-05 10:01:15", 2800.0, 2.3, 28.5, 78.0, -80.0, 210.0, 5.0, "UNKNOWN", "ACTIVE"],
        # Negative / out-of-range battery
        ["MN-01", "2026-11-05 10:02:00", 2000.0, 3.0, 20.3, -15.0, -71.0, 145.0, 3.2, "CRITICAL", "ERROR"],
        ["SUB-A", "2026-11-05 10:02:30", 2800.0, 2.2, 28.6, 125.0, -82.0, 215.0, 6.1, "INVALID", "ERROR"],
        # Impossible packet loss (>100% or <0%)
        ["SUB-C", "2026-11-05 10:03:00", 3200.0, 1.9, 32.7, 72.0, -87.0, 250.0, 145.0, "ERROR", "FAILOVER"],
        ["SR-01", "2026-11-05 10:03:30", 2.0, 22.0, 0.13, 88.0, -50.0, 48.0, -5.0, "ERROR", "ACTIVE"],
        # Negative depth
        ["S-01", "2026-11-05 10:04:00", -450.0, 7.0, 8.7, 90.0, -60.0, 95.0, 2.0, "INVALID", "ERROR"],
        # Negative latency
        ["MN-02", "2026-11-05 10:04:30", 1800.0, 3.3, 18.3, 81.0, -74.0, -85.0, 4.0, "INVALID", "ERROR"],
        # Non-numeric corrupted fields
        ["SUB-B", "2026-11-05 10:05:00", "CORRUPT_DEPTH", 2.5, 26.4, 76.0, -79.0, 200.0, 5.8, "DEGRADED", "ACTIVE"],
        ["S-03", "2026-11-05 10:05:30", 2400.0, "ERR_TEMP", 24.5, 84.0, -77.0, 185.0, 4.9, "DEGRADED", "ACTIVE"],
        ["S-02", "2026-11-05 10:06:00", 1200.0, 5.1, "ERR_PRESS", "NAN_BATTERY", -68.0, 120.0, 3.0, "DEGRADED", "ACTIVE"],
        ["DC-01", "2026-11-05 10:06:30", 0.0, 25.0, 0.1, 99.0, -38.0, "ERR_LAT", "ERR_LOSS", "OPTIMAL", "ACTIVE"],
    ]
    # Add more anomalies to reach desired count
    for idx in range(len(anomalies), anomaly_count):
        anomalies.append(["CORRUPT_NODE_" + str(idx), "2026-11-05 10:07:00", 1000.0, 4.0, 10.0, -99.0, -999.0, -1.0, 200.0, "CORRUPT", "CORRUPT"])

    rows.extend(anomalies)
    random.shuffle(rows)

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(HEADERS)
        writer.writerows(rows)
    print(f"Generated anomalous dataset: {filepath} ({len(rows)} records, including {len(anomalies)} anomalies)")

def generate_deep_sea_stress_dataset(filepath, count=320):
    start_time = datetime(2026, 11, 5, 12, 0, 0)
    rows = []
    
    deep_nodes = [n for n in NODES if n["depth"] >= 1800.0]
    for i in range(count):
        node = random.choice(deep_nodes)
        timestamp = (start_time + timedelta(seconds=i * 12)).strftime("%Y-%m-%d %H:%M:%S")
        # Simulating acoustic multipath storm
        depth = round(node["depth"] + random.uniform(-3.0, 3.0), 2)
        temp = round(random.uniform(*node["temp_range"]), 2)
        press = round(random.uniform(*node["press_range"]), 3)
        battery = round(max(8.0, 90.0 - (i * 0.18)), 1)
        sig = round(random.uniform(*node["sig_range"]) - random.uniform(2.0, 8.0), 1)
        lat = round(node["base_latency"] + random.uniform(15.0, 65.0), 1)
        loss = round(min(100.0, node["base_loss"] + random.uniform(2.5, 9.8)), 2)
        
        comm_status = "CRITICAL" if loss > 12.0 else "DEGRADED" if loss > 7.0 else "STABLE"
        node_status = "FAILOVER" if battery < 20.0 else "WARNING" if battery < 40.0 else "ACTIVE"

        rows.append([
            node["id"], timestamp, depth, temp, press, battery, sig, lat, loss, comm_status, node_status
        ])
        
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(HEADERS)
        writer.writerows(rows)
    print(f"Generated deep sea stress dataset: {filepath} ({len(rows)} records)")

if __name__ == "__main__":
    generate_primary_dataset("data/spark-datasets/marislink_underwater_telemetry_primary.csv", 150)
    generate_anomalous_dataset("data/spark-datasets/marislink_telemetry_with_anomalies.csv", 180, 24)
    generate_deep_sea_stress_dataset("data/spark-datasets/marislink_deep_sea_stress_test.csv", 300)
