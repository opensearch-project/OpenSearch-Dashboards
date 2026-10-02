/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

/**
 * Client-side classification of a span's downstream dependency, following the
 * data-prepper otel-apm-service-map "Dependency naming specification" (README of
 * that processor), so the per-trace views (trace map, waterfall) name databases,
 * message brokers and external endpoints exactly as the aggregated APM service
 * map does.
 *
 * Raw OTel spans already carry the identifying attributes (`db.*`,
 * `messaging.*`, `http`/`url`/`peer.service`), so no backend change is needed
 * here — this only reads what the trace already contains.
 */

export type DependencyType = 'database' | 'messaging' | 'external';

/** A span attribute that identifies a dependency, used to filter a trace to its spans. */
export interface DependencyFilter {
  /** Attribute key as stored on the span, e.g. `server.address`. */
  key: string;
  value: string;
}

export interface DependencyInfo {
  type: DependencyType;
  /** Synthesized dependency identity, e.g. "redis:valkey-cart", "kafka:orders", "api.openai.com". */
  name: string;
  /**
   * The underlying system, lowercased, per OTel semantic conventions:
   * db.system.name (postgresql, mysql, redis, mongodb, ...) or messaging.system
   * (kafka, rabbitmq, ...). Undefined for generic external endpoints. Lets the UI
   * pick a system-specific icon and fall back to a category icon.
   * @see https://opentelemetry.io/docs/specs/semconv/database/
   */
  system?: string;
  /** The attribute that identified the dependency on this span, when one did. */
  filter?: DependencyFilter;
}

type Primitive = string | number | boolean;

const isPrimitive = (v: unknown): v is Primitive =>
  typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';

/**
 * Resolve a dotted key against an attributes object whose keys may be flat
 * ("db.system.name"), fully nested (db -> system -> name) or partially nested
 * (messaging -> "destination.name"). Tries the longest literal prefix first.
 * Only primitive values count, so a prefix key ("messaging.destination") never
 * resolves to the intermediate object of its longer siblings.
 */
const lookupPath = (obj: unknown, parts: string[]): Primitive | undefined => {
  if (!obj || typeof obj !== 'object' || parts.length === 0) return undefined;
  const record = obj as Record<string, unknown>;
  for (let i = parts.length; i > 0; i--) {
    const value = record[parts.slice(0, i).join('.')];
    if (value === undefined || value === null) continue;
    if (i === parts.length) {
      if (isPrimitive(value)) return value;
      continue;
    }
    const nested = lookupPath(value, parts.slice(i));
    if (nested !== undefined) return nested;
  }
  return undefined;
};

/**
 * Read a span attribute that may be stored flat (dot-notation key) or nested,
 * and possibly under `_source`. Returns undefined when absent.
 */
export const getSpanAttr = (span: any, key: string): Primitive | undefined => {
  if (!span) return undefined;
  const source = span._source || span;
  // Flat dotted key on the hit itself (e.g. "attributes.db.system").
  const flat = source[`attributes.${key}`];
  if (isPrimitive(flat)) return flat;
  return lookupPath(source.attributes, key.split('.'));
};

/** The first of `keys` with a non-empty value, with that key. */
const firstEntry = (span: any, keys: string[]): DependencyFilter | undefined => {
  for (const key of keys) {
    const v = getSpanAttr(span, key);
    if (v !== undefined && v !== null && `${v}` !== '') return { key, value: `${v}` };
  }
  return undefined;
};

const firstAttr = (span: any, keys: string[]): string | undefined => firstEntry(span, keys)?.value;

/** Whether any of `keys` is present (possibly empty), as the backend's type detection reads it. */
const hasAnyAttr = (span: any, keys: string[]): boolean =>
  keys.some((key) => {
    const v = getSpanAttr(span, key);
    return v !== undefined && v !== null;
  });

const DB_SYSTEM_KEYS = [
  'db.system.name',
  'db.system',
  'db_system',
  'db_system_name',
  'db.system_name',
];

/** Normalize kinds like "SPAN_KIND_CLIENT" / "client" / "CLIENT" -> "CLIENT". */
export const normalizeSpanKind = (kind: any): string =>
  `${kind || ''}`.toUpperCase().replace(/^SPAN_KIND_/, '');

/** Only these span kinds can name a dependency; SERVER / INTERNAL spans describe the service. */
const DEPENDENCY_CANDIDATE_KINDS = new Set(['CLIENT', 'PRODUCER', 'CONSUMER']);

/** Whether a span of this kind can target a dependency (CLIENT / PRODUCER / CONSUMER). */
export const isDependencyCandidateKind = (kind: unknown): boolean =>
  DEPENDENCY_CANDIDATE_KINDS.has(normalizeSpanKind(kind));

