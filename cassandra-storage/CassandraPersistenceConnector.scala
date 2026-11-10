package marislink.spark

import org.apache.spark.sql.{DataFrame, SparkSession}

/**
 * MARISLINK: Apache Cassandra Spark Connector
 * Demonstrates persisting Spark DataFrame metrics into Cassandra NoSQL tables
 * and querying historical node states.
 */
object CassandraPersistenceConnector {

  def persistMetricsToCassandra(spark: SparkSession, metricsDf: DataFrame): Unit = {
    println("[CASSANDRA CONNECTOR] Configuring Cassandra Host Connection (127.0.0.1:9042)...")

    spark.conf.set("spark.cassandra.connection.host", "127.0.0.1")
    spark.conf.set("spark.cassandra.connection.port", "9042")

    println("[CASSANDRA CONNECTOR] Writing Spark DataFrame to marislink_ocean_telemetry.node_processed_metrics...")

    // Datastax Spark-Cassandra Connector Save Action:
    metricsDf.write
      .format("org.apache.spark.sql.cassandra")
      .options(Map(
        "keyspace" -> "marislink_ocean_telemetry",
        "table" -> "node_processed_metrics"
      ))
      .mode("append")
      .save()

    println("[CASSANDRA CONNECTOR] Batch persistence completed successfully.")
  }

  def queryNodeHistory(spark: SparkSession, nodeId: String): DataFrame = {
    println(s"[CASSANDRA CONNECTOR] Querying historical records for node: $nodeId...")

    spark.read
      .format("org.apache.spark.sql.cassandra")
      .options(Map(
        "keyspace" -> "marislink_ocean_telemetry",
        "table" -> "node_processed_metrics"
      ))
      .load()
      .filter(s"node_id = '$nodeId'")
  }
}
