/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */
import { activemqLogsSpecProvider } from './activemq-logs';
import { activemqMetricsSpecProvider } from './activemq-metrics';
import { aerospikeMetricsSpecProvider } from './aerospike-metrics';
import { apacheLogsSpecProvider } from './apache-logs';
import { apacheMetricsSpecProvider } from './apache-metrics';
import { auditbeatSpecProvider } from './auditbeat';
import { auditdLogsSpecProvider } from './auditd-logs';
import { awsLogsSpecProvider } from './aws-logs';
import { awsMetricsSpecProvider } from './aws-metrics';
import { azureLogsSpecProvider } from './azure-logs';
import { azureMetricsSpecProvider } from './azure-metrics';
import { barracudaLogsSpecProvider } from './barracuda-logs';
import { bluecoatLogsSpecProvider } from './bluecoat-logs';
import { cefLogsSpecProvider } from './cef-logs';
import { cephMetricsSpecProvider } from './ceph-metrics';
import { checkpointLogsSpecProvider } from './checkpoint-logs';
import { ciscoLogsSpecProvider } from './cisco-logs';
import { cloudwatchLogsSpecProvider } from './cloudwatch-logs';
import { cockroachdbMetricsSpecProvider } from './cockroachdb-metrics';
import { consulMetricsSpecProvider } from './consul-metrics';
import { corednsLogsSpecProvider } from './coredns-logs';
import { corednsMetricsSpecProvider } from './coredns-metrics';
import { couchbaseMetricsSpecProvider } from './couchbase-metrics';
import { couchdbMetricsSpecProvider } from './couchdb-metrics';
import { crowdstrikeLogsSpecProvider } from './crowdstrike-logs';
import { cylanceLogsSpecProvider } from './cylance-logs';
import { dockerMetricsSpecProvider } from './docker-metrics';
import { dropwizardMetricsSpecProvider } from './dropwizard-metrics';
import { opensearchLogsSpecProvider } from './opensearch-logs';
import { opensearchMetricsSpecProvider } from './opensearch-metrics';
import { envoyproxyLogsSpecProvider } from './envoyproxy-logs';
import { envoyproxyMetricsSpecProvider } from './envoyproxy-metrics';
import { etcdMetricsSpecProvider } from './etcd-metrics';
import { f5LogsSpecProvider } from './f5-logs';
import { fortinetLogsSpecProvider } from './fortinet-logs';
import { golangMetricsSpecProvider } from './golang-metrics';
import { googlecloudLogsSpecProvider } from './googlecloud-logs';
import { googlecloudMetricsSpecProvider } from './googlecloud-metrics';
import { gsuiteLogsSpecProvider } from './gsuite-logs';
import { haproxyLogsSpecProvider } from './haproxy-logs';
import { haproxyMetricsSpecProvider } from './haproxy-metrics';
import { ibmmqLogsSpecProvider } from './ibmmq-logs';
import { ibmmqMetricsSpecProvider } from './ibmmq-metrics';
import { icingaLogsSpecProvider } from './icinga-logs';
import { iisLogsSpecProvider } from './iis-logs';
import { iisMetricsSpecProvider } from './iis-metrics';
import { impervaLogsSpecProvider } from './imperva-logs';
import { infobloxLogsSpecProvider } from './infoblox-logs';
import { iptablesLogsSpecProvider } from './iptables-logs';
import { juniperLogsSpecProvider } from './juniper-logs';
import { kafkaLogsSpecProvider } from './kafka-logs';
import { kafkaMetricsSpecProvider } from './kafka-metrics';
import { opensearchDashboardsLogsSpecProvider } from './opensearch-dashboards-logs';
import { opensearchDashboardsMetricsSpecProvider } from './opensearch-dashboards-metrics';
import { kubernetesMetricsSpecProvider } from './kubernetes-metrics';
import { logstashLogsSpecProvider } from './logstash-logs';
import { logstashMetricsSpecProvider } from './logstash-metrics';
import { memcachedMetricsSpecProvider } from './memcached-metrics';
import { microsoftLogsSpecProvider } from './microsoft-logs';
import { mispLogsSpecProvider } from './misp-logs';
import { mongodbLogsSpecProvider } from './mongodb-logs';
import { mongodbMetricsSpecProvider } from './mongodb-metrics';
import { mssqlLogsSpecProvider } from './mssql-logs';
import { mssqlMetricsSpecProvider } from './mssql-metrics';
import { muninMetricsSpecProvider } from './munin-metrics';
import { mysqlLogsSpecProvider } from './mysql-logs';
import { mysqlMetricsSpecProvider } from './mysql-metrics';
import { natsLogsSpecProvider } from './nats-logs';
import { natsMetricsSpecProvider } from './nats-metrics';
import { netflowLogsSpecProvider } from './netflow-logs';
import { netscoutLogsSpecProvider } from './netscout-logs';
import { nginxLogsSpecProvider } from './nginx-logs';
import { nginxMetricsSpecProvider } from './nginx-metrics';
import { o365LogsSpecProvider } from './o365-logs';
import { oktaLogsSpecProvider } from './okta-logs';
import { openmetricsMetricsSpecProvider } from './openmetrics-metrics';
import { oracleMetricsSpecProvider } from './oracle-metrics';
import { osqueryLogsSpecProvider } from './osquery-logs';
import { panwLogsSpecProvider } from './panw-logs';
import { phpfpmMetricsSpecProvider } from './php-fpm-metrics';
import { postgresqlLogsSpecProvider } from './postgresql-logs';
import { postgresqlMetricsSpecProvider } from './postgresql-metrics';
import { prometheusMetricsSpecProvider } from './prometheus-metrics';
import { rabbitmqLogsSpecProvider } from './rabbitmq-logs';
import { rabbitmqMetricsSpecProvider } from './rabbitmq-metrics';
import { radwareLogsSpecProvider } from './radware-logs';
import { redisLogsSpecProvider } from './redis-logs';
import { redisMetricsSpecProvider } from './redis-metrics';
import { redisenterpriseMetricsSpecProvider } from './redisenterprise-metrics';
import { santaLogsSpecProvider } from './santa-logs';
import { sonicwallLogsSpecProvider } from './sonicwall-logs';
import { sophosLogsSpecProvider } from './sophos-logs';
import { squidLogsSpecProvider } from './squid-logs';
import { stanMetricsSpecProvider } from './stan-metrics';
import { statsdMetricsSpecProvider } from './statsd-metrics';
import { suricataLogsSpecProvider } from './suricata-logs';
import { systemLogsSpecProvider } from './system-logs';
import { systemMetricsSpecProvider } from './system-metrics';
import { tomcatLogsSpecProvider } from './tomcat-logs';
import { traefikLogsSpecProvider } from './traefik-logs';
import { traefikMetricsSpecProvider } from './traefik-metrics';
import { uptimeMonitorsSpecProvider } from './uptime-monitors';
import { uwsgiMetricsSpecProvider } from './uwsgi-metrics';
import { vSphereMetricsSpecProvider } from './vsphere-metrics';
import { windowsEventLogsSpecProvider } from './windows-event-logs';
import { windowsMetricsSpecProvider } from './windows-metrics';
import { zeekLogsSpecProvider } from './zeek-logs';
import { zookeeperMetricsSpecProvider } from './zookeeper-metrics';
import { zscalerLogsSpecProvider } from './zscaler-logs';

