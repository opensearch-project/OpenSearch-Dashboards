/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * Authoring CLI for the v2 registry document (Phase 13, Story 4).
 *
 * Extends the Phase-2 `update_registry` CLI with v2-aware operations: set the
 * default-layer entry for a plugin, add/remove a rollout rule, set/remove a
 * per-tenant override, roll back a default entry to its previous value via the
 * audit log, and validate that the would-be RESOLVED registry's inter-plugin
 * dependency graph is satisfiable (`--check-deps`).
 *
 * NOT a backend API. This is the same `update_registry` CLI evolved — it runs
 * on an operator/orchestrator host, mutates a v2 document on disk, and appends
 * to a sidecar audit log (`<path>.history.json`). A future production registry
 * service will expose the SAME operations via an HTTP API, but in Phase 13 the
 * file-backed CLI is the only authoring surface (per PRD design_spec §6).
 *
 * Atomicity contract (PRD design_spec): each successful op atomically advances
 * BOTH the registry file and the audit log; if any step fails (validation,
 * --check-deps reject, write error), NEITHER file is partially updated. The
 * implementation snapshots the on-disk state, performs the mutation in memory,
 * writes both files via temp-file + rename, and rolls back the doc on a history
 * write failure.
 *
 * `--check-deps` builds the inter-plugin dependency graph from the BUILD-TIME
 * externals data (the actual `__osdBundles__.get("plugin/<id>/public")` edges
 * emitted by `build_mfe`), NOT from the manifest's `requiredPlugins` (which
 * over-states coupling — type-only imports are erased — per the Phase-15 spike,
 * docs/14-EXTERNAL-PLUGIN-SPIKE.md). The CLI consumes the externals as a sidecar
 * directory — a concrete handoff that decouples this story from the build
 * pipeline emission step.
 */

import Fs from 'fs';
import Path from 'path';

import {
  V2Document,
  V2Rollout,
  V2RolloutMatch,
  assertValidV2Document,
  coerceToV2Document,
  detectRegistryShape,
} from './schema_v2';
import { MfeEntry } from './schema';
import { resolveBootManifest } from './resolve_v2';
import {
  V3AssetDescriptor,
  V3Document,
  SCHEMA_VERSION_V3,
  assertValidV3Document,
  coerceToV3Document,
} from './schema_v3';
import {
  applySetCore,
  applySetOrchestrator,
  applySetSharedDepsCss,
  applySetTheme,
} from './v3_asset_apply';
import {
  V3AssetBuildManifest,
  manifestToAssetDescriptor,
  readV3AssetBuildManifest,
} from './v3_asset_build';
import { signRegistry, RegistrySigningKey } from './signing';
import { REGISTRY_SIGNATURE_ALGORITHM } from './signing_common';

/** Minimal console surface, injectable so tests can assert/silence output. */
export interface UpdateCliV2Console {
  log: (message: string) => void;
  error: (message: string) => void;
}

/** Audit-log entry kinds (mirrors the supported authoring ops). */
export type AuditOp =
  | 'set-default-entry'
  | 'add-rollout'
  | 'remove-rollout'
  | 'set-tenant-override'
  | 'remove-tenant-override'
  | 'rollback'
  // Phase 16 Story 1: forward-only schema migration. Emitted ONCE by the
  // authoring CLI (Story 2) when it first writes a v3 doc derived from a v1/v2
  // input on disk. Records the schemaVersion transition; the per-op v3
  // mutations are separate AuditOp members below.
  | 'migrate-v2-to-v3'
  // Phase 16 Story 2: per-op v3 mutations for the four new GLOBAL asset
  // categories. Each carries the V3AssetDescriptor in before/after, so an
  // operator can rollback by re-applying the prior `before` value. (Rollback
  // for v3 assets is not implemented in Story 2 — the audit log is sufficient
  // for now; explicit rollback is a Story 8 capstone enhancement.)
  | 'set-core'
  | 'set-orchestrator'
  | 'set-shared-deps-css'
  | 'set-theme';

/**
 * One audit-log entry. Appended to the sidecar `<registry>.history.json` on
 * every successful op. Exposed for tests + a future inspector UI.
 */
export interface AuditEntry {
  timestamp: string;
  op: AuditOp;
  /** Identifier of the affected target (mfe id, rule id, "id|customerId", ...). */
  target: string;
  /** Snapshot of the value before the op (`null` when adding a new value). */
  before: unknown;
  /** Snapshot of the value after the op (`null` when removing). */
  after: unknown;
  /** Optional human-readable reason supplied via `--reason`. */
  reason?: string;
}

/**
 * The audit log is just a JSON array of {@link AuditEntry}s. We DELIBERATELY
 * do NOT use a JSONL stream here — the file is small (one entry per authoring
 * op, not per request), atomic write-then-rename is straightforward on JSON,
 * and tooling (jq, the inspector) can query it as a single document.
 */
export type AuditLog = AuditEntry[];

/* ------------------------------------------------------------------------- *
 * Audit-log reader (defensive)
 * ------------------------------------------------------------------------- */

