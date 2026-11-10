package marislink.spark

import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.functions._
import org.apache.spark.sql.types._

/**
 * MARISLINK: Apache Spark Structured Streaming Kafka Consumer
 * Consumes continuous telemetry packets from Kafka topic `marislink.underwater.telemetry.v1`
 * Computes 10-second tumbling window aggregations per underwater node.
 */
object TelemetryKafkaStreamConsumer {

  def main(args: Array[String]): Unit = {

    val spark = SparkSession.builder()
      .appName("MARISLINK-Kafka-Structured-Streaming")
      .master("local[*]")
      .getOrCreate()

    spark.sparkContext.setLogLevel("WARN")

    val telemetrySchema = new StructType()
      .add("node_id", StringType)
      .add("timestamp", StringType)
      .add("depth_m", DoubleType)
      .add("temperature_c", DoubleType)
      .add("pressure_mpa", DoubleType)
      .add("battery_level", DoubleType)
      .add("signal_strength", DoubleType)
      .add("latency_ms", DoubleType)
      .add("packet_loss", DoubleType)
      .add("communication_status", StringType)
      .add("node_status", StringType)

    // Ingest streaming data from Kafka
    val kafkaStreamDf = spark.readStream
      .format("kafka")
      .option("kafka.bootstrap.servers", "localhost:9092")
      .option("subscribe", "marislink.underwater.telemetry.v1")
      .option("startingOffsets", "latest")
      .load()

    // Parse JSON stream payload
    val telemetryStream = kafkaStreamDf
      .selectExpr("CAST(value AS STRING) AS json_str", "timestamp AS kafka_arrival_time")
      .select(from_json(col("json_str"), telemetrySchema).as("data"), col("kafka_arrival_time"))
      .select("data.*", "kafka_arrival_time")

    // Filter valid acoustic readings
    val validStream = telemetryStream.filter(
      col("node_id").isNotNull &&
      col("battery_level") >= 0.0 && col("battery_level") <= 100.0 &&
      col("packet_loss") >= 0.0 && col("packet_loss") <= 100.0
    )

    // Compute tumbling window aggregations
    val windowedMetrics = validStream
      .groupBy(
        window(col("kafka_arrival_time"), "10 seconds"),
        col("node_id")
      )
      .agg(
        count("*").alias("window_messages"),
        round(avg("latency_ms"), 2).alias("window_avg_latency"),
        round(avg("packet_loss"), 2).alias("window_avg_loss"),
        round(avg("battery_level"), 2).alias("window_avg_battery")
      )

    // Output to console sink
    val query = windowedMetrics.writeStream
      .outputMode("complete")
      .format("console")
      .option("truncate", "false")
      .start()

    query.awaitTermination()
  }
}
