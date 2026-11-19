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
  /** Shown title of each panel that failed to copy (custom title, else object title or type:id). */
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

/**
 * An explore object shows its chart title (`visualization.title`) instead of its own title when
 * set, so the copy renders it too. A value that is not JSON or has no non-empty `title` is kept.
 */
function renderExploreChartTitle(visualization: string, render: (title: string) => string) {
  try {
    const parsed = JSON.parse(visualization);
    if (!parsed || typeof parsed.title !== 'string' || !parsed.title) return visualization;
    return JSON.stringify({ ...parsed, title: render(parsed.title) });
  } catch {
    return visualization;
  }
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
  const render = (title: string) => renderPanelTitle(titleTemplate, title, dashboardTitle);
  const failed = new Map<string, string>(); // `${type}:${id}` -> label
  const copyIds = new Map<string, string>(); // `${type}:${id}` -> copy id
  const keyOf = (p: { type: string; id?: string }) => `${p.type}:${p.id}`;
  const objects = _.uniqBy(
    panels.filter((p) => p.id),
    keyOf
  ).map((p) => ({ type: p.type, id: p.id! }));

  for (const batch of _.chunk(objects, BATCH_SIZE)) {
    throwIfAborted(signal);
    const { savedObjects: sources } = await client.bulkGet<{
      title?: string;
      visualization?: string;
    }>(batch);

    const copies = batch.flatMap((object, i) => {
      const source = sources[i];
      if (source.error) {
        failed.set(keyOf(object), keyOf(object));
        return [];
      }
      const attributes = _.cloneDeep(source.attributes);
      if (attributes.title !== undefined) {
        attributes.title = render(attributes.title);
      }
      if (object.type === 'explore' && typeof attributes.visualization === 'string') {
        attributes.visualization = renderExploreChartTitle(attributes.visualization, render);
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
      if (!copyId) return p;
      // A custom panel title is shown instead of the object title, so it gets the template too.
      // An empty one hides the title on purpose and is kept.
      const copy = { ...p, id: copyId };
      if (typeof p.title === 'string' && p.title) copy.title = render(p.title);
      // A title in embeddableConfig (e.g. written by another app) overrides panel.title.
      const configTitle = p.embeddableConfig?.title;
      if (typeof configTitle === 'string' && configTitle) {
        copy.embeddableConfig = { ...p.embeddableConfig, title: render(configTitle) };
      }
      return copy;
    }),
    // One entry per panel, so a shared object that failed counts every panel using it.
    // Name it by the title the panel shows, so a custom title is listed rather than an id.
    failures: panels
      .filter((p) => p.id && failed.has(keyOf(p)))
      .map((p) => customTitleOf(p) || failed.get(keyOf(p))!),
  };
}

/** The custom title a panel shows instead of its object title, if any. */
function customTitleOf(p: SavedDashboardPanel) {
  const configTitle = p.embeddableConfig?.title;
  // An empty title in embeddableConfig still wins: the panel shows no custom title.
  if (typeof configTitle === 'string') return configTitle || undefined;
  return typeof p.title === 'string' && p.title ? p.title : undefined;
}