function readAuditLog(historyPath: string): AuditLog {
  if (!Fs.existsSync(historyPath)) return [];
  try {
    const raw = Fs.readFileSync(historyPath, 'utf8');
    if (raw.trim().length === 0) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`audit log at ${historyPath} is not a JSON array`);
    }
    return parsed as AuditLog;
  } catch (cause) {
    throw new Error(`Failed to read audit log at ${historyPath}: ${(cause as Error).message}`);
  }
}

/* ------------------------------------------------------------------------- *
 * Argument parsing — `key=value` pair lists for --default-entry et al.
 * ------------------------------------------------------------------------- */

/**
 * Parse a sequence of `key=value` argv tokens following `--<flag>` until the
 * next `--<...>` token (or end of argv). Supports values with `=` in them
 * (split on the FIRST `=`). Returns a map of key -> value plus the index AFTER
 * the last consumed token.
 *
 * Example: argv = `[..., '--default-entry', 'id=inspector', 'version=v1', 'url=https://...', '--reason', 'r']`
 * => { id: 'inspector', version: 'v1', url: 'https://...' }, nextIndex pointing
 * at `--reason`.
 */
export function parseKeyValuePairs(
  argv: string[],
  startIndex: number
): { pairs: Record<string, string>; nextIndex: number } {
  const pairs: Record<string, string> = {};
  let i = startIndex;
  while (i < argv.length) {
    const tok = argv[i];
    if (tok.startsWith('--')) break;
    const eq = tok.indexOf('=');
    if (eq <= 0) {
      throw new Error(`Expected key=value pair, got "${tok}"`);
    }
    const k = tok.slice(0, eq);
    const v = tok.slice(eq + 1);
    pairs[k] = v;
    i++;
  }
  return { pairs, nextIndex: i };
}

/** Read a `--flag <value>` option (one positional value). */
function readOption(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1) return undefined;
  const v = argv[idx + 1];
  if (v === undefined || v.startsWith('--')) {
    throw new Error(`${flag} requires a value`);
  }
  return v;
}

/* ------------------------------------------------------------------------- *
 * Mutations (pure — operate on a deep-cloned doc)
 * ------------------------------------------------------------------------- */

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function mfeEntryFromPairs(pairs: Record<string, string>, prefix: string): MfeEntry {
  const required = ['id', 'version', 'url'];
  const missing = required.filter((k) => !pairs[k]);
  if (missing.length > 0 && prefix === '--default-entry') {
    throw new Error(`--default-entry missing required key(s): ${missing.join(', ')}`);
  }
  const entry: MfeEntry = {
    version: pairs.version,
    remoteEntry: pairs.url,
    scope: pairs.scope ?? pairs.id,
    module: pairs.module ?? './public',
  };
  if (pairs.integrity !== undefined && pairs.integrity.length > 0) {
    entry.integrity = pairs.integrity;
  }
  return entry;
}

export function applySetDefaultEntry(
  doc: V2Document,
  pairs: Record<string, string>
): { next: V2Document; before: MfeEntry | null; after: MfeEntry; target: string } {
  if (!pairs.id) throw new Error('--default-entry requires id=<id>');
  const next = deepClone(doc);
  const before = next.default.mfes[pairs.id] ? deepClone(next.default.mfes[pairs.id]) : null;
  const after = mfeEntryFromPairs(pairs, '--default-entry');
  next.default.mfes[pairs.id] = after;
  return { next, before, after, target: pairs.id };
}

export function applyAddRollout(
  doc: V2Document,
  pairs: Record<string, string>
): { next: V2Document; before: V2Rollout | null; after: V2Rollout; target: string } {
  if (!pairs.ruleId) throw new Error('--add-rollout requires ruleId=<r>');
  if (!pairs.match) throw new Error('--add-rollout requires match=<json>');
  if (!pairs.override) throw new Error('--add-rollout requires override=<json>');
  let match: V2RolloutMatch;
  let override: V2Rollout['override'];
  try {
    match = JSON.parse(pairs.match);
  } catch (cause) {
    throw new Error(`--add-rollout match is not valid JSON: ${(cause as Error).message}`);
  }
  try {
    override = JSON.parse(pairs.override);
  } catch (cause) {
    throw new Error(`--add-rollout override is not valid JSON: ${(cause as Error).message}`);
  }
  if (!override || typeof override !== 'object' || !override.mfes) {
    throw new Error('--add-rollout override must be { mfes: { id: entry } }');
  }
  const next = deepClone(doc);
  const idx = next.rollouts.findIndex((r) => r.id === pairs.ruleId);
  const before = idx >= 0 ? deepClone(next.rollouts[idx]) : null;
  const newRule: V2Rollout = { id: pairs.ruleId, match, override };
  if (idx >= 0) {
    next.rollouts[idx] = newRule;
  } else {
    next.rollouts.push(newRule);
  }
  return { next, before, after: newRule, target: pairs.ruleId };
}

