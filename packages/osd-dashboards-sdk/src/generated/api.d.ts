/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * Generated from docs/openapi/saved_objects/saved_objects.yml
 * Re-generate with: npm run generate:api
 */

/** Saved object reference for relationship tracking. */
export interface SavedObjectReference {
  /** Reference name used to map back into saved object attributes. */
  name: string;
  /** The saved object type of the referenced object. */
  type: string;
  /** The saved object id of the referenced object. */
  id: string;
}

// ---------------------------------------------------------------------------
// _bulk_apply
// ---------------------------------------------------------------------------

export interface BulkApplyResource {
  /** Saved object type (e.g. dashboard, visualization, index-pattern, search). */
  type: string;
  /** Unique saved object id. */
  id: string;
  /** Saved object attributes — schema depends on type. */
  attributes: Record<string, unknown>;
  /** Key-value labels for tagging and grouping. */
  labels?: Record<string, string>;
  /** References to other saved objects. */
  references?: SavedObjectReference[];
}

export interface BulkApplyOptions {
  /** If true, compute what would change without writing. */
  dryRun?: boolean;
  /** If false, fail when an object already exists with different attributes. */
  overwrite?: boolean;
}

export interface BulkApplyRequest {
  resources: BulkApplyResource[];
  options?: BulkApplyOptions;
}

export type ApplyResultStatus = 'created' | 'updated' | 'unchanged' | 'error';

export interface ApplyResult {
  type: string;
  id: string;
  status: ApplyResultStatus;
  /** Error message if status is 'error'. */
  error?: string;
}

export interface BulkApplyResponse {
  results: ApplyResult[];
}

// ---------------------------------------------------------------------------
// _diff
// ---------------------------------------------------------------------------

export interface DiffRequest {
  /** Saved object type. */
  type: string;
  /** Saved object id. */
  id: string;
  /** The local attributes to compare against the deployed version. */
  attributes: Record<string, unknown>;
}

export type DiffStatus = 'new' | 'unchanged' | 'updated';

export interface DiffEntry {
  op: 'add' | 'remove' | 'replace';
  /** Dot-delimited path to the changed field. */
  path: string;
  /** Previous value (present for remove and replace). */
  oldValue?: unknown;
  /** New value (present for add and replace). */
  newValue?: unknown;
}

export interface DiffResponse {
  status: DiffStatus;
  /** List of diff entries (present only when status is 'updated'). */
  diff?: DiffEntry[];
}

// ---------------------------------------------------------------------------
// _export_clean
// ---------------------------------------------------------------------------

export interface ExportCleanRequest {
  /** Saved object type(s) to export. */
  type?: string | string[];
  /** Specific objects to export. */
  objects?: Array<{ type: string; id: string }>;
  /** Query string to filter objects. */
  search?: string;
}

export interface CleanSavedObject {
  type: string;
  id: string;
  /** Saved object attributes — schema depends on type. */
  attributes: Record<string, unknown>;
  references?: SavedObjectReference[];
  migrationVersion?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// _validate
// ---------------------------------------------------------------------------

export type ValidationMode = 'schema' | 'full';

export interface ValidateRequest {
  /** Saved object type to validate against. */
  type: string;
  /** Attributes to validate against the type's JSON Schema. */
  attributes: Record<string, unknown>;
  /** References to check in `full` mode. */
  references?: SavedObjectReference[];
}

export interface ValidationError {
  /** JSON path to the invalid field. */
  path: string;
  /** Validation error message. */
  message: string;
  schemaPath: string;
}

export interface ValidateResponse {
  valid: boolean;
  errors?: ValidationError[];
  /** Non-fatal warnings. */
  warnings?: string[];
}

// ---------------------------------------------------------------------------
// _schemas
// ---------------------------------------------------------------------------

export interface SchemaEntry {
  type: string;
  version: string;
  /** URL to retrieve the full JSON Schema. */
  url: string;
}

export interface SchemaListResponse {
  schemas: SchemaEntry[];
}

// ---------------------------------------------------------------------------
// _unlock
// ---------------------------------------------------------------------------

export interface UnlockResponse {
  type: string;
  id: string;
  /** Whether the lock was actually removed. */
  unlocked: boolean;
  message: string;
}

// ---------------------------------------------------------------------------
// Common saved object CRUD types
// ---------------------------------------------------------------------------

export interface SavedObject<T = Record<string, unknown>> {
  type: string;
  id: string;
  attributes: T;
  references?: SavedObjectReference[];
  version?: string;
  migrationVersion?: Record<string, unknown>;
  namespaces?: string[];
  workspaces?: string[];
}

export interface FindOptions {
  type: string | string[];
  per_page?: number;
  page?: number;
  search?: string;
  default_search_operator?: 'AND' | 'OR';
  search_fields?: string | string[];
  sort_field?: string;
  has_reference?: { type: string; id: string };
  fields?: string | string[];
  filter?: string;
  namespace?: string | string[];
  workspace?: string | string[];
}

export interface FindResponse<T = Record<string, unknown>> {
  saved_objects: Array<SavedObject<T>>;
  total: number;
  per_page: number;
  page: number;
}
