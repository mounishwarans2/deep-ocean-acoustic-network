# MARISLINK: Big Data Processing & Analytics Engine
## Real Apache Spark & Scala Implementation Documentation

---

### 1. Executive Summary & Objective

In underwater acoustic sensor networks (UASNs), communication links suffer from severe multipath propagation, narrow acoustic bandwidth, and high propagation latency (~1500 m/s speed of sound in seawater). 

To solve academic review evaluations questioning theoretical-only big data sections, **MARISLINK** integrates a **real, working Apache Spark (v3.5.9) and Scala (v2.12.18)** distributed data-processing pipeline. The system ingests multi-node underwater acoustic telemetry, applies strict schema validation, executes distributed cleaning and Spark SQL analytical queries, calculates fleet-wide communication health indices, and presents real computed metrics directly on the web application.

---

### 2. Architecture Overview

```
                                  MARISLINK ARCHITECTURE
                                  
 [ Underwater Sensors ]
 (MN-01, SUB-A, S-01..)
        │
        ▼ (Acoustic Link)
 [ Surface Gateways ] ────────► [ CSV Telemetry / Uploads ]
 (SR-01, DC-01)                 │   (12 Nodes, Depth, Latency, Loss, Battery)
                                │
                                ▼
                       [ Node.js Backend ] (Express on Port 5000)
                       ├── POST /api/spark/upload
                       ├── GET  /api/spark/dataset-preview
                       ├── POST /api/spark/execute  (Asynchronous spawn)
                       ├── GET  /api/spark/status/:jobId (Polling)
                       ├── GET  /api/spark/logs/:jobId   (Real JVM stdout stream)
                       └── GET  /api/spark/scala-source  (Source reflection)
                                │
                                ▼ (Spawns / JVM Fork)
                  [ Apache Spark & Scala Engine ]
                  (marislink.spark.TelemetryProcessor)
                  ├── Stage 1: SparkSession Init (local[*], Java 17 add-opens)
                  ├── Stage 2: Schema Enforcement (StructType)
                  ├── Stage 3: CSV Ingestion (DataFrame API)
                  ├── Stage 4: Quality Filtering (.filter() lazy transformation)
                  ├── Stage 5: Spark SQL In-Memory Temp View ("marislink_telemetry")
                  ├── Stage 6: Scala Case Class Mapping (.map, foldLeft)
                  ├── Stage 7: Health Status Classification (Domain function)
                  └── Stage 8: Structured JSON Analytics Output Generation
                                │
                                ▼
                      [ React Frontend UI ]
              "BIG DATA PROCESSING & ANALYTICS LAB"
              ├── Tab 1: Dataset Management (Upload, Preview, Validation)
              ├── Tab 2: Scala Source Code (Live Code Viewer & Concept Breakdown)
              ├── Tab 3: Spark Execution ("RUN SPARK ANALYSIS", Live JVM Console)
              ├── Tab 4: Processing Results (8 KPIs, Grouped Node Table, Filtered Anomalies)
              ├── Tab 5: Analytics Dashboard (Latency, Packet Loss, Battery, Depth Charts)
              ├── Tab 6: Kafka Streaming (Topic Topology & Streaming Consumer Code)
              └── Tab 7: Cassandra Storage (NoSQL Keyspace, CQL Schema & Connector)
```

---

### 3. Dataset Format & Schema

The telemetry schema represents physical and acoustic parameters captured by deep-sea mooring buoys, acoustic relays, hydrophone arrays, and gateways:

| Column Name | Data Type | Physical Unit | Description & Realistic Bounds |
| :--- | :--- | :--- | :--- |
| `node_id` | String | Identifier | Unique network device ID (e.g., `MN-01`, `SUB-A`, `SR-01`). Must be non-empty. |
| `timestamp` | String / Timestamp | ISO UTC | Measurement timestamp (`YYYY-MM-DD HH:MM:SS`). |
| `depth_m` | Double | Meters | Ocean depth (0.0 m at surface to 3500.0 m in abyssal trenches). Must be >= 0.0. |
| `temperature_c` | Double | °C | Ocean ambient water temperature (-2.0°C to 30.0°C). |
| `pressure_mpa` | Double | MPa | Hydrostatic pressure (0.1 MPa at surface to 36.0 MPa at depth). |
| `battery_level` | Double | Percentage (%) | Remaining node battery reserve [0.0% to 100.0%]. |
| `signal_strength` | Double | dBm | Acoustic received power (-90.0 dBm to -35.0 dBm). |
| `latency_ms` | Double | Milliseconds | One-way acoustic travel + processing time (>= 0.0 ms). |
| `packet_loss` | Double | Percentage (%) | Packet error rate over acoustic link [0.0% to 100.0%]. |
| `communication_status` | String | Categorical | `OPTIMAL`, `STABLE`, `DEGRADED`, `CRITICAL`. |
| `node_status` | String | Categorical | `ACTIVE`, `WARNING`, `FAILOVER`. |

Pre-configured sample datasets located in `data/spark-datasets/`:
1. `marislink_underwater_telemetry_primary.csv` (150 records, clean nominal fleet telemetry).
2. `marislink_telemetry_with_anomalies.csv` (180 records, includes 23 intentional anomalies: negative depth, out-of-range battery, impossible packet loss, and null node IDs to demonstrate Spark distributed filtering).
3. `marislink_deep_sea_stress_test.csv` (300 records, high-latency deep-sea multipath conditions).

---

### 4. Scala Source Code & Spark Logic Walkthrough

Source File: `spark-pipeline/src/main/scala/marislink/spark/TelemetryProcessor.scala`

#### Key Academic Concepts Demonstrated:

1. **`val` vs `var` Separation**:
   - `val` creates immutable references (`val spark: SparkSession`, `val rawDf: DataFrame`, `val nodeAnalyticsList`).
   - `var` is isolated strictly to transient execution timers and progress counters (`var stageCounter: Int`).

2. **Case Classes**:
   - `case class UnderwaterReading(...)` enforces typed schemas on rows.
   - `case class NodeAnalytics(...)` models aggregated output per node.

3. **SparkSession Initialization**:
   ```scala
   val spark: SparkSession = SparkSession.builder()
     .appName("MARISLINK-Telemetry-Spark-Processor")
     .master("local[*]")
     .config("spark.sql.shuffle.partitions", "4")
     .getOrCreate()
   ```

4. **Strict Schema Definition**:
   ```scala
   val telemetrySchema = StructType(Array(
     StructField("node_id", StringType, nullable = true),
     StructField("timestamp", StringType, nullable = true),
     StructField("depth_m", DoubleType, nullable = true),
     StructField("battery_level", DoubleType, nullable = true),
     StructField("latency_ms", DoubleType, nullable = true),
     StructField("packet_loss", DoubleType, nullable = true), ...
   ))
   ```

5. **Transformations vs Actions (Lazy Evaluation)**:
   - **Transformations**: `rawDf.filter(...)`, `select(...)`, `groupBy(...)` build the Directed Acyclic Graph (DAG) without triggering physical data processing.
   - **Actions**: `rawDf.count()`, `aggregatedDf.collect()`, `df.show()` trigger distributed job scheduling across CPU worker cores.

6. **Spark SQL Engine**:
   - Cleaned DataFrame is registered as an in-memory SQL view:
     `cleanedDf.createOrReplaceTempView("marislink_telemetry")`
   - Executes grouped multi-metric aggregation:
     ```sql
     SELECT
       node_id,
       COUNT(*) AS record_count,
       ROUND(AVG(latency_ms), 2) AS avg_latency_ms,
       ROUND(MIN(latency_ms), 2) AS min_latency_ms,
       ROUND(MAX(latency_ms), 2) AS max_latency_ms,
       ROUND(AVG(packet_loss), 2) AS avg_packet_loss,
       ROUND(AVG(battery_level), 2) AS avg_battery_level,
       ROUND(AVG(signal_strength), 2) AS avg_signal_strength,
       ROUND(AVG(depth_m), 2) AS avg_depth_m
     FROM marislink_telemetry
     GROUP BY node_id
     ORDER BY node_id ASC
     ```