export function applyRemoveRollout(
  doc: V2Document,
  pairs: Record<string, string>
): { next: V2Document; before: V2Rollout | null; after: null; target: string } {
  if (!pairs.ruleId) throw new Error('--remove-rollout requires ruleId=<r>');
  const next = deepClone(doc);
  const idx = next.rollouts.findIndex((r) => r.id === pairs.ruleId);
  if (idx < 0) {
    throw new Error(`--remove-rollout: no rollout with ruleId="${pairs.ruleId}"`);
  }
  const before = deepClone(next.rollouts[idx]);
  next.rollouts.splice(idx, 1);
  return { next, before, after: null, target: pairs.ruleId };
}

export function applyTenantOverride(
  doc: V2Document,
  pairs: Record<string, string>
): { next: V2Document; before: MfeEntry | null; after: MfeEntry; target: string } {
  if (!pairs.customerId) throw new Error('--tenant-override requires customerId=<c>');
  if (!pairs.mfeId) throw new Error('--tenant-override requires mfeId=<id>');
  if (!pairs.version) throw new Error('--tenant-override requires version=<v>');
  if (!pairs.url) throw new Error('--tenant-override requires url=<u>');
  const next = deepClone(doc);
  if (!next.tenantOverrides[pairs.customerId]) {
    next.tenantOverrides[pairs.customerId] = { mfes: {} };
  }
  const layer = next.tenantOverrides[pairs.customerId];
  const before = layer.mfes[pairs.mfeId] ? deepClone(layer.mfes[pairs.mfeId]) : null;
  const after = mfeEntryFromPairs(
    {
      id: pairs.mfeId,
      version: pairs.version,
      url: pairs.url,
      scope: pairs.scope,
      module: pairs.module,
      integrity: pairs.integrity,
    },
    '--tenant-override'
  );
  layer.mfes[pairs.mfeId] = after;
  return { next, before, after, target: `${pairs.customerId}|${pairs.mfeId}` };
}

export function applyRemoveTenantOverride(
  doc: V2Document,
  pairs: Record<string, string>
): { next: V2Document; before: MfeEntry | null; after: null; target: string } {
  if (!pairs.customerId) throw new Error('--remove-tenant-override requires customerId=<c>');
  if (!pairs.mfeId) throw new Error('--remove-tenant-override requires mfeId=<id>');
  const next = deepClone(doc);
  const layer = next.tenantOverrides[pairs.customerId];
  if (!layer || !layer.mfes[pairs.mfeId]) {
    throw new Error(`--remove-tenant-override: no override for ${pairs.customerId}|${pairs.mfeId}`);
  }
  const before = deepClone(layer.mfes[pairs.mfeId]);
  delete layer.mfes[pairs.mfeId];
  // If the layer is now empty, drop it so the doc validates (a tenant layer
  // with empty `mfes` is a structural error per validateV2).
  if (Object.keys(layer.mfes).length === 0) {
    delete next.tenantOverrides[pairs.customerId];
  }
  return { next, before, after: null, target: `${pairs.customerId}|${pairs.mfeId}` };
}

/**
 * Roll back `default.mfes[id]` to the value it had BEFORE the most recent
 * change recorded in the audit log.
 *
 * The model is "undo the most recent change": find the most recent audit entry
 * whose `target === id` and whose op is `set-default-entry` OR `rollback`, and
 * set the state to that entry's `before` value. The rollback itself appends a
 * new audit entry whose `before` is the current state and `after` is the
 * restored state, so a subsequent rollback undoes THIS rollback (a rollback
 * stack — see the test "round-trip rollback restores the prior state").
 *
 * `before === null` means "the entry did not exist before that change", which
 * we model on rollback by deleting the entry — keeps the registry shape strict
 * (no entry vs. an entry with sentinel values).
 */
export function applyRollback(
  doc: V2Document,
  log: AuditLog,
  id: string
): { next: V2Document; before: MfeEntry | null; after: MfeEntry | null; target: string } {
  if (!id) throw new Error('--rollback requires id=<mfe-id>');
  const current = doc.default.mfes[id] ?? null;
  let mostRecent: AuditEntry | undefined;
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e.target !== id) continue;
    if (e.op === 'set-default-entry' || e.op === 'rollback') {
      mostRecent = e;
      break;
    }
  }
  if (!mostRecent) {
    throw new Error(`--rollback id=${id}: no audit history for "${id}" to roll back to.`);
  }
  const target = (mostRecent.before as MfeEntry | null) ?? null;
  const next = deepClone(doc);
  if (target === null) {
    // Restore "did not exist": delete the entry.
    delete next.default.mfes[id];
  } else {
    next.default.mfes[id] = target;
  }
  return { next, before: current, after: target, target: id };
}

/* ------------------------------------------------------------------------- *
 * --check-deps: build-time externals graph
 * ------------------------------------------------------------------------- */

