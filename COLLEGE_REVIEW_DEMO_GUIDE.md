# MARISLINK: College External Review Demonstration Guide
## Real Apache Spark & Scala Big Data Implementation

This guide provides a structured, step-by-step walkthrough to present the **Big Data Processing & Analytics Lab** to your college review evaluator.

---

### PRESENTATION OUTLINE (5–7 MINUTES)

| Step | Action | Key Explanation for Evaluator |
| :--- | :--- | :--- |
| **1. Context & Problem** | Open MARISLINK Dashboard | *"In UASNs (Underwater Acoustic Sensor Networks), communication latency is high and channel errors are frequent. We implemented a real Apache Spark & Scala pipeline to process multi-node telemetry and calculate network health indices."* |
| **2. Navigate to Lab** | Click **⚡ Big Data Lab** on top nav bar | *"Previously, our Big Data section contained theoretical explanations. Now, it is a fully functioning Big Data Lab running real Apache Spark 3.5.9 on the JVM."* |
| **3. Dataset Selection** | Tab 1: Dataset Management | Show pre-configured datasets (`marislink_underwater_telemetry_primary.csv` or `marislink_telemetry_with_anomalies.csv`) or upload a CSV. Point out dataset preview, record count, and column validation. |
| **4. Explain Scala Code** | Tab 2: Scala Source Code | *"Here is our actual Scala source file `TelemetryProcessor.scala`. It demonstrates `val`/`var`, `SparkSession`, `StructType` schema, lazy evaluation transformations vs actions, and Spark SQL."* |
| **5. Execute Spark DAG** | Tab 3: Spark Execution | Click **RUN SPARK ANALYSIS**. Show the live terminal log streaming directly from the Spark JVM on the server. Point out `INFO SparkContext`, memory allocation, DAG scheduler, and execution timer. When finished, a single clean completion chime/beep sound alerts the room that Spark execution has completed! |
| **6. View Spark Results** | Tab 4: Processing Results | Show computed results: Total input records, valid records retained, invalid anomalies filtered, and the node-wise aggregated metrics table (latency, loss, battery, signal). |
| **7. Analytics Visuals** | Tab 5: Analytics Dashboard | Show node-wise latency comparison charts, packet loss bars, and battery monitoring. Expand the Raw JSON payload to show the machine-readable Spark output. |
| **8. Kafka & Cassandra** | Tabs 6 & 7 | Transparently explain Stage 6 (Kafka streaming topic & consumer) and Stage 7 (Cassandra NoSQL CQL schema and partitioning strategy). |

---

### DEMONSTRATION WALKTHROUGH

#### Step 1: Start Both Servers Before Presentation
Ensure both backend and frontend are running:
```bash
# Terminal 1 - Backend Server
cd "/home/mounish/project/ProjectAM/agile methology"
npm run server

# Terminal 2 - Frontend App
cd "/home/mounish/project/ProjectAM/agile methology"
npm run dev
```
Open browser to `http://localhost:5173/dashboard`.

#### Step 2: Demonstrate Fault Filtering (Evaluator Favorite!)
1. Go to **⚡ Big Data Lab** -> **Tab 1: Dataset Management**.
2. Select **"Ocean Channel Anomalies & Fault-Testing Dataset"** (`marislink_telemetry_with_anomalies.csv`).
3. Explain to the evaluator:
   > *"This dataset has 180 records, including corrupted depths, negative battery percentages, and impossible packet losses to prove Spark does real validation and filtering."*
4. Click **Tab 3: Spark Execution** -> click **RUN SPARK ANALYSIS**.
5. Watch the live terminal console stream from the Spark driver:
   - Notice: `[SPARK ACTION] Total Raw Records Ingested: 180`
   - Notice: `[DATA QUALITY] Valid Records Retained: 157`
   - Notice: `[DATA QUALITY] Invalid Records Filtered: 23`
6. Click **Tab 4: Processing Results**:
   - Point out the red table showing rejected rows and exact reasons: *"Failed ocean telemetry constraint bounds"*.
   - Point out the node summary table grouped by `MN-01`, `SUB-A`, `SUB-B`, `SR-01`, etc.

#### Step 3: Demonstrate Scala Code
1. Click **Tab 2: Scala Source Code**.
2. Explain the 6 key concepts using the cards on screen:
   - **SparkSession**: Created with `local[*]` to utilize all CPU cores.
   - **Schema**: Enforced via `StructType` and `StructField` rather than inferring blindly.
   - **Lazy Transformations**: `.filter()` and `.groupBy()` create execution DAGs; computation only starts when `.count()` or `.collect()` is called.
   - **Spark SQL**: Registered temporary view `marislink_telemetry` and executed declarative SQL queries with `ROUND(AVG(...), 2)`.
   - **Functional Programming**: Transformed Spark rows into Scala case classes using `.map` and aggregated network averages using `.sum` / `foldLeft`.

#### Step 4: Prove It Is Not Fake / JavaScript
If the evaluator asks: *"How do I know this is real Spark and not a JavaScript simulation?"*
1. **Show the live terminal**: The terminal shows the real Spark JVM process starting up (`org.apache.spark.SparkContext`, `JettyUtils: Start Jetty 0.0.0.0:4040 for SparkUI`, `NettyBlockTransferService`).
2. **Show the file on disk**: Open `server/jobs/latest_results.json` or run from terminal:
   ```bash
   ./spark-pipeline/run-spark.sh data/spark-datasets/marislink_underwater_telemetry_primary.csv
   ```
3. **Upload a new CSV**: Upload any custom CSV with different numbers, and Spark will instantly calculate the exact numbers from that file.

---

### ANSWERS TO COMMON EVALUATOR QUESTIONS

**Q1: What version of Spark and Scala did you use?**
> *"We used Apache Spark 3.5.9 with Scala 2.12.18 running on OpenJDK 17. On Java 17, Spark requires `--add-opens` flags for direct memory access, which we configured in `build.sbt`."*

**Q2: What is the difference between a transformation and an action in your code?**
> *"Transformations like `.filter(validFilterCondition)` and `.groupBy("node_id")` are lazy—they merely build the logical execution plan. Actions like `.count()`, `.collect()`, and `.show()` trigger the DAG scheduler and execute tasks across the worker threads."*

**Q3: Why use Scala instead of Python (PySpark)?**
> *"Scala is the native language in which Apache Spark is written. Scala case classes provide compile-time type safety, eliminate JVM-Python IPC serialization overhead, and allow functional programming with immutable data structures."*

**Q4: How does Kafka and Cassandra fit into this architecture?**
> *"Kafka serves as the high-throughput ingest layer for continuous acoustic modem packets. Spark consumes from Kafka in streaming micro-batches, and Cassandra stores the aggregated historical time-series metrics partitioned by `node_id` with clustering order `batch_time DESC`."*
