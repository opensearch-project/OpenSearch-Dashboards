/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum WorkerLabels {
  PPL = 'ppl',
  JSON = 'json',
  XJSON = 'xjson',
}

/**
 * Worker filenames (relative paths).
 * Monaco package only defines its worker files, not server routing.
 */
export const WORKER_FILES = {
  ppl: 'ppl.editor.worker.js',
  json: 'json.editor.worker.js',
  xjson: 'xjson.editor.worker.js',
} as const;

export type WorkerId = keyof typeof WORKER_FILES;

/**
 * Get the full URL for a worker by its ID.
 *
 * @param workerId - The worker identifier
 * @param buildHash - The build hash for cache-busting (e.g., buildNum.toString())
 * @returns The full URL for the worker, or undefined if not found
 */
export function getWorkerUrl(workerId: string, buildHash: number): string | undefined {
  const filename = WORKER_FILES[workerId as WorkerId];
  return filename ? `/${buildHash}/editor/workers/${filename}` : undefined;
}

/**
 * Helper to generate all worker URLs with the given buildHash.
 *
 * @param buildHash - The build hash for cache-busting (e.g., buildNum.toString())
 * @returns Object with all worker URLs
 */
export function getWorkerUrls(buildHash: number) {
  return {
    ppl: `/${buildHash}/editor/workers/${WORKER_FILES.ppl}`,
    json: `/${buildHash}/editor/workers/${WORKER_FILES.json}`,
    xjson: `/${buildHash}/editor/workers/${WORKER_FILES.xjson}`,
  } as const;
}