/**
 * Per-plugin externals manifest — the value-edges emitted by `build_mfe` for one
 * plugin. The CLI reads `${externalsDir}/${id}.externals.json`. Format is a JSON
 * object with a `requires` array of peer ids. A missing file means "no edges"
 * (defensive — first deploy may not have it).
 *
 * Edges are VALUE imports — the actual `__osdBundles__.get("plugin/<peer>/public")`
 * calls captured at build time. Type-only imports are erased and therefore not
 * here, which is the whole point of building the graph from build output rather
 * than from the manifest's `requiredPlugins` (Phase-15 spike correction).
 */
export interface ExternalsFile {
  /** Plugin ids this plugin imports at build time (peer-plugin value-edges). */
  requires: string[];
  /** Optional contractVersion this plugin was built against (defaults: OSD major.minor). */
  contractVersion?: string;
}

export interface CheckDepsResult {
  ok: boolean;
  /**
   * One offender per unsatisfiable edge. `from` is the plugin with the edge,
   * `to` the missing/incompatible peer, `reason` an actionable message.
   */
  offenders: Array<{ from: string; to: string; reason: string }>;
}

function readExternals(externalsDir: string, id: string): ExternalsFile | null {
  const path = Path.join(externalsDir, `${id}.externals.json`);
  if (!Fs.existsSync(path)) return null;
  try {
    const parsed = JSON.parse(Fs.readFileSync(path, 'utf8'));
    if (!parsed || !Array.isArray(parsed.requires)) {
      throw new Error('externals file must be { requires: string[] }');
    }
    return parsed as ExternalsFile;
  } catch (cause) {
    throw new Error(`Failed to read externals at ${path}: ${(cause as Error).message}`);
  }
}

/**
 * Validate the would-be RESOLVED registry's inter-plugin dependency graph
 * against the build-time externals manifests. Resolves the doc with default
 * dimensions (`customerId: "default", userBucket: 0`) so the check applies to
 * the steady-state shape; tenant/rollout-only ids are added to the resolved set
 * so an override never silently breaks a peer.
 *
 * `expectedContractVersion` defaults to the running OSD major.minor (caller
 * passes it explicitly to keep this function pure and testable).
 */
export function checkDependencyGraph(
  doc: V2Document,
  externalsDir: string,
  expectedContractVersion: string
): CheckDepsResult {
  // Resolved set under default dimensions.
  const resolved = resolveBootManifest(doc, { customerId: 'default', userBucket: 0 });
  const resolvedIds = new Set(resolved.mfes.map((m) => m.id));

  // Also include any id that ONLY appears in a rollout/tenant layer — an
  // override that introduces a new plugin still needs its peers present.
  for (const rule of doc.rollouts) {
    for (const id of Object.keys(rule.override.mfes)) resolvedIds.add(id);
  }
  for (const customerId of Object.keys(doc.tenantOverrides)) {
    for (const id of Object.keys(doc.tenantOverrides[customerId].mfes)) resolvedIds.add(id);
  }

  const offenders: CheckDepsResult['offenders'] = [];
  for (const id of resolvedIds) {
    const ext = readExternals(externalsDir, id);
    if (!ext) continue; // No edges declared = trivially satisfiable.
    if (ext.contractVersion !== undefined && ext.contractVersion !== expectedContractVersion) {
      offenders.push({
        from: id,
        to: id,
        reason: `built against contractVersion "${ext.contractVersion}", expected "${expectedContractVersion}"`,
      });
    }
    for (const peer of ext.requires) {
      if (!resolvedIds.has(peer)) {
        offenders.push({
          from: id,
          to: peer,
          reason: `peer "${peer}" not present in resolved registry (default dimensions)`,
        });
      }
    }
  }

  return { ok: offenders.length === 0, offenders };
}

/* ------------------------------------------------------------------------- *
 * Atomic write
 * ------------------------------------------------------------------------- */

/**
 * Write `content` to `targetPath` atomically: write to a sibling temp file
 * first, then rename over the target. Same-volume renames are atomic on POSIX,
 * so a process crash mid-write leaves either the old content or the new — never
 * a half-written file.
 */
function writeAtomic(targetPath: string, content: string): void {
  const tmp = `${targetPath}.tmp.${process.pid}.${Date.now()}`;
  Fs.writeFileSync(tmp, content);
  Fs.renameSync(tmp, targetPath);
}

function historyPathFor(registryPath: string): string {
  // Adjacent file: `<registry>.history.json`. Keeps the audit log next to the
  // doc it audits without polluting the registry shape.
  return `${registryPath}.history.json`;
}

/**
 * Commit a successful op: write the new doc + the new audit log atomically.
 * If the doc write succeeds but the history write fails, the doc is rolled back
 * to its pre-op content so the contract holds (atomicity: both or neither).
 *
 * Accepts `V2Document | V3Document` — both shapes JSON-serialize cleanly and
 * the on-disk file is JSON, so the commit step is shape-agnostic. The CALLER
 * (the v2 / v3 branch in {@link runUpdateCliV2}) is responsible for validating
 * the doc shape before calling this; this step is purely a durable-write
 * primitive.
 */
