/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { SavedObjectsClientContract } from 'src/core/public';
import { SavedDashboardPanel } from '../../types';

export const PANEL_TITLE_TOKEN = '{{panelTitle}}';
export const DASHBOARD_TITLE_TOKEN = '{{dashboardTitle}}';
export const DEFAULT_PANEL_TITLE_TEMPLATE = `${PANEL_TITLE_TOKEN} (copy)`;

const BATCH_SIZE = 20;

export interface CopyDashboardPanelsResult {
  /** Panels repointed to their copies. Panels that failed to copy keep the original id. */
  panels: SavedDashboardPanel[];
  /** Titles (or type:id) of panels that could not be copied. */
  failures: string[];
}

/** A template must be non-empty and include {{panelTitle}}. */
export function isPanelTitleTemplateValid(template: string) {
  return template.trim().length > 0 && template.includes(PANEL_TITLE_TOKEN);
}

export function renderPanelTitle(template: string, panelTitle: string, dashboardTitle: string) {
  // One pass, so a token inside the panel title itself is not expanded.
  return template.replace(/\{\{(panelTitle|dashboardTitle)\}\}/g, (match, token) =>
    token === 'panelTitle' ? panelTitle : dashboardTitle
  );
}

export function createAbortError() {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

/**
 * Copy the saved object behind every by-reference panel (one level only; the
 * copies keep their own references, e.g. index patterns, shared) and return the
 * panels repointed to the copies. Panels that share an object share its copy.
 * On abort, no further request is sent. Copies already created are never deleted.
 */
export async function copyDashboardPanels(
  client: SavedObjectsClientContract,
  panels: SavedDashboardPanel[],
  options: {
    titleTemplate: string;
    dashboardTitle: string;
    signal?: AbortSignal;
    /** Called once a copy has been created. */
    onCopied?: () => void;
  }
): Promise<CopyDashboardPanelsResult> {
  const { titleTemplate, dashboardTitle, signal, onCopied } = options;
  const failed = new Map<string, string>(); // `${type}:${id}` -> label
  const copyIds = new Map<string, string>(); // `${type}:${id}` -> copy id
  const keyOf = (p: { type: string; id?: string }) => `${p.type}:${p.id}`;
  const objects = _.uniqBy(
    panels.filter((p) => p.id),
    keyOf
  ).map((p) => ({ type: p.type, id: p.id! }));

  for (const batch of _.chunk(objects, BATCH_SIZE)) {
    throwIfAborted(signal);
    const { savedObjects: sources } = await client.bulkGet<{ title?: string }>(batch);

    const copies = batch.flatMap((object, i) => {
      const source = sources[i];
      if (source.error) {
        failed.set(keyOf(object), keyOf(object));
        return [];
      }
      const attributes = _.cloneDeep(source.attributes);
      if (attributes.title !== undefined) {
        attributes.title = renderPanelTitle(titleTemplate, attributes.title, dashboardTitle);
      }
      return [{ object, attributes, source }];
    });
    if (!copies.length) continue;

    throwIfAborted(signal);
    const { savedObjects: results } = await client.bulkCreate(
      copies.map(({ object, attributes, source }) => ({
        type: object.type,
        attributes,
        references: _.cloneDeep(source.references),
        migrationVersion: source.migrationVersion,
      }))
    );
    results.forEach((result, i) => {
      const { object, source } = copies[i];
      if (result.error) {
        failed.set(keyOf(object), source.attributes.title ?? keyOf(object));
      } else {
        copyIds.set(keyOf(object), result.id);
      }
    });
    if (results.some((result) => !result.error)) onCopied?.();
  }
  throwIfAborted(signal);

  return {
    panels: panels.map((p) => {
      const copyId = p.id && copyIds.get(keyOf(p));
      return copyId ? { ...p, id: copyId } : p;
    }),
    // One entry per panel, so a shared object that failed counts every panel using it.
    failures: panels.filter((p) => p.id && failed.has(keyOf(p))).map((p) => failed.get(keyOf(p))!),
  };
}
