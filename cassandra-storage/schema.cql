-- ============================================================================
-- MARISLINK: Apache Cassandra NoSQL Schema Definition
-- Keyspace & Tables for High-Throughput Underwater Telemetry Analytics
-- ============================================================================

-- 1. Create Keyspace with SimpleStrategy for Local / Single-DataCenter deployment
CREATE KEYSPACE IF NOT EXISTS marislink_ocean_telemetry
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};

-- 2. Create Table for Spark Aggregated Node Telemetry Metrics
-- Partition Key: node_id (groups all records for a specific underwater node together)
-- Clustering Key: batch_time DESC (orders time-series data chronologically for fast retrieval)
CREATE TABLE IF NOT EXISTS marislink_ocean_telemetry.node_processed_metrics (
  node_id text,
  batch_time timestamp,
  record_count bigint,
  avg_latency_ms double,
  min_latency_ms double,
  max_latency_ms double,
  avg_packet_loss double,
  avg_battery_level double,
  avg_signal_strength double,
  avg_depth_meters double,
  health_classification text,
  PRIMARY KEY ((node_id), batch_time)
) WITH CLUSTERING ORDER BY (batch_time DESC);

-- 3. Create Table for Raw Sensor Telemetry Events
CREATE TABLE IF NOT EXISTS marislink_ocean_telemetry.raw_telemetry_events (
  node_id text,
  event_time timestamp,
  depth_m double,
  temperature_c double,
  pressure_mpa double,
  battery_level double,
  signal_strength double,
  latency_ms double,
  packet_loss double,
  communication_status text,
  node_status text,
  PRIMARY KEY ((node_id), event_time)
) WITH CLUSTERING ORDER BY (event_time DESC);

-- 4. Sample Demonstration Queries
-- Query latest aggregated metrics for gateway node MN-01
SELECT * FROM marislink_ocean_telemetry.node_processed_metrics
WHERE node_id = 'MN-01'
LIMIT 5;

-- Query recent events for seafloor hub SUB-C
SELECT * FROM marislink_ocean_telemetry.raw_telemetry_events
WHERE node_id = 'SUB-C'
LIMIT 10;