// AWS SDK service names (rpc.service with rpc.system=aws-api) the backend maps explicitly
// (data-prepper otel-proto-common aws_service_mappings); others become `AWS::{rpc.service}`.
const AWS_SERVICE_MAPPINGS: Record<string, string> = {
  AmazonDynamoDBv2: 'AWS::DynamoDB',
  DynamoDb: 'AWS::DynamoDB',
  dynamodb: 'AWS::DynamoDB',
  DynamoDBv2: 'AWS::DynamoDB',
  sns: 'AWS::SNS',
  AmazonSNS: 'AWS::SNS',
  SimpleNotificationService: 'AWS::SNS',
  Kinesis: 'AWS::Kinesis',
  AmazonKinesis: 'AWS::Kinesis',
  'Amazon S3': 'AWS::S3',
  S3: 'AWS::S3',
  s3: 'AWS::S3',
};

/** `AWS::{service}` for an AWS SDK call (rpc.system=aws-api), else undefined. */
const awsServiceName = (span: any): string | undefined => {
  if (firstAttr(span, ['rpc.system']) !== 'aws-api') return undefined;
  const service = firstAttr(span, ['rpc.service']);
  return service ? (AWS_SERVICE_MAPPINGS[service] ?? `AWS::${service}`) : undefined;
};

// Mirrors the data-prepper otel-apm-service-map naming policy so the per-trace
// map names a dependency the same way the aggregated service map does.
const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const LOOPBACK_NAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
]);
// Host names derived from an IP address (one per instance/pod): EC2 private,
// EC2 public and Kubernetes pod DNS.
const PER_INSTANCE_HOST_RES = [
  /^ip-\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}(\..*)?$/i,
  /^ec2-\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}\..*$/i,
  /^\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}\..*$/i,
];
const DEFAULT_PORTS = new Set(['80', '443', '-1']);

/** IPv4 literal, or an (unbracketed) IPv6 literal: two or more colons and only hex/colon/dot. */
const isIpLiteral = (host: string): boolean =>
  IPV4_RE.test(host) || ((host.match(/:/g) || []).length >= 2 && /^[0-9a-f:.]+$/i.test(host));

const isLoopbackName = (host: string): boolean => {
  const lower = host.toLowerCase();
  return LOOPBACK_NAMES.has(lower) || lower.endsWith('.localhost');
};

/** Whether a peer host may name a dependency node (not an IP, loopback or per-instance name). */
const isNameableHost = (host: string): boolean =>
  !host.startsWith('[') &&
  !isIpLiteral(host) &&
  !isLoopbackName(host) &&
  !PER_INSTANCE_HOST_RES.some((re) => re.test(host));

/**
 * Normalize an external peer name ("host" or "host:port"): drop a scheme-default
 * port, and return null for a peer that must not name a node.
 */
const normalizeExternalName = (name: string): string | null => {
  if (isIpLiteral(name) || name.startsWith('[')) return null;
  const m = /^(.*):(\d{1,5}|-1)$/.exec(name);
  const host = m ? m[1] : name;
  if (!host || !isNameableHost(host)) return null;
  return m && DEFAULT_PORTS.has(m[2]) ? host : name;
};

/**
 * Whether a dependency name may become a node at all (backend
 * isPublishableDependencyName): not empty, not an IP literal (bare, bracketed or
 * with a port) and not a loopback name.
 */
const isPublishableName = (name: string): boolean => {
  if (!name || name.startsWith(':') || name.endsWith(':') || name.startsWith('[')) return false;
  if (isIpLiteral(name)) return false;
  const m = /^(.*):(\d{1,5}|-1)$/.exec(name);
  const host = m ? m[1] : name;
  return !isLoopbackName(host) && !(m && isIpLiteral(host));
};

/**
 * Database node name: {system}:{host} > {system}:{namespace} > {system}; without
 * a system, host[:port] > namespace > "database". The system keeps its original
 * casing, as in the backend. A caller-assigned peer.service wins, subject to the
 * backend publishability rule (null: no node). As in the backend, only the first
 * present host attribute is considered; an unnameable one (IP, loopback,
 * per-instance) is skipped rather than replaced by a later key.
 */
const databaseName = (span: any, dbSystem?: string): string | null => {
  const peer = firstAttr(span, ['peer.service']);
  if (peer) return isPublishableName(peer) ? peer : null;
  // An AWS SDK call (e.g. DynamoDB) is named after the service, as in the backend.
  const aws = awsServiceName(span);
  if (aws) return aws;
  const rawHost = firstAttr(span, ['server.address', 'net.peer.name', 'network.peer.address']);
  const host = rawHost && isNameableHost(rawHost) ? rawHost : undefined;
  const namespace = firstAttr(span, ['db.namespace', 'db.name']);
  if (dbSystem) {
    if (host) return `${dbSystem}:${host}`;
    return namespace ? `${dbSystem}:${namespace}` : dbSystem;
  }
  if (host) {
    const port = firstAttr(span, ['server.port', 'net.peer.port', 'network.peer.port']);
    return port ? `${host}:${port}` : host;
  }
  return namespace || 'database';
};

