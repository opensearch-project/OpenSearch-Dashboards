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
  /** Synthesized dependency identity, e.g. "postgresql", "kafka:orders", "api.example.com:443". */
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

/**
 * Read a span attribute that may be stored flat (dot-notation key) or nested,
 * and possibly under `_source`. Returns undefined when absent.
 */
export const getSpanAttr = (span: any, key: string): any => {
  if (!span) return undefined;
  const source = span._source || span;
  // Flat dotted key on the hit itself (e.g. "attributes.db.system").
  if (source[`attributes.${key}`] !== undefined) return source[`attributes.${key}`];
  const attrs = source.attributes;
  if (attrs) {
    if (attrs[key] !== undefined) return attrs[key];
    // Nested traversal: "db.system.name" -> attrs.db.system.name
    const parts = key.split('.');
    let cur: any = attrs;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && cur[p] !== undefined) cur = cur[p];
      else {
        cur = undefined;
        break;
      }
    }
    if (cur !== undefined) return cur;
  }
  return undefined;
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

const hostPort = (host?: string, port?: string): string | undefined => {
  if (!host) return undefined;
  return port ? `${host}:${port}` : host;
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
    const host = firstAttr(span, ['server.address', 'net.peer.name', 'network.peer.address']);
    const port = firstAttr(span, ['server.port', 'net.peer.port', 'network.peer.port']);
    const name = dbSystem || hostPort(host, port) || 'database';
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
 * url host, then server.address:port). Returns null when nothing identifies it.
 */
export const resolveExternalName = (span: any): string | null => {
  const peer = firstAttr(span, ['peer.service']);
  if (peer) return peer;

  const url = firstAttr(span, ['url.full', 'http.url']);
  if (url) {
    try {
      const u = new URL(url);
      return u.port ? `${u.hostname}:${u.port}` : u.hostname;
    } catch {
      // fall through to host/port
    }
  }

  const host = firstAttr(span, ['server.address', 'net.peer.name']);
  const port = firstAttr(span, ['server.port', 'net.peer.port']);
  const hp = hostPort(host, port);
  if (hp) return hp;

  const hasHttp =
    firstAttr(span, ['http.request.method', 'http.method', 'http.url', 'url.full']) !== undefined;
  return hasHttp ? 'external' : null;
};

/** Human-readable label for a dependency type. */
export const dependencyTypeLabel = (type: DependencyType): string =>
  type === 'database' ? 'Database' : type === 'messaging' ? 'Messaging' : 'External';
