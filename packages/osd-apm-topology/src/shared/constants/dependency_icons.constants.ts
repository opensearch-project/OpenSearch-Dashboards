/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Third-Party Attributions (dependency icons in ../resources/dependencies; only the icons
 * listed below are included, each unmodified apart from a provenance comment and, for Simple
 * Icons, the brand's official color):
 * - Database and message-broker marks from Simple Icons (https://simpleicons.org)
 *   License: CC0-1.0
 *   Repository: https://github.com/simple-icons/simple-icons
 * - Valkey, Microsoft SQL Server and Oracle marks from Dashboard Icons
 *   Copyright (c) homarr-labs and contributors
 *   License: Apache-2.0
 *   Repository: https://github.com/homarr-labs/dashboard-icons
 * - Generic database and queue glyphs from OUI (https://github.com/opensearch-project/oui)
 *   License: Apache-2.0
 * The marks are trademarks of their respective owners.
 */

import {
  ApachecassandraIcon,
  ApachecouchdbIcon,
  ApachehbaseIcon,
  ApachehiveIcon,
  ApachekafkaIcon,
  ApachepulsarIcon,
  ApacherocketmqIcon,
  ClickhouseIcon,
  CockroachlabsIcon,
  CouchbaseIcon,
  ElasticsearchIcon,
  GenericDatabaseIcon,
  GenericMessagingIcon,
  GooglecloudspannerIcon,
  GooglepubsubIcon,
  H2databaseIcon,
  InfluxdbIcon,
  MariadbIcon,
  MicrosoftSqlServerIcon,
  MicrosoftSqlServerLightIcon,
  MongodbIcon,
  MysqlIcon,
  Neo4jIcon,
  OpensearchIcon,
  OracleIcon,
  PostgresqlIcon,
  RabbitmqIcon,
  RedisIcon,
  SapIcon,
  SqliteIcon,
  TeradataIcon,
  TrinoIcon,
  ValkeyIcon,
} from '../resources/dependencies';
import { DynamodbIcon, RedShiftIcon, SnsIcon, SqsIcon } from '../resources/services';
import { GlobeIcon } from '../resources';

/**
 * Icons for dependency nodes (databases, message brokers, external endpoints), keyed by the
 * OTel system value: `db.system.name` (https://opentelemetry.io/docs/specs/semconv/registry/attributes/db/)
 * and `messaging.system` (https://opentelemetry.io/docs/specs/semconv/registry/attributes/messaging/).
 *
 * Brand marks are Simple Icons (CC0-1.0) in their official brand color, plus Valkey, Microsoft
 * SQL Server and Oracle from Dashboard Icons (Apache-2.0), used unmodified. A system without an
 * open-source mark (e.g. IBM Db2, Azure services, Memcached) gets its type's generic glyph
 * rather than a look-alike.
 * AWS services use the package's AWS icons.
 */

/** Deprecated `db.system` values and spelling variants, mapped to the current OTel value. */
const SYSTEM_ALIASES: Record<string, string> = {
  // db.system (deprecated) -> db.system.name
  adabas: 'softwareag.adabas',
  cosmosdb: 'azure.cosmosdb',
  db2: 'ibm.db2',
  dynamodb: 'aws.dynamodb',
  firebird: 'firebirdsql',
  h2: 'h2database',
  hanadb: 'sap.hana',
  informix: 'ibm.informix',
  ingres: 'actian.ingres',
  intersystems_cache: 'intersystems.cache',
  maxdb: 'sap.maxdb',
  mssql: 'microsoft.sql_server',
  netezza: 'ibm.netezza',
  oracle: 'oracle.db',
  redshift: 'aws.redshift',
  spanner: 'gcp.spanner',
  // messaging.system: the registry mixes `_` and `.` separators; accept both.
  'aws.sqs': 'aws_sqs',
  aws_sns: 'aws.sns',
  'gcp.pubsub': 'gcp_pubsub',
};

/** Icon URL per current OTel system value. */
const SYSTEM_ICONS: Record<string, string> = {
  // Databases
  'aws.dynamodb': DynamodbIcon,
  'aws.redshift': RedShiftIcon,
  cassandra: ApachecassandraIcon,
  clickhouse: ClickhouseIcon,
  cockroachdb: CockroachlabsIcon,
  couchbase: CouchbaseIcon,
  couchdb: ApachecouchdbIcon,
  elasticsearch: ElasticsearchIcon,
  'gcp.spanner': GooglecloudspannerIcon,
  h2database: H2databaseIcon,
  hbase: ApachehbaseIcon,
  hive: ApachehiveIcon,
  influxdb: InfluxdbIcon,
  mariadb: MariadbIcon,
  'microsoft.sql_server': MicrosoftSqlServerIcon,
  mongodb: MongodbIcon,
  mysql: MysqlIcon,
  neo4j: Neo4jIcon,
  opensearch: OpensearchIcon,
  'oracle.db': OracleIcon,
  postgresql: PostgresqlIcon,
  redis: RedisIcon,
  'sap.hana': SapIcon,
  'sap.maxdb': SapIcon,
  sqlite: SqliteIcon,
  teradata: TeradataIcon,
  trino: TrinoIcon,
  valkey: ValkeyIcon,
  // Message brokers
  'aws.sns': SnsIcon,
  aws_sqs: SqsIcon,
  gcp_pubsub: GooglepubsubIcon,
  kafka: ApachekafkaIcon,
  pulsar: ApachepulsarIcon,
  rabbitmq: RabbitmqIcon,
  rocketmq: ApacherocketmqIcon,
};

/** Systems whose icon is the package's monochrome AWS icon (inverted in dark mode), not a brand mark. */
const MONOCHROME_SYSTEMS = new Set(['aws.dynamodb', 'aws.redshift', 'aws.sns', 'aws_sqs']);

/**
 * Brand marks whose official color is too faint against a theme's background (contrast below
 * 2.5:1 with OUI's light #FFFFFF / dark #1D1E24 page colors); they render in one color there
 * (black on light, white on dark), the one-color version brand guidelines allow. The marks
 * always come with a text label (card title, tooltip), so this keeps them visible rather than
 * carrying meaning alone.
 */
const MONO_ON_LIGHT = new Set(['clickhouse', 'hive', 'gcp_pubsub']);
const MONO_ON_DARK = new Set([
  'mariadb',
  'elasticsearch',
  'h2database',
  'sqlite',
  'kafka',
  'valkey',
]);

/** Marks whose vendor ships a light version for dark backgrounds; used in dark mode. */
const DARK_THEME_ICONS: Record<string, string> = {
  'microsoft.sql_server': MicrosoftSqlServerLightIcon,
};

/** Generic icon per dependency type, for a system without an icon. */
const TYPE_ICONS: Record<string, string> = {
  database: GenericDatabaseIcon,
  messaging: GenericMessagingIcon,
  external: GlobeIcon,
};

const ICON_KEY_PREFIX = 'Dependency::';

/**
 * The current OTel value for a system, lower-cased, with deprecated `db.system` values and
 * separator variants mapped (e.g. `mssql` -> `microsoft.sql_server`, `aws.sqs` -> `aws_sqs`).
 */
export const normalizeDependencySystem = (system?: string): string | undefined => {
  const key = (system || '').trim().toLowerCase();
  if (!key) return undefined;
  return SYSTEM_ALIASES[key] ?? key;
};

/** A system's dark-mode version of its mark, when the vendor ships one (e.g. SQL Server). */
export const getDependencySystemDarkIcon = (system?: string): string | undefined => {
  const key = normalizeDependencySystem(system);
  return key ? DARK_THEME_ICONS[key] : undefined;
};

/** Icon URL for a dependency system, or undefined when it has no dedicated icon. */
export const getDependencySystemIcon = (system?: string): string | undefined => {
  const key = normalizeDependencySystem(system);
  return key ? SYSTEM_ICONS[key] : undefined;
};

/**
 * ICONS key for a dependency node: the system's icon when it has one (`Dependency::<system>`),
 * else the type's generic glyph (`Dependency::database` / `messaging` / `external`).
 *
 * @param type - database / messaging / external (any other type gets the external globe)
 * @param system - OTel `db.system.name` / `db.system` / `messaging.system` value, if known
 */
export const getDependencyIconKey = (type?: string, system?: string): string => {
  const key = normalizeDependencySystem(system);
  if (key && SYSTEM_ICONS[key]) return `${ICON_KEY_PREFIX}${key}`;
  const t = (type || '').toLowerCase();
  return `${ICON_KEY_PREFIX}${TYPE_ICONS[t] ? t : 'external'}`;
};

/** Entries merged into ICONS, so getIcon() resolves every getDependencyIconKey() result. */
export const DEPENDENCY_ICONS: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(SYSTEM_ICONS).map(([k, v]) => [`${ICON_KEY_PREFIX}${k}`, v])
  ),
  ...Object.fromEntries(Object.entries(TYPE_ICONS).map(([k, v]) => [`${ICON_KEY_PREFIX}${k}`, v])),
};

/**
 * Whether a system's icon is a full-color brand mark. Brand marks keep their official color
 * (see getBrandIconClassName for the faint ones), rather than being inverted like monochrome
 * icons.
 */
export const isBrandDependencySystem = (system?: string): boolean => {
  const key = normalizeDependencySystem(system);
  return !!key && !!SYSTEM_ICONS[key] && !MONOCHROME_SYSTEMS.has(key);
};

/**
 * CSS classes for a system's brand mark: `celBrandIcon`, plus `celBrandIcon--monoOnLight` /
 * `celBrandIcon--monoOnDark` where its color is too faint for that theme. Empty for icons
 * that are not brand marks.
 */
export const getBrandIconClassName = (system?: string): string => {
  if (!isBrandDependencySystem(system)) return '';
  const key = normalizeDependencySystem(system) as string;
  return [
    'celBrandIcon',
    MONO_ON_LIGHT.has(key) ? 'celBrandIcon--monoOnLight' : '',
    MONO_ON_DARK.has(key) ? 'celBrandIcon--monoOnDark' : '',
  ]
    .filter(Boolean)
    .join(' ');
};

/** Whether an ICONS key (see getDependencyIconKey) is a full-color brand mark. */
export const isBrandIconKey = (iconKey?: string): boolean =>
  !!iconKey &&
  iconKey.startsWith(ICON_KEY_PREFIX) &&
  isBrandDependencySystem(iconKey.slice(ICON_KEY_PREFIX.length));