/**
 * Classify the dependency a span targets from its attributes alone (definitive
 * for databases and messaging). External classification is intentionally left to
 * the caller, which has trace context to decide whether a CLIENT span reaches a
 * traced service (a normal edge) or an untraced endpoint (external).
 */
export const classifyDependencyByAttributes = (span: any): DependencyInfo | null => {
  // Messaging (Kafka, RabbitMQ, SQS/SNS, ...).
  const messagingSystem = firstAttr(span, ['messaging.system']);
  if (messagingSystem) {
    // Without a destination (a metadata fetch, an ack) no broker node is named.
    const destination = firstEntry(span, ['messaging.destination.name', 'messaging.destination']);
    if (!destination) return null;
    return {
      type: 'messaging',
      name: `${messagingSystem}:${destination.value}`,
      system: messagingSystem.toLowerCase(),
      filter: destination,
    };
  }

  // Database (current + legacy + flattened demo variants: db.system.name,
  // db.system, db_system, db_system_name).
  const dbSystem = firstAttr(span, DB_SYSTEM_KEYS);
  // Type detection counts a key that is present even when empty, as the backend does.
  const hasDbSignal = hasAnyAttr(span, [
    ...DB_SYSTEM_KEYS,
    'db.statement',
    'db.query.text',
    'db.name',
    'db.namespace',
  ]);
  if (hasDbSignal) {
    const name = databaseName(span, dbSystem);
    if (name === null) return null;
    // The instance identifies a database best; else its namespace or system.
    const host = firstEntry(span, ['server.address', 'net.peer.name', 'network.peer.address']);
    const filter =
      firstEntry(span, ['peer.service']) ||
      (host && isNameableHost(host.value) ? host : undefined) ||
      firstEntry(span, ['db.namespace', 'db.name']) ||
      firstEntry(span, [
        'db.system.name',
        'db.system',
        'db_system',
        'db_system_name',
        'db.system_name',
      ]);
    return {
      type: 'database',
      name,
      system: dbSystem ? dbSystem.toLowerCase() : undefined,
      filter,
    };
  }

  return null;
};

/**
 * EUI icon glyph for a dependency, keyed by the OTel system value where a
 * distinct icon helps, otherwise a per-category default. Returns a built-in EUI
 * icon name (no bundled brand assets); a system-specific brand SVG can be
 * slotted in here later by returning an imported icon URL instead.
 * @see https://opentelemetry.io/docs/specs/semconv/database/
 */
export const dependencyIconType = (type: DependencyType, system?: string): string => {
  const sys = (system || '').toLowerCase();
  // Search-engine datastores read better as a search glyph than a DB cylinder.
  if (sys === 'elasticsearch' || sys === 'opensearch') return 'search';
  switch (type) {
    case 'database':
      return 'database';
    case 'messaging':
      return 'logstashQueue';
    case 'external':
    default:
      return 'globe';
  }
};

// Address/port attribute pairs, in the order the backend tries them.
const ADDRESS_PORT_KEYS: Array<[string, string]> = [
  ['server.address', 'server.port'],
  ['net.peer.name', 'net.peer.port'],
  ['network.peer.address', 'network.peer.port'],
  ['net.sock.peer.addr', 'net.sock.peer.port'],
];

/**
 * The external peer a CLIENT span calls and the attribute that names it, following the
 * backend: peer.service, else an AWS SDK service (`AWS::{service}`), GraphQL (`graphql`) or
 * FaaS (`faas.invoked_name`) name; else the first address/port pair present as
 * `host[:port]`, else the host and port of url.full / http.url. Scheme-default ports are
 * dropped. Null when nothing names the peer, or when it is a raw IP, loopback or
 * per-instance host (the backend suppresses those rather than minting a node per address).
 */
