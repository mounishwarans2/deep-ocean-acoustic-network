#!/usr/bin/env python3
"""
MARISLINK: Underwater Acoustic Telemetry Kafka Producer
Transmits simulated hydrophone, CTD, and acoustic modem packets to Kafka topic.
"""

import json
import time
import random
from datetime import datetime

TOPIC_NAME = "marislink.underwater.telemetry.v1"
BOOTSTRAP_SERVERS = "localhost:9092"

NODES = ["DC-01", "SR-01", "MN-01", "MN-02", "SUB-A", "SUB-B", "SUB-C", "SUB-D", "S-01", "S-02", "S-03", "S-04"]

def generate_telemetry_packet(node_id):
    return {
        "node_id": node_id,
        "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "depth_m": round(random.uniform(50.0, 3200.0), 2),
        "temperature_c": round(random.uniform(1.8, 24.5), 2),
        "pressure_mpa": round(random.uniform(0.5, 32.5), 3),
        "battery_level": round(random.uniform(45.0, 98.0), 1),
        "signal_strength": round(random.uniform(-88.0, -42.0), 1),
        "latency_ms": round(random.uniform(25.0, 240.0), 1),
        "packet_loss": round(random.uniform(0.5, 8.5), 2),
        "communication_status": random.choice(["OPTIMAL", "STABLE", "DEGRADED"]),
        "node_status": "ACTIVE"
    }

def run_producer(messages=10):
    print(f"[KAFKA PRODUCER] Connecting to broker at {BOOTSTRAP_SERVERS}...")
    print(f"[KAFKA PRODUCER] Target Topic: {TOPIC_NAME}")
    
    try:
        from kafka import KafkaProducer
        producer = KafkaProducer(
            bootstrap_servers=[BOOTSTRAP_SERVERS],
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8')
        )
        print("[KAFKA PRODUCER] Successfully connected to live Kafka broker.")
        for i in range(messages):
            node = random.choice(NODES)
            packet = generate_telemetry_packet(node)
            producer.send(TOPIC_NAME, key=node, value=packet)
            print(f"[{i+1}/{messages}] Published to {TOPIC_NAME} key={node}: {packet}")
            time.sleep(0.5)
        producer.flush()
    except Exception as e:
        print(f"[KAFKA PRODUCER - SIMULATION MODE] Kafka broker unavailable ({e}).")
        print("[KAFKA PRODUCER - SIMULATION MODE] Emitting telemetry stream payload for demonstration:")
        for i in range(messages):
            node = random.choice(NODES)
            packet = generate_telemetry_packet(node)
            print(f" -> Telemetry Event [{i+1}] Partition={hash(node)%3}: {json.dumps(packet)}")
            time.sleep(0.2)

if __name__ == "__main__":
    run_producer(5)