function commitOp(
  registryPath: string,
  prevDocBytes: string,
  newDoc: V2Document | V3Document,
  newLog: AuditLog
): void {
  const historyPath = historyPathFor(registryPath);
  const newDocBytes = JSON.stringify(newDoc, null, 2) + '\n';
  const newLogBytes = JSON.stringify(newLog, null, 2) + '\n';

  // Write the doc first; if the history write then fails, restore the doc.
  writeAtomic(registryPath, newDocBytes);
  try {
    writeAtomic(historyPath, newLogBytes);
  } catch (cause) {
    // Roll back the doc write so neither file reflects the partial op.
    try {
      writeAtomic(registryPath, prevDocBytes);
    } catch {
      // If the rollback ALSO fails the operator has bigger problems; surface
      // the original cause so they can recover from backup.
    }
    throw cause;
  }
}

/* ------------------------------------------------------------------------- *
 * CLI entrypoint
 * ------------------------------------------------------------------------- */

const USAGE_V2 = `Usage: node scripts/update_registry [v2/v3 options]

v2 modes (Phase 13 Story 4):
  --default-entry id=<id> version=<v> url=<u> [scope=<s>] [module=<m>] [integrity=<i>]
  --add-rollout ruleId=<r> match=<json> override=<json>
  --remove-rollout ruleId=<r>
  --tenant-override customerId=<c> mfeId=<id> version=<v> url=<u> [scope=<s>] [module=<m>] [integrity=<i>]
  --remove-tenant-override customerId=<c> mfeId=<id>
  --rollback id=<mfe-id>
  --check-deps [--externals-dir <p>]

v3 asset modes (Phase 16 Story 2 — registry-managed core/orchestrator/themes/shared-deps-css):
  --update-core <build-manifest>           Set the global v3 \`core\` field.
  --update-orchestrator <build-manifest>   Set the global v3 \`orchestrator\` field.
  --update-shared-deps-css <build-manifest>
                                           Set the global v3 \`sharedDepsCss\` field.
  --update-theme <name> <build-manifest>   Set the per-theme v3 \`themes[<name>]\` entry.

  Each --update-* mode AUTO-MIGRATES a v1/v2 doc to v3 forward-only (with an
  audit entry \`migrate-v2-to-v3\`) before applying the change. v3 docs are
  validated strictly. When \`MFE_REGISTRY_SIGNING_KEY\` is set (and
  \`MFE_REGISTRY_KEY_ID\` for the envelope), the new doc is re-signed.
  --cdn-base-url <u> overrides the URL prefix the descriptor is stamped with
  (defaults to REGISTRY_BASE_URL or http://localhost:8080).

Common options:
  --registry-path <p>     v2/v3 registry document on disk (defaults to MFE_REGISTRY_PATH).
  --reason "<text>"       Optional human-readable reason; recorded in the audit log.
  --check-deps            Run the dependency scan-gate before writing (v2 ops only).
  --externals-dir <p>     Directory of <id>.externals.json files (build-time edges).
                          Defaults to a sibling of the registry file.
  --contract-version <v>  contractVersion peers must match (default: OSD major.minor).
`;

interface RunOptions {
  argv: string[];
  env: NodeJS.ProcessEnv;
  out: UpdateCliV2Console;
  /** Date generator (injectable for deterministic audit timestamps in tests). */
  now: () => Date;
  /** Default OSD core version (drives the default `contractVersion`). */
  osdVersion: string;
}

/** The set of v3-asset CLI flags introduced in Phase 16 Story 2. */
const V3_ASSET_FLAGS = [
  '--update-core',
  '--update-orchestrator',
  '--update-shared-deps-css',
  '--update-theme',
] as const;

/** Detect whether the argv is a v3-asset mode (Phase 16 Story 2). */
export function isV3AssetMode(argv: string[]): boolean {
  return V3_ASSET_FLAGS.some((flag) => argv.includes(flag));
}

/**
 * Detect whether the argv is a v2 OR v3-asset mode (so the dispatcher routes
 * here). Folded together because both modes are authored by THIS CLI; the
 * v1-only path (full regen / --from-manifest / --plugin) lives in `update_cli.ts`.
 */
export function isV2Mode(argv: string[]): boolean {
  return (
    argv.includes('--default-entry') ||
    argv.includes('--add-rollout') ||
    argv.includes('--remove-rollout') ||
    argv.includes('--tenant-override') ||
    argv.includes('--remove-tenant-override') ||
    argv.includes('--rollback') ||
    isV3AssetMode(argv)
  );
}