const resolveExternalPeer = (span: any): { name: string; filter?: DependencyFilter } | null => {
  const peer = firstEntry(span, ['peer.service']);
  if (peer) {
    const name = normalizeExternalName(peer.value);
    return name ? { name, filter: peer } : null;
  }
  // Later rules override earlier ones, as the backend's extractors do.
  let named: { name: string; filter?: DependencyFilter } | undefined;
  const rpc = firstEntry(span, ['rpc.service', 'rpc.method']);
  const faas = firstEntry(span, ['faas.invoked_name']);
  const graphql = firstEntry(span, ['graphql.operation.type']);
  if (faas) named = { name: faas.value, filter: faas };
  if (graphql) named = { name: 'graphql', filter: graphql };
  if (rpc) {
    const aws = awsServiceName(span);
    named = aws ? { name: aws, filter: firstEntry(span, ['rpc.service']) } : undefined;
  }
  if (named) return isPublishableName(named.name) ? named : null;

  for (const [addressKey, portKey] of ADDRESS_PORT_KEYS) {
    const address = firstEntry(span, [addressKey]);
    if (address) {
      const port = firstAttr(span, [portKey]);
      const name = normalizeExternalName(port ? `${address.value}:${port}` : address.value);
      return name ? { name, filter: address } : null;
    }
  }

  const url = firstAttr(span, ['url.full', 'http.url']);
  if (url) {
    try {
      const u = new URL(url);
      if (!u.hostname) return null;
      // URL keeps IPv6 hosts bracketed and already omits the scheme-default port.
      const name = normalizeExternalName(u.port ? `${u.hostname}:${u.port}` : u.hostname);
      return name ? { name } : null;
    } catch {
      return null;
    }
  }
  return null;
};

/** The external peer name of a CLIENT span (see resolveExternalPeer), or null. */
export const resolveExternalName = (span: any): string | null =>
  resolveExternalPeer(span)?.name ?? null;

/**
 * Whether an external peer is named like a service traced in this trace (its SERVER span is
 * missing from this call, e.g. sampling): it is that service, not an external dependency.
 * Matches peer.service, the peer host and Kubernetes service DNS (`checkout.ns.svc...`),
 * as the backend does.
 */
const namesKnownService = (
  span: any,
  externalName: string,
  knownServerServices: ReadonlySet<string>
): boolean => {
  if (knownServerServices.size === 0) return false;
  const host = /^(.*):(\d{1,5}|-1)$/.exec(externalName)?.[1] ?? externalName;
  return [firstAttr(span, ['peer.service']), firstAttr(span, ['server.address']), host].some(
    (candidate) => {
      if (!candidate) return false;
      const name = candidate.toLowerCase();
      if (knownServerServices.has(name)) return true;
      const firstDot = name.indexOf('.');
      return (
        firstDot > 0 &&
        (name.endsWith('.svc') || name.includes('.svc.')) &&
        knownServerServices.has(name.substring(0, firstDot))
      );
    }
  );
};

// A CLIENT span is an external call only when one of these is set (backend computeNodeType).
const EXTERNAL_SIGNAL_KEYS = [
  'url.full',
  'http.url',
  'http.request.method',
  'http.method',
  'peer.service',
  'rpc.system',
  'server.address',
  'net.peer.name',
];

export interface SpanDependencyContext {
  /**
   * Whether the span's call reached a traced service (see buildTraceDependencies). A CLIENT
   * span that did is a service-to-service edge, not a dependency.
   */
  reachesTracedService: boolean;
  /** Lower-cased names of the services with a SERVER span in the trace, when known. */
  knownServerServices?: ReadonlySet<string>;
}

/**
 * The dependency a span targets, per the backend naming specification: only CLIENT,
 * PRODUCER and CONSUMER spans name one; PRODUCER / CONSUMER spans name brokers only; a
 * CLIENT span names one only when its call did not reach a traced service, and names an
 * external peer only when that peer is not a service traced in the trace.
 */
export const classifySpanDependency = (
  span: any,
  context: SpanDependencyContext
): DependencyInfo | null => {
  if (!span) return null;
  const kind = normalizeSpanKind(span.kind);
  if (!isDependencyCandidateKind(kind)) return null;
  if (kind !== 'CLIENT') {
    const dep = classifyDependencyByAttributes(span);
    return dep?.type === 'messaging' ? dep : null;
  }
  if (context.reachesTracedService) return null;
  const dep = classifyDependencyByAttributes(span);
  if (dep) return dep;
  if (!hasAnyAttr(span, EXTERNAL_SIGNAL_KEYS)) return null;
  const peer = resolveExternalPeer(span);
  if (!peer) return null;
  if (
    context.knownServerServices &&
    namesKnownService(span, peer.name, context.knownServerServices)
  ) {
    return null;
  }
  return { type: 'external', name: peer.name, filter: peer.filter };
};

/** Human-readable label for a dependency type. */
export const dependencyTypeLabel = (type: DependencyType): string =>
  type === 'database'
    ? i18n.translate('explore.traceView.dependency.database', { defaultMessage: 'Database' })
    : type === 'messaging'
      ? i18n.translate('explore.traceView.dependency.messaging', { defaultMessage: 'Messaging' })
      : i18n.translate('explore.traceView.dependency.external', { defaultMessage: 'External' });