7. **Scala Functional Map, Filter & Reduce**:
   - Maps DataFrame rows to case classes:
     `val nodeAnalyticsList = collectedRows.map { row => ... }.toList`
   - Calculates fleet averages using Scala collection methods:
     `val overallAvgLatency = nodeAnalyticsList.map(_.avgLatencyMs).sum / totalNodesCount`

8. **Automated Machine-Readable JSON Export**:
   - Generates structured JSON payload (`latest_results.json`) consumed by backend REST APIs.

---

### 5. Prerequisites & Environment Setup

- **Operating System**: Linux / Ubuntu 22.04+ (or macOS / Windows WSL)
- **Java Virtual Machine**: OpenJDK 17 (`java -version`)
  - Spark 3.5.9 on Java 17 requires JVM `--add-opens` flags (pre-configured in `build.sbt` and `run-spark.sh`).
- **Scala Build Tool**: sbt 1.12.13 (wrapper script provided at `~/.local/bin/sbt`)
- **Node.js**: v20.x or later with `npm`
- **Apache Spark**: Spark 3.5.9 (`spark-core_2.12`, `spark-sql_2.12`) resolved via sbt/Ivy.

---

### 6. How to Run the Application

#### Step 1: Start the Backend Server (Express + Spark Orchestrator)
```bash
cd "/home/mounish/project/ProjectAM/agile methology"
npm run server
```
*Output: `[marislink-server] listening on http://localhost:5000`*

#### Step 2: Start the Frontend Application (Vite React)
```bash
cd "/home/mounish/project/ProjectAM/agile methology"
npm run dev
```
*Access the web application at `http://localhost:5173`.*

#### Step 3: Trigger Spark Execution via Web UI or Terminal
- **Via Web UI**: Navigate to **⚡ Big Data Lab** on the top navigation bar, select a dataset, and click **RUN SPARK ANALYSIS**.
- **Via Terminal (Direct CLI Execution)**:
  ```bash
  cd "/home/mounish/project/ProjectAM/agile methology"
  ./spark-pipeline/run-spark.sh data/spark-datasets/marislink_underwater_telemetry_primary.csv server/jobs/cli_test_results.json
  ```

---

### 7. Example Output from a Real Execution

Input: `data/spark-datasets/marislink_telemetry_with_anomalies.csv` (180 raw records)