export function runUpdateCliV2(options: RunOptions): number {
  const { argv, env, out, now, osdVersion } = options;
  if (argv.includes('--help') || argv.includes('-h')) {
    out.log(USAGE_V2);
    return 0;
  }

  // Phase 16 Story 2: v3 asset modes dispatch to a separate handler. They
  // operate on a V3Document (auto-migrating from v1/v2), not the V2Document
  // the rest of this CLI uses, so the read+apply+commit pipeline is distinct.
  if (isV3AssetMode(argv)) {
    return runUpdateCliV3Asset(options);
  }

  try {
    const registryPath = readOption(argv, '--registry-path') ?? env.MFE_REGISTRY_PATH;
    if (!registryPath) {
      throw new Error('No registry path: pass --registry-path <p> or set MFE_REGISTRY_PATH.');
    }
    const reason = readOption(argv, '--reason');

    // Read + auto-migrate (PRD: a v1 doc is auto-treated as v2 default-only).
    const prevDocBytes = Fs.readFileSync(registryPath, 'utf8');
    const doc = coerceToV2Document(JSON.parse(prevDocBytes));
    const log = readAuditLog(historyPathFor(registryPath));

    let result: {
      next: V2Document;
      before: unknown;
      after: unknown;
      target: string;
      op: AuditOp;
    };

    if (argv.includes('--default-entry')) {
      const idx = argv.indexOf('--default-entry');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applySetDefaultEntry(doc, pairs);
      result = { ...r, op: 'set-default-entry' };
    } else if (argv.includes('--add-rollout')) {
      const idx = argv.indexOf('--add-rollout');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applyAddRollout(doc, pairs);
      result = { ...r, op: 'add-rollout' };
    } else if (argv.includes('--remove-rollout')) {
      const idx = argv.indexOf('--remove-rollout');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applyRemoveRollout(doc, pairs);
      result = { ...r, op: 'remove-rollout' };
    } else if (argv.includes('--tenant-override')) {
      const idx = argv.indexOf('--tenant-override');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applyTenantOverride(doc, pairs);
      result = { ...r, op: 'set-tenant-override' };
    } else if (argv.includes('--remove-tenant-override')) {
      const idx = argv.indexOf('--remove-tenant-override');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const r = applyRemoveTenantOverride(doc, pairs);
      result = { ...r, op: 'remove-tenant-override' };
    } else if (argv.includes('--rollback')) {
      const idx = argv.indexOf('--rollback');
      const { pairs } = parseKeyValuePairs(argv, idx + 1);
      const id = pairs.id;
      const r = applyRollback(doc, log, id);
      result = { ...r, op: 'rollback' };
    } else {
      throw new Error('No v2 op specified. Try --help.');
    }

    // Validate the would-be doc strictly before writing — a malformed mutation
    // is a CLI bug + must NOT corrupt the on-disk doc.
    assertValidV2Document(result.next);

    // --check-deps gate (optional; rejects with non-zero exit + no write).
    if (argv.includes('--check-deps')) {
      const externalsDir =
        readOption(argv, '--externals-dir') ?? Path.join(Path.dirname(registryPath), 'externals');
      const expectedContractVersion =
        readOption(argv, '--contract-version') ?? deriveDefaultContractVersion(osdVersion);
      const check = checkDependencyGraph(result.next, externalsDir, expectedContractVersion);
      if (!check.ok) {
        out.error(
          `--check-deps: dependency graph unsatisfiable (${check.offenders.length} offender(s)):`
        );
        for (const o of check.offenders) {
          out.error(`  ${o.from} -> ${o.to}: ${o.reason}`);
        }
        return 2;
      }
    }

    // Append audit entry, commit atomically (doc + history).
    const auditEntry: AuditEntry = {
      timestamp: now().toISOString(),
      op: result.op,
      target: result.target,
      before: result.before,
      after: result.after,
      ...(reason !== undefined ? { reason } : {}),
    };
    const newLog = [...log, auditEntry];
    commitOp(registryPath, prevDocBytes, result.next, newLog);

    out.log(`${result.op} target=${result.target} -> ${registryPath} (history appended)`);
    return 0;
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function deriveDefaultContractVersion(osdVersion: string): string {
  // Major.minor only, e.g. `3.5.0` -> `3.5`. A non-semver input falls back to
  // the input itself so the caller still gets a deterministic value.
  const m = /^(\d+)\.(\d+)/.exec(osdVersion);
  return m ? `${m[1]}.${m[2]}` : osdVersion;
}

/* ------------------------------------------------------------------------- *
 * Phase 16 Story 2: v3 asset modes
 * (--update-core / --update-orchestrator / --update-theme / --update-shared-deps-css)
 * ------------------------------------------------------------------------- */

/** Default URL prefix the asset descriptor's URL is stamped against. */
const DEFAULT_V3_ASSET_BASE_URL = 'http://localhost:8080';

/**
 * Read a `--update-<asset> <build-manifest>` option from argv. Mirrors
 * {@link readOption} but is broken out so the caller can detect "flag absent"
 * (return undefined) versus "flag present but value missing" (throws).
 */
function readManifestPathOption(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1) return undefined;
  const v = argv[idx + 1];
  if (v === undefined || v.startsWith('--')) {
    throw new Error(`${flag} requires a build-manifest path`);
  }
  return v;
}

/**
 * Read `--update-theme <name> <build-manifest>` (two-value flag). Throws when
 * either positional value is missing or another flag intrudes.
 */
function readUpdateThemeArgs(argv: string[]): { themeName: string; manifestPath: string } | null {
  const idx = argv.indexOf('--update-theme');
  if (idx === -1) return null;
  const name = argv[idx + 1];
  const manifestPath = argv[idx + 2];
  if (name === undefined || name.startsWith('--')) {
    throw new Error('--update-theme requires <name> <build-manifest>');
  }
  if (manifestPath === undefined || manifestPath.startsWith('--')) {
    throw new Error(`--update-theme ${name} requires a build-manifest path`);
  }
  return { themeName: name, manifestPath };
}

/**
 * Apply a build manifest to a v3 doc, returning the v3-asset apply result
 * (next/before/after/target + the audit op kind). Centralised so the dispatch
 * branch is a single switch.
 */
function applyV3AssetFromManifest(
  doc: V3Document,
  manifest: V3AssetBuildManifest,
  baseUrl: string
): { next: V3Document; before: unknown; after: unknown; target: string; op: AuditOp } {
  const descriptor: V3AssetDescriptor = manifestToAssetDescriptor(manifest, baseUrl);
  switch (manifest.assetKind) {
    case 'core': {
      const r = applySetCore(doc, descriptor);
      return { ...r, op: 'set-core' };
    }
    case 'orchestrator': {
      const r = applySetOrchestrator(doc, descriptor);
      return { ...r, op: 'set-orchestrator' };
    }
    case 'shared-deps-css': {
      const r = applySetSharedDepsCss(doc, descriptor);
      return { ...r, op: 'set-shared-deps-css' };
    }
    case 'theme': {
      if (!manifest.themeName) {
        throw new Error('applyV3AssetFromManifest: theme manifest is missing themeName');
      }
      const r = applySetTheme(doc, manifest.themeName, descriptor);
      return { ...r, op: 'set-theme' };
    }
    default: {
      const exhaustive: never = manifest.assetKind;
      throw new Error(`applyV3AssetFromManifest: unknown assetKind ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * Re-sign a v3 doc when the operator has set `MFE_REGISTRY_SIGNING_KEY` (and
 * optionally `MFE_REGISTRY_KEY_ID` for the envelope). Phase 12's `signRegistry`
 * canonicalises by stripping `signature` and serializing with sorted keys; the
 * canonicalisation is shape-agnostic, so signing a v3 doc works without any
 * changes to the signer. Returns the doc unchanged when signing is not enabled.
 */
function maybeReSignV3(doc: V3Document, env: NodeJS.ProcessEnv): V3Document {
  const secret = env.MFE_REGISTRY_SIGNING_KEY;
  if (typeof secret !== 'string' || secret.length === 0) {
    return doc;
  }
  const keyId =
    typeof env.MFE_REGISTRY_KEY_ID === 'string' && env.MFE_REGISTRY_KEY_ID.length > 0
      ? env.MFE_REGISTRY_KEY_ID
      : 'default';
  const key: RegistrySigningKey = {
    keyId,
    secret,
    algorithm: REGISTRY_SIGNATURE_ALGORITHM,
  };
  // signRegistry is typed `Registry → Registry` but only manipulates the
  // `signature` field via canonicalRegistryString (which accepts any object).
  // Cast through unknown so the call type-checks; the runtime behaviour is
  // shape-agnostic. We carefully re-attach the signature into the V3Document
  // shape afterwards so the field appears on the returned object.
  const signed = signRegistry((doc as unknown) as Parameters<typeof signRegistry>[0], key);
  return (signed as unknown) as V3Document;
}

/**
 * Phase 16 Story 2 — v3 asset CLI entrypoint. Routed to from
 * {@link runUpdateCliV2} when {@link isV3AssetMode} matches.
 *
 * Pipeline (mirrors the v2 pipeline but operates on V3Document):
 *  1. Read prev doc bytes, coerce to V3Document (auto-migrate v1/v2 → v3).
 *  2. When the on-disk shape was v1 or v2, append a `migrate-v2-to-v3` audit
 *     entry FIRST so the history records the schemaVersion transition.
 *  3. Read the build manifest from disk; build an asset descriptor; apply.
 *  4. Validate the would-be v3 doc strictly (assertValidV3Document).
 *  5. Optionally re-sign (when MFE_REGISTRY_SIGNING_KEY is set).
 *  6. Append the set-* audit entry; commit (doc + history) atomically.
 *
 * Returns 0 on success, 1 on validation/IO error.
 */
function runUpdateCliV3Asset(options: RunOptions): number {
  const { argv, env, out, now } = options;
  try {
    const registryPath = readOption(argv, '--registry-path') ?? env.MFE_REGISTRY_PATH;
    if (!registryPath) {
      throw new Error('No registry path: pass --registry-path <p> or set MFE_REGISTRY_PATH.');
    }
    const reason = readOption(argv, '--reason');
    const baseUrl =
      readOption(argv, '--cdn-base-url') ?? env.REGISTRY_BASE_URL ?? DEFAULT_V3_ASSET_BASE_URL;

    const prevDocBytes = Fs.readFileSync(registryPath, 'utf8');
    const prevParsed = JSON.parse(prevDocBytes);
    const prevShape = detectRegistryShape(prevParsed);
    // Coerce — for v1/v2 input, this is the migration moment; for v3 input
    // it's a no-op. The descriptor will be applied to the resulting v3 doc.
    const docPreMigration = coerceToV3Document(prevParsed);
    const log = readAuditLog(historyPathFor(registryPath));

    // Resolve the manifest path + which set-* op based on the flag set.
    const corePath = readManifestPathOption(argv, '--update-core');
    const orchestratorPath = readManifestPathOption(argv, '--update-orchestrator');
    const sharedDepsCssPath = readManifestPathOption(argv, '--update-shared-deps-css');
    const themeArgs = readUpdateThemeArgs(argv);
    const flagsSet = [corePath, orchestratorPath, sharedDepsCssPath, themeArgs].filter(
      (v) => v !== undefined && v !== null
    ).length;
    if (flagsSet === 0) {
      throw new Error('No v3 asset op specified. Try --help.');
    }
    if (flagsSet > 1) {
      throw new Error(
        'Only one --update-* flag is allowed per invocation ' +
          '(pass them as separate calls so each gets its own audit entry).'
      );
    }

    let manifestPath: string;
    let expectedKind: V3AssetBuildManifest['assetKind'];
    let expectedThemeName: string | undefined;
    if (corePath !== undefined) {
      manifestPath = corePath;
      expectedKind = 'core';
    } else if (orchestratorPath !== undefined) {
      manifestPath = orchestratorPath;
      expectedKind = 'orchestrator';
    } else if (sharedDepsCssPath !== undefined) {
      manifestPath = sharedDepsCssPath;
      expectedKind = 'shared-deps-css';
    } else {
      // themeArgs is non-null by the flagsSet>=1 check.
      manifestPath = themeArgs!.manifestPath;
      expectedKind = 'theme';
      expectedThemeName = themeArgs!.themeName;
    }

    const manifest = readV3AssetBuildManifest(manifestPath);
    // Guard against an operator passing the wrong manifest to a flag (e.g.
    // `--update-core <theme manifest>`). A mismatch here is always a CLI bug,
    // never a registry issue.
    if (manifest.assetKind !== expectedKind) {
      throw new Error(
        `${flagToString(corePath, orchestratorPath, sharedDepsCssPath, themeArgs)}: ` +
          `manifest at ${manifestPath} has assetKind="${manifest.assetKind}", expected "${expectedKind}"`
      );
    }
    if (expectedKind === 'theme' && manifest.themeName !== expectedThemeName) {
      throw new Error(
        `--update-theme ${expectedThemeName}: ` +
          `manifest at ${manifestPath} has themeName="${manifest.themeName}", expected "${expectedThemeName}"`
      );
    }

    // Apply the change in memory.
    const applied = applyV3AssetFromManifest(docPreMigration, manifest, baseUrl);

    // Validate strictly before any write — a malformed mutation must NEVER
    // corrupt the on-disk doc.
    assertValidV3Document(applied.next);

    // Re-sign when MFE_REGISTRY_SIGNING_KEY is set (matches Phase 12's signing
    // posture: if the registry is signed today, it stays signed after every op).
    const signedDoc = maybeReSignV3(applied.next, env);

    // Build the audit-log entries. When the on-disk shape was v1/v2, the first
    // v3 write IS the schemaVersion migration — record it as a distinct prior
    // audit entry so a future inspector can see the transition clearly.
    const newEntries: AuditEntry[] = [];
    if (prevShape === 'v1' || prevShape === 'v2') {
      newEntries.push({
        timestamp: now().toISOString(),
        op: 'migrate-v2-to-v3',
        target: `schemaVersion:${prevShape}->${SCHEMA_VERSION_V3}`,
        before: prevShape,
        after: SCHEMA_VERSION_V3,
        ...(reason !== undefined ? { reason } : {}),
      });
    }
    newEntries.push({
      timestamp: now().toISOString(),
      op: applied.op,
      target: applied.target,
      before: applied.before,
      after: applied.after,
      ...(reason !== undefined ? { reason } : {}),
    });

    const newLog = [...log, ...newEntries];
    commitOp(registryPath, prevDocBytes, signedDoc, newLog);

    out.log(`${applied.op} target=${applied.target} -> ${registryPath} (history appended)`);
    return 0;
  } catch (error) {
    out.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function flagToString(
  corePath: string | undefined,
  orchestratorPath: string | undefined,
  sharedDepsCssPath: string | undefined,
  themeArgs: { themeName: string; manifestPath: string } | null
): string {
  if (corePath !== undefined) return '--update-core';
  if (orchestratorPath !== undefined) return '--update-orchestrator';
  if (sharedDepsCssPath !== undefined) return '--update-shared-deps-css';
  if (themeArgs !== null) return `--update-theme ${themeArgs.themeName}`;
  return '(unknown)';
}
