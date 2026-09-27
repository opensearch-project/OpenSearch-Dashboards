/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Client-side classification of a span's downstream dependency, mirroring the
 * data-prepper otel-apm-service-map synthesis so the per-trace views (service
 * flow, waterfall) can represent databases, message brokers and external
 * endpoints the same way the aggregated APM service map does.
 *
 * Raw OTel spans already carry the identifying attributes (`db.*`,
 * `messaging.*`, `http`/`url`/`peer.service`), so no backend change is needed
 * here — this only reads what the trace already contains.
 */

export type DependencyType = 'database' | 'messaging' | 'external';

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

const firstAttr = (span: any, keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = getSpanAttr(span, k);
    if (v !== undefined && v !== null && `${v}` !== '') return `${v}`;
  }
  return undefined;
};

/** Normalize kinds like "SPAN_KIND_CLIENT" / "client" / "CLIENT" -> "CLIENT". */
export const normalizeSpanKind = (kind: any): string =>
  `${kind || ''}`.toUpperCase().replace(/^SPAN_KIND_/, '');

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
    const destination = firstAttr(span, ['messaging.destination.name', 'messaging.destination']);
    return {
      type: 'messaging',
      name: destination ? `${messagingSystem}:${destination}` : messagingSystem,
      system: messagingSystem.toLowerCase(),
    };
  }

  // Database (current + legacy + flattened demo variants: db.system.name,
  // db.system, db_system, db_system_name).
  const dbSystem = firstAttr(span, [
    'db.system.name',
    'db.system',
    'db_system',
    'db_system_name',
    'db.system_name',
  ]);
  const hasDbSignal =
    dbSystem !== undefined ||
    firstAttr(span, ['db.statement', 'db.query.text', 'db.name', 'db.namespace']) !== undefined;
  if (hasDbSignal) {
    const name = databaseName(span, dbSystem);
    if (name === null) return null;
    return { type: 'database', name, system: dbSystem ? dbSystem.toLowerCase() : undefined };
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

/**
 * Resolve an external-endpoint identity for a CLIENT span (peer.service, then
 * url host, then server.address:port), with scheme-default ports dropped.
 * Returns null when nothing names the peer, or when it is a raw IP, loopback or
 * per-instance host (the backend suppresses those rather than minting a node
 * per address).
 */
export const resolveExternalName = (span: any): string | null => {
  const peer = firstAttr(span, ['peer.service']);
  if (peer) return normalizeExternalName(peer);

  const url = firstAttr(span, ['url.full', 'http.url']);
  if (url) {
    try {
      const u = new URL(url);
      // URL keeps IPv6 hosts bracketed and already omits the scheme-default port.
      return normalizeExternalName(u.port ? `${u.hostname}:${u.port}` : u.hostname);
    } catch {
      // fall through to host/port
    }
  }

  const host = firstAttr(span, ['server.address', 'net.peer.name']);
  if (!host) return null;
  const port = firstAttr(span, ['server.port', 'net.peer.port']);
  return normalizeExternalName(port ? `${host}:${port}` : host);
};

/**
 * Whether a span's call reached a traced service (a normal service edge) rather
 * than an untraced endpoint: a direct child, or a child of a same-service CLIENT
 * descendant (an SDK span over its transport span), belongs to another service.
 * Other same-service descendants (e.g. tool calls under an LLM span) are not
 * followed. Mirrors the backend's hasClientDescendantWithServerChild.
 */
export const hasCrossServiceChild = <T>(
  span: T,
  childrenOf: (s: T) => T[] | undefined,
  serviceOf: (s: T) => string | undefined,
  kindOf: (s: T) => unknown
): boolean => {
  const own = serviceOf(span);
  const pending: T[] = [span];
  const visited = new Set<T>(pending);
  while (pending.length > 0) {
    const current = pending.pop() as T;
    for (const child of childrenOf(current) || []) {
      if (serviceOf(child) !== own) return true;
      if (normalizeSpanKind(kindOf(child)) === 'CLIENT' && !visited.has(child)) {
        visited.add(child);
        pending.push(child);
      }
    }
  }
  return false;
};

/** Human-readable label for a dependency type. */
export const dependencyTypeLabel = (type: DependencyType): string =>
  type === 'database' ? 'Database' : type === 'messaging' ? 'Messaging' : 'External';
