#!/usr/bin/env python3
import csv
from datetime import datetime, timedelta

HEADERS = [
    "node_id", "timestamp", "depth_m", "temperature_c", "pressure_mpa",
    "battery_level", "signal_strength", "latency_ms", "packet_loss",
    "communication_status", "node_status"
]

rows = []
base_time = datetime(2026, 11, 5, 14, 0, 0)

# 1. 40 Clean unique records
nodes_config = [
    ("NODE-X99", 2500.0, 2.5, 25.1, 75.0, -82.0, 345.0, 7.5, "DEGRADED", "ACTIVE"),
    ("NODE-Y88", 120.0, 18.2, 1.2, 92.0, -48.0, 55.0, 0.8, "OPTIMAL", "ACTIVE"),
    ("GATEWAY-Z77", 10.0, 22.0, 0.1, 98.0, -38.0, 18.0, 0.2, "OPTIMAL", "ACTIVE"),
    ("HYDROPHONE-K1", 1600.0, 3.8, 16.2, 84.0, -71.0, 188.0, 4.2, "STABLE", "ACTIVE"),
]

for i in range(40):
    cfg = nodes_config[i % len(nodes_config)]
    t = (base_time + timedelta(seconds=i * 30)).strftime("%Y-%m-%d %H:%M:%S")
    rows.append([
        cfg[0], t, cfg[1] + (i * 0.1), cfg[2], cfg[3], cfg[4] - (i * 0.1),
        cfg[5], cfg[6] + (i * 0.2), cfg[7], cfg[8], cfg[9]
    ])

# 2. 5 Exact duplicate records (same node_id and timestamp as existing rows)
for j in range(5):
    rows.append(list(rows[j]))

# 3. 5 Invalid / missing anomaly records
rows.append(["", "2026-11-05 14:30:00", 100.0, 20.0, 1.0, 80.0, -50.0, 50.0, 1.0, "INVALID", "ERROR"]) # missing node_id
rows.append(["NODE-X99", "2026-11-05 14:30:30", -200.0, 2.5, 25.0, 70.0, -80.0, 300.0, 5.0, "INVALID", "ERROR"]) # negative depth
rows.append(["NODE-Y88", "2026-11-05 14:31:00", 120.0, 18.0, 1.2, 140.0, -48.0, 55.0, 1.0, "INVALID", "ERROR"]) # battery > 100
rows.append(["GATEWAY-Z77", "2026-11-05 14:31:30", 10.0, 22.0, 0.1, -10.0, -38.0, 18.0, 0.2, "INVALID", "ERROR"]) # negative battery
rows.append(["HYDROPHONE-K1", "2026-11-05 14:32:00", 1600.0, 3.8, 16.2, 80.0, -70.0, -50.0, 4.0, "INVALID", "ERROR"]) # negative latency

with open("data/spark-datasets/marislink_verification_second_dataset.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(HEADERS)
    writer.writerows(rows)

print(f"Generated second verification dataset: 50 total records (40 clean, 5 duplicates, 5 anomalies)")
