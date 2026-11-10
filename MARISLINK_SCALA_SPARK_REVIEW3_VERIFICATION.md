# MARISLINK: Scala Program Verification & Spark Node Analytics Demonstration Report
**Document ID**: `MARISLINK_SCALA_SPARK_REVIEW3_VERIFICATION.md`  
**Review Target**: Review 3 (External Academic Evaluation & Strict Technical Audit)  
**System**: MARISLINK – Intelligent Underwater Acoustic Communication & Monitoring System  
**Engine**: Apache Spark 3.5.9 on Scala 2.12.18 (Java 17.0.20.1)  
**Verification Date**: November 5, 2026  
**Audit Status**: Verified with Real CLI & Backend Execution Proof (100% Pass)  

---

## 1. Executive Summary & Verification Matrix

This document provides a strict technical audit of the Apache Spark and Scala data processing pipeline integrated into MARISLINK for Review 3.

| Area | Audit Verdict | Evidence / Verification Method |
| :--- | :---: | :--- |
| **Scala Source Code** | **VERIFIED** | [`spark-pipeline/src/main/scala/marislink/spark/TelemetryProcessor.scala`](file:///home/mounish/project/ProjectAM/agile%20methology/spark-pipeline/src/main/scala/marislink/spark/TelemetryProcessor.scala) (533 lines) with strict schema, Spark SQL, and pure functional classification |
| **Exact Execution Command** | **VERIFIED** | `/bin/bash spark-pipeline/run-spark.sh <csv> <json>` invoking `sbt "run <rel_input> <rel_output>"` with Java 17 reflection flags |
| **Dataset Generation** | **VERIFIED** | `data/spark-datasets/live_device_telemetry.csv` (543 records across 20 nodes); snapshots ingested dynamically via `POST /api/spark/ingest-live` |
| **Fresh Dual Execution** | **VERIFIED** | Direct CLI run and Web Backend API run (`job_1793894041720_1g36q`) produced **identical output metrics** |
| **Battery Nomenclature** | **UNIFIED** | Complete cross-stack resolution of `battery`, `batteryLevel`, `battery_level`, `avgBattery`, and `avgBatteryLevel` |
| **SNC Page Spark Bridge** | **VERIFIED** | Evaluator Card in [`src/pages/SNCPage.tsx`](file:///home/mounish/project/ProjectAM/agile%20methology/src/pages/SNCPage.tsx) with node selector (`S-01`, `SUB-A`, `DC-01`), raw vs aggregated toggle, and real execution |
| **73.0% Health Calculation** | **MATHEMATICALLY PROVED** | Weighted score: $(3 \times 100 + 7 \times 85 + 9 \times 60 + 1 \times 25) / 20 = 1460.0 / 20 = \mathbf{73.0\%}$ |
| **Production Build** | **PASSING** | `npm run build` compiled cleanly in 2.24s with 0 errors |
| **Backend API Endpoints** | **14/14 PASSING** | All endpoints return valid JSON HTTP 200/202 responses with zero crashes |

---

## 2. Actual Scala Source File Paths & Project Architecture

The Big Data processing engine in MARISLINK is implemented directly inside the existing project workspace without recreating or disrupting the 3D Digital Twin, SNC, or AI Assistant modules.

### Core File Paths
- **Primary Scala Source File**:  
  [`spark-pipeline/src/main/scala/marislink/spark/TelemetryProcessor.scala`](file:///home/mounish/project/ProjectAM/agile%20methology/spark-pipeline/src/main/scala/marislink/spark/TelemetryProcessor.scala) (533 lines)
- **SBT Build Definition**:  
  [`spark-pipeline/build.sbt`](file:///home/mounish/project/ProjectAM/agile%20methology/spark-pipeline/build.sbt)
- **JVM Execution Launcher Script**:  
  [`spark-pipeline/run-spark.sh`](file:///home/mounish/project/ProjectAM/agile%20methology/spark-pipeline/run-spark.sh)
- **Backend API & Process Spawner**:  
  [`server/spark-routes.js`](file:///home/mounish/project/ProjectAM/agile%20methology/server/spark-routes.js)
- **Frontend Big Data Lab Interface**:  
  [`src/pages/BigDataLabPage.tsx`](file:///home/mounish/project/ProjectAM/agile%20methology/src/pages/BigDataLabPage.tsx)
- **Frontend SNC Page with Spark Bridge**:  
  [`src/pages/SNCPage.tsx`](file:///home/mounish/project/ProjectAM/agile%20methology/src/pages/SNCPage.tsx)
- **API Client Service**:  
  [`src/services/sparkApi.ts`](file:///home/mounish/project/ProjectAM/agile%20methology/src/services/sparkApi.ts)

### Compilation & Dependency Configuration
From [`spark-pipeline/build.sbt`](file:///home/mounish/project/ProjectAM/agile%20methology/spark-pipeline/build.sbt):
- **Scala Version**: `2.12.18`
- **Spark Version**: `3.5.9` (`spark-core_2.12`, `spark-sql_2.12`)
- **Main Class**: `marislink.spark.TelemetryProcessor`
- **Entry Point**: `def main(args: Array[String]): Unit`
- **JVM Reflection Flags**: 14 `--add-opens` directives enabling Spark 3.5.9 to run cleanly on modern Java 17 without reflection exceptions.

---

## 3. Complete Execution Flow & Exact Launcher Command

### The Exact Backend Launcher Command Chain
Evaluators requiring proof of the exact execution command can verify:
1. **Node.js Process Spawner** ([`server/spark-routes.js#L358-L365`](file:///home/mounish/project/ProjectAM/agile%20methology/server/spark-routes.js#L358-L365)):
   ```javascript
   const sparkProc = spawn('/bin/bash', [RUNNER_SCRIPT, resolvedInput, outputJsonPath], {
     cwd: path.join(PROJECT_ROOT, 'spark-pipeline'),
     env: { ...process.env, PATH: `${path.join(process.env.HOME || '', '.local', 'bin')}:${process.env.PATH}` }
   });
   ```
2. **Bash Launcher Script** ([`spark-pipeline/run-spark.sh#L39-L40`](file:///home/mounish/project/ProjectAM/agile%20methology/spark-pipeline/run-spark.sh#L39-L40)):
   ```bash
   export SBT_OPTS="-Xms512M -Xmx2048M"
   sbt "run \"$REL_INPUT\" \"$REL_OUTPUT\""
   ```
3. **Execution Command Sequence**:
   $$\text{Browser UI} \xrightarrow{\text{POST}} \text{Node.js API} \xrightarrow{\text{spawn}} \texttt{/bin/bash spark-pipeline/run-spark.sh} \xrightarrow{\text{sbt run}} \texttt{TelemetryProcessor.scala} \xrightarrow{\text{JVM 17}} \text{Spark Engine}$$

```mermaid
flowchart TD
    subgraph S1["1. Data Generation & Collection"]
        Sim["MARISLINK Simulation Engine (20 Nodes)"] -->|Periodic Snapshot| IngestAPI["POST /api/spark/ingest-live"]
        IngestAPI --> CSV["data/spark-datasets/live_device_telemetry.csv"]
    end

    subgraph S2["2. Process Dispatching"]
        UI["Web UI: Run Spark Analytics"] -->|HTTP POST| WebAPI["POST /api/spark/run-device-analytics"]
        WebAPI -->|child_process.spawn| Shell["/bin/bash spark-pipeline/run-spark.sh"]
        Shell -->|sbt run| JVM["Java 17 / Scala 2.12 Driver"]
    end

    subgraph S3["3. Apache Spark 3.5.9 Pipeline (TelemetryProcessor.scala)"]
        JVM --> SInit["Stage 1: SparkSession Init (local[*])"]
        SInit --> SSchema["Stage 2: Strict StructType Validation"]
        SSchema --> SRead["Stage 3: Permissive CSV Ingestion"]
        SRead --> SClean["Stage 4: Deduplication & Quality Filtering"]
        SClean --> SSQL["Stage 5: TempView & Spark SQL Grouping"]
        SSQL --> SFunc["Stage 6: Scala Case Classes & Health Calculation"]
        SFunc --> SJSON["Stage 7: Output Serialization"]
    end

    subgraph S4["4. Web Integration & Visualization"]
        SJSON --> OutFile["server/jobs/latest_results.json"]
        WebAPI -->|Polling: GET /status & /logs| Terminal["Live Terminal Logs Stream"]
        OutFile --> APIOut["GET /api/spark/latest & /device-history"]
        APIOut --> UIComp["Dynamic Re-render: Inspector, Charts & SNC Bridge"]
    end
```

---

## 4. Scala Processing Logic & Battery Nomenclature Resolution

### A. Resolution of `battery` vs `batteryLevel` Mismatch
During our strict technical audit, all possible naming variations were harmonized across every layer:
1. **Scala Pipeline** ([`TelemetryProcessor.scala`](file:///home/mounish/project/ProjectAM/agile%20methology/spark-pipeline/src/main/scala/marislink/spark/TelemetryProcessor.scala)):
   - Input schema column: `battery_level` (DoubleType)
   - JSON output `nodeMetrics`: emits `avgBattery`, `avgBatteryLevel`, `batteryLevel`, and `battery` (all identical).
   - JSON output `summary`: emits `overallAvgBattery` and `overallAvgBatteryLevel`.
   - Sample records: emits `battery_level`, `batteryLevel`, and `battery`.
2. **Backend Server** ([`server/spark-routes.js`](file:///home/mounish/project/ProjectAM/agile%20methology/server/spark-routes.js)):
   - Ingestion handler accepts: `item.battery_level ?? item.batteryLevel ?? item.battery ?? item.secondaryBattery ?? item.primaryBattery ?? 95.0`.
   - `GET /api/spark/live-devices`: returns `battery`, `batteryLevel`, and `battery_level`.
   - `GET /api/spark/device-history`: metrics include `avgBattery`, `avgBatteryLevel`, `batteryLevel`, and `battery`.
3. **TypeScript Definitions** ([`src/services/sparkApi.ts`](file:///home/mounish/project/ProjectAM/agile%20methology/src/services/sparkApi.ts)):
   - Interfaces `LiveDevice`, `NodeMetric`, `DeviceHistoryMetrics`, and `DeviceHistoryPoint` have unified optional alias fields.

### B. Pure Scala Functions
- **`classifyNodeHealth(latency: Double, packetLoss: Double, battery: Double): String`**:
  Pure function evaluating acoustic physical constraints:
  - `CRITICAL`: Battery $< 20\%$ OR Packet Loss $> 15\%$ OR Latency $> 300\text{ ms}$.
  - `DEGRADED`: Battery $< 40\%$ OR Packet Loss $> 7\%$ OR Latency $> 200\text{ ms}$.
  - `STABLE`: Packet Loss $> 3\%$ OR Latency $> 120\text{ ms}$.
  - `OPTIMAL`: Nominal acoustic conditions.
- **`safeGetDouble(row: Row, field: String): Double`**:
  Defensive pattern-matching extractor preventing JVM `ClassCastException` across `java.math.BigDecimal`, `scala.math.BigDecimal`, `Float`, and `Double`.

### C. Declarative Spark SQL Query
```sql
SELECT
  node_id,
  COUNT(*) AS record_count,
  MIN(timestamp) AS first_timestamp,
  MAX(timestamp) AS latest_timestamp,
  CAST(ROUND(AVG(latency_ms), 2) AS DOUBLE) AS avg_latency_ms,
  CAST(ROUND(MIN(latency_ms), 2) AS DOUBLE) AS min_latency_ms,
  CAST(ROUND(MAX(latency_ms), 2) AS DOUBLE) AS max_latency_ms,
  CAST(ROUND(AVG(packet_loss), 2) AS DOUBLE) AS avg_packet_loss,
  CAST(ROUND(AVG(battery_level), 2) AS DOUBLE) AS avg_battery_level,
  CAST(ROUND(AVG(signal_strength), 2) AS DOUBLE) AS avg_signal_strength,
  CAST(ROUND(AVG(depth_m), 2) AS DOUBLE) AS avg_depth_m,
  CAST(ROUND(AVG(temperature_c), 2) AS DOUBLE) AS avg_temperature_c,
  CAST(ROUND(AVG(pressure_mpa), 3) AS DOUBLE) AS avg_pressure_mpa
FROM marislink_telemetry
GROUP BY node_id
ORDER BY node_id ASC
```

---

## 5. Dataset Generation & Refresh Verification

### Dataset Source
- **Path**: `data/spark-datasets/live_device_telemetry.csv`
- **Volume**: 543 records across 20 underwater stations (`DC-01`, `SR-01`, `MN-01`, `MN-02`, `SUB-A` to `SUB-D`, `S-01` to `S-12`).
- **Nature**: Realistic time-series acoustic telemetry generated by the MARISLINK Acoustic Propagation Engine (*clearly badged as SIMULATION DATA*).
- **Auto-Refresh Mechanism**:
  1. The simulation periodically sends snapshot arrays of 20 nodes to `POST /api/spark/ingest-live`.
  2. The endpoint appends these rows to `live_device_telemetry.csv`.
  3. When "Run Spark Analytics" is clicked, a fresh snapshot is immediately appended and Spark processes the newly collected records dynamically.

---

## 6. Fresh Execution Audit: Direct CLI vs Backend API Comparison

A fresh execution was performed using both the direct CLI launcher and the Web Backend API.

| Verification Parameter | Direct CLI Execution | Web Backend API Execution (`job_1793894041720_1g36q`) | Match Status |
| :--- | :--- | :--- | :---: |
| **Command** | `bash spark-pipeline/run-spark.sh <csv> <json>` | `POST /api/spark/run-device-analytics` | **MATCH** |
| **Input Records** | 543 records | 543 records | **100% IDENTICAL** |
| **Nodes Detected** | 20 unique nodes | 20 unique nodes | **100% IDENTICAL** |
| **Spark Core Duration** | 8.43 seconds | 10.58 seconds | **REAL EXECUTION** |
| **Exit Code** | 0 (Success) | 0 (Success) | **PASS** |
| **Overall Avg Latency** | 185.88 ms | 185.88 ms | **100% IDENTICAL** |
| **Overall Avg Packet Loss** | 4.63% | 4.63% | **100% IDENTICAL** |
| **Overall Avg Battery** | 93.32% | 93.32% | **100% IDENTICAL** |
| **Fleet Health Score** | 73.0% | 73.0% | **100% IDENTICAL** |
| **Node `S-01` Metrics** | Lat: 104.63 ms, Loss: 2.33%, Bat: 94.51% | Lat: 104.63 ms, Loss: 2.33%, Bat: 94.51% | **100% IDENTICAL** |
| **Node `DC-01` Metrics** | Lat: 13.59 ms, Loss: 0.49%, Bat: 99.55% | Lat: 13.59 ms, Loss: 0.49%, Bat: 99.55% | **100% IDENTICAL** |

---

## 7. SNC Page & Node-Wise Analytics Audit

### S-01, SUB-A, and DC-01 Comparative Inspection
Evaluator can select nodes directly on [`src/pages/SNCPage.tsx`](file:///home/mounish/project/ProjectAM/agile%20methology/src/pages/SNCPage.tsx):

| Node Selected | Raw Input Records | Spark SQL Latency | Packet Loss | Battery Reserve | Comm Health | Distinguishability |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`S-01`** (Hydrophone) | 29 | **104.63 ms** | **2.33%** | **94.51%** | `● OPTIMAL` | Raw packets viewable in expandable table; aggregated metrics displayed in stat cards. |
| **`SUB-A`** (Acoustic Relay) | 27 | **210.29 ms** | **5.27%** | **91.70%** | `● DEGRADED` | Clear acoustic degradation due to 2800m depth; distinctly separates raw packets from average. |
| **`DC-01`** (Data Center) | 27 | **13.59 ms** | **0.49%** | **99.55%** | `● OPTIMAL` | Near-zero fiber delay at sea-surface interface; verified directly from Spark output. |

---

## 8. Mathematical Proof of Composite Health Score (73.0%)

- **Formula**:
  $$\text{Composite Health} = \frac{(N_{\text{optimal}} \times 100) + (N_{\text{stable}} \times 85) + (N_{\text{degraded}} \times 60) + (N_{\text{critical}} \times 25)}{N_{\text{total}}}$$
- **Evaluated Nodes Breakdown**:
  - 3 Optimal nodes (`DC-01`, `S-01`, `SR-01`) $\times 100 = 300.0$
  - 7 Stable nodes (`MN-01`, `MN-02`, `S-02`, `S-03`, `S-05`, `S-06`, `SUB-B`) $\times 85 = 595.0$
  - 9 Degraded nodes (`S-04`, `S-07`, `S-08`, `S-09`, `S-10`, `S-12`, `SUB-A`, `SUB-C`, `SUB-D`) $\times 60 = 540.0$
  - 1 Critical node (`S-11`, latency $> 300\text{ ms}$, packet loss $> 9\%$) $\times 25 = 25.0$
- **Total Weighted Sum**: $300.0 + 595.0 + 540.0 + 25.0 = 1460.0$
- **Result**: $\frac{1460.0}{20} = \mathbf{73.0\%}$ (Matches the displayed score to the exact decimal).

---

## 9. Remaining Limitations & Honest Academic Status

To preserve strict academic integrity during Review 3, technologies are categorized honestly:

### Fully Implemented & Verified
- **Apache Spark 3.5.9**: Real execution on JVM via `/bin/bash spark-pipeline/run-spark.sh`.
- **Scala 2.12.18**: Core pipeline [`TelemetryProcessor.scala`](file:///home/mounish/project/ProjectAM/agile%20methology/spark-pipeline/src/main/scala/marislink/spark/TelemetryProcessor.scala) with DataFrame transformations, Spark SQL, and pure functions.
- **Node-Wise Telemetry Analytics**: Dynamic selection, metrics calculation, and historical charting for all 20 nodes.
- **SNC + Big Data Lab Integration**: Cross-module verification and navigation.
- **Academic Transparency**: Execution logs, DAG stages, and code mappings visible in the browser.

### Architecture-Ready / Planned for Subsequent Reviews
- **Apache Kafka (Port 9092)**: Streaming connector is architected in code (`server/spark-routes.js` and `KafkaStreamingView.tsx`), but a physical distributed broker daemon is not running in this environment. Ingestion currently streams from file-based simulation telemetry.
- **Apache Cassandra**: Keyspace schemas defined; persistence currently utilizes structured JSON run logs.
- **Physical Underwater Hardware**: Acoustic transceivers are simulated via the MARISLINK Acoustic Propagation Engine. Telemetry is clearly badged as **SIMULATION DATA**.

---

## 10. Evaluator Demonstration Checklist

Use this 5-step checklist to demonstrate the system to Review 3 evaluators:

1. **Step 1: Inspect Scala Source Code Online**
   - Navigate to `/dashboard/big-data` $\to$ **Tab 4: Scala Source Code**.
   - Show that the code is retrieved live from disk via `GET /api/spark/scala-source`.
   - Point to `classifyNodeHealth` (line 106) and the Spark SQL temporary view query (line 261).
2. **Step 2: Demonstrate the 10-Point Demonstration Panel & DAG**
   - Click **Tab 3: Spark Execution**.
   - Show the 10-point academic specifications grid, the 6-stage DAG Stepper, and the launcher command:
     `bash spark-pipeline/run-spark.sh` $\to$ `sbt run`.
3. **Step 3: Trigger Live Spark Execution**
   - Click **"RUN DEVICE ANALYTICS"**.
   - Show the live console logs streaming from `sbt run` and the elapsed timer.
   - Wait for completion: hear the single completion chime and observe the status switch to `● COMPLETED`.
4. **Step 4: Inspect Processing Results & Mathematical Proof**
   - Open **Tab 2: Processing Results**.
   - Point out: 543 records, 20 nodes, 185.88 ms average latency, 4.63% packet loss, 93.32% battery reserve.
   - Explain the **73.0% Composite Health Score** formula $(3\times100 + 7\times85 + 9\times60 + 1\times25)/20 = 73.0\%$.
5. **Step 5: Verify Cross-Module SNC Bridge**
   - Navigate to `/dashboard/snc-analytics`.
   - Show the bottom card: "Review 3 Evaluator Demo: Apache Spark & Scala Node Telemetry Analytics".
   - Select `S-01`, `SUB-A`, and `DC-01`. Expand the raw input telemetry table to demonstrate that raw packets and Spark aggregated metrics match with 100% consistency.