export const builtInTutorials = [
  systemLogsSpecProvider,
  systemMetricsSpecProvider,
  apacheLogsSpecProvider,
  apacheMetricsSpecProvider,
  opensearchLogsSpecProvider,
  iisLogsSpecProvider,
  kafkaLogsSpecProvider,
  logstashLogsSpecProvider,
  nginxLogsSpecProvider,
  nginxMetricsSpecProvider,
  mysqlLogsSpecProvider,
  mysqlMetricsSpecProvider,
  mongodbMetricsSpecProvider,
  osqueryLogsSpecProvider,
  phpfpmMetricsSpecProvider,
  postgresqlMetricsSpecProvider,
  postgresqlLogsSpecProvider,
  rabbitmqMetricsSpecProvider,
  redisLogsSpecProvider,
  redisMetricsSpecProvider,
  suricataLogsSpecProvider,
  dockerMetricsSpecProvider,
  kubernetesMetricsSpecProvider,
  uwsgiMetricsSpecProvider,
  netflowLogsSpecProvider,
  traefikLogsSpecProvider,
  cephMetricsSpecProvider,
  aerospikeMetricsSpecProvider,
  couchbaseMetricsSpecProvider,
  dropwizardMetricsSpecProvider,
  opensearchMetricsSpecProvider,
  etcdMetricsSpecProvider,
  haproxyMetricsSpecProvider,
  kafkaMetricsSpecProvider,
  opensearchDashboardsMetricsSpecProvider,
  memcachedMetricsSpecProvider,
  muninMetricsSpecProvider,
  vSphereMetricsSpecProvider,
  windowsMetricsSpecProvider,
  windowsEventLogsSpecProvider,
  golangMetricsSpecProvider,
  logstashMetricsSpecProvider,
  prometheusMetricsSpecProvider,
  zookeeperMetricsSpecProvider,
  uptimeMonitorsSpecProvider,
  cloudwatchLogsSpecProvider,
  awsMetricsSpecProvider,
  mssqlMetricsSpecProvider,
  natsMetricsSpecProvider,
  natsLogsSpecProvider,
  zeekLogsSpecProvider,
  corednsMetricsSpecProvider,
  corednsLogsSpecProvider,
  auditbeatSpecProvider,
  iptablesLogsSpecProvider,
  ciscoLogsSpecProvider,
  envoyproxyLogsSpecProvider,
  couchdbMetricsSpecProvider,
  consulMetricsSpecProvider,
  cockroachdbMetricsSpecProvider,
  traefikMetricsSpecProvider,
  awsLogsSpecProvider,
  activemqLogsSpecProvider,
  activemqMetricsSpecProvider,
  azureMetricsSpecProvider,
  ibmmqLogsSpecProvider,
  ibmmqMetricsSpecProvider,
  stanMetricsSpecProvider,
  envoyproxyMetricsSpecProvider,
  statsdMetricsSpecProvider,
  redisenterpriseMetricsSpecProvider,
  openmetricsMetricsSpecProvider,
  oracleMetricsSpecProvider,
  iisMetricsSpecProvider,
  azureLogsSpecProvider,
  googlecloudMetricsSpecProvider,
  auditdLogsSpecProvider,
  barracudaLogsSpecProvider,
  bluecoatLogsSpecProvider,
  cefLogsSpecProvider,
  checkpointLogsSpecProvider,
  crowdstrikeLogsSpecProvider,
  cylanceLogsSpecProvider,
  f5LogsSpecProvider,
  fortinetLogsSpecProvider,
  googlecloudLogsSpecProvider,
  gsuiteLogsSpecProvider,
  haproxyLogsSpecProvider,
  icingaLogsSpecProvider,
  impervaLogsSpecProvider,
  infobloxLogsSpecProvider,
  juniperLogsSpecProvider,
  opensearchDashboardsLogsSpecProvider,
  microsoftLogsSpecProvider,
  mispLogsSpecProvider,
  mongodbLogsSpecProvider,
  mssqlLogsSpecProvider,
  netscoutLogsSpecProvider,
  o365LogsSpecProvider,
  oktaLogsSpecProvider,
  panwLogsSpecProvider,
  rabbitmqLogsSpecProvider,
  radwareLogsSpecProvider,
  santaLogsSpecProvider,
  sonicwallLogsSpecProvider,
  sophosLogsSpecProvider,
  squidLogsSpecProvider,
  tomcatLogsSpecProvider,
  zscalerLogsSpecProvider,
];