```
================================================================================
 MARISLINK - APACHE SPARK & SCALA BIG DATA PROCESSING ENGINE
 Project: Intelligent Underwater Acoustic Communication & Monitoring
================================================================================
[CONFIG] Input Dataset : ../data/spark-datasets/marislink_telemetry_with_anomalies.csv
[CONFIG] Output Target : ../server/jobs/anomaly_results.json
[STAGE 1] Initializing Apache Spark Session...
[SPARK INFO] Spark Version: 3.5.9
[SPARK INFO] Execution Master: local[*]
[SPARK INFO] Default Parallelism: 12
[STAGE 2] Defining Strict Underwater Telemetry Schema...
[STAGE 3] Ingesting CSV dataset via Spark DataFrame API...
[SPARK ACTION] Total Raw Records Ingested: 180
[STAGE 4] Applying Distributed Filtering & Cleaning Rules...
[DATA QUALITY] Valid Records Retained   : 157
[DATA QUALITY] Invalid Records Filtered: 23
[DATA QUALITY] Sample Filtered Anomaly Records (First 5):
+---------------+-------+-------------+----------+-----------+
|node_id        |depth_m|battery_level|latency_ms|packet_loss|
+---------------+-------+-------------+----------+-----------+
|SUB-B          |NULL   |76.0         |200.0     |5.8        |
|S-01           |-450.0 |90.0         |95.0      |2.0        |
|DC-01          |0.0    |99.0         |NULL      |NULL       |
|CORRUPT_NODE_22|1000.0 |-99.0        |-1.0      |200.0      |
|CORRUPT_NODE_17|1000.0 |-99.0        |-1.0      |200.0      |
+---------------+-------+-------------+----------+-----------+
[STAGE 5] Registering In-Memory Temp View for Spark SQL...
[SPARK SQL] Executing Node-Wise Analytical Query:
+-------+------------+--------------+--------------+--------------+---------------+-----------------+-------------------+-----------+------------------+------------------+
|node_id|record_count|avg_latency_ms|min_latency_ms|max_latency_ms|avg_packet_loss|avg_battery_level|avg_signal_strength|avg_depth_m|avg_temperature_c|avg_pressure_mpa  |
+-------+------------+--------------+--------------+--------------+---------------+-----------------+-------------------+-----------+------------------+------------------+
|DC-01  |15          |15.22         |10.3          |21.8          |0.52           |89.41            |-37.45             |0.0        |25.1              |0.1               |
|MN-01  |14          |144.81        |137.2         |153.9         |3.81           |91.22            |-68.42             |2000.12    |3.12              |20.25             |
|MN-02  |13          |160.15        |152.0         |169.5         |4.33           |90.85            |-71.20             |1800.05    |3.45              |18.35             |
|SUB-A  |16          |212.44        |205.1         |221.7         |6.42           |90.15            |-78.15             |2800.10    |2.35              |28.55             |
|SUB-B  |12          |196.35        |189.5         |206.2         |6.01           |91.40            |-76.32             |2599.85    |2.52              |26.45             |
|SUB-C  |14          |248.10        |239.0         |256.4         |7.55           |89.90            |-82.60             |3200.25    |2.05              |32.70             |
|SUB-D  |12          |271.05        |262.1         |280.4         |8.25           |88.75            |-85.40             |3500.10    |1.72              |35.85             |
|SR-01  |11          |46.85         |40.1          |54.3          |1.45           |92.10            |-51.25             |2.45       |22.50             |0.135             |
|S-01   |13          |94.20         |87.3          |102.1         |2.65           |91.80            |-62.15             |850.15     |6.85              |8.70              |
|S-02   |12          |120.45        |112.5         |128.9         |3.25           |92.45            |-66.85             |1200.05    |5.20              |12.30             |
|S-03   |13          |184.20        |177.0         |193.5         |5.15           |90.60            |-74.50             |2400.15    |2.75              |24.50             |
|S-04   |12          |240.50        |232.0         |251.2         |8.10           |90.20            |-82.10             |3100.20    |25.10             |31.60             |
+-------+------------+--------------+--------------+--------------+---------------+-----------------+-------------------+-----------+------------------+------------------+
================================================================================
 SPARK PROCESSING COMPLETED SUCCESSFULLY IN 21.49 SECONDS
================================================================================
```

---

### 8. Kafka & Cassandra Integration Status

In accordance with strict verification and engineering transparency requirements:

- **Apache Kafka (Stage 6)**:
  - **Topic**: `marislink.underwater.telemetry.v1`
  - **Consumer Group**: `marislink-spark-consumer-group`
  - **Status**: **Architecture Ready / Broker Unreachable**.
  - **Details**: Full Python producer (`kafka-streaming/telemetry_producer.py`) and Scala Spark Structured Streaming consumer (`kafka-streaming/TelemetryKafkaStreamConsumer.scala`) are implemented. An interactive event simulator is embedded in the web UI. Once a local Kafka daemon is launched on port 9092, the pipeline is ready to stream without code changes.

- **Apache Cassandra (Stage 7)**:
  - **Keyspace**: `marislink_ocean_telemetry`
  - **Table**: `node_processed_metrics`
  - **Status**: **Schema & Connector Prepared / Cluster Unreachable**.
  - **Details**: The CQL DDL schema (`cassandra-storage/schema.cql`) and Scala Datastax Spark-Cassandra connector code (`cassandra-storage/CassandraPersistenceConnector.scala`) are fully written. Because Cassandra daemon is not active on this host, it is labeled transparently as pending cluster startup.

---

### 9. Known Limitations

1. **Local Mode (`master("local[*]")`)**: Spark runs in local multithreaded mode on the workstation CPU rather than a distributed multi-node YARN or Kubernetes cluster.
2. **Cold Start Time**: Launching the JVM and sbt takes approximately 18–25 seconds per job run.
3. **Kafka & Cassandra**: Require active daemon services to persist live streams beyond the provided simulations and pre-configured scripts.
