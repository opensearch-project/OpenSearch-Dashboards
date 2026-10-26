/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { SavedObjectsClientContract } from 'src/core/public';
import { SavedDashboardPanel } from '../../types';
import {
  renderPanelCopyTitle,
  DEFAULT_PANEL_COPY_TITLE_TEMPLATE,
} from './panel_copy_title_template';

/**
 * Max panels copied per bulk request. Dashboards usually have well under this
 * many panels (one request), and larger ones are chunked. Mirrors the
 * saved-objects find default page size (FIND_DEFAULT_PER_PAGE = 20).
 */
export const MAX_COPY_PANELS_BATCH_SIZE = 20;

export interface CreatedPanelCopy {
  type: string;
  id: string;
}

/** A panel whose backing object could not be copied (get or create failed). */
export interface PanelCopyFailure {
  /** The dashboard panelIndex of the panel that failed to copy. */
  panelIndex: string;
  type: string;
  /** The source saved object id. */
  id: string;
  /** The source title, when known, for display. */
  title?: string;
}

export interface CopyDashboardPanelsOptions {
  /**
   * Title template for copied panels, e.g. "{{panelTitle}} (copy)". Tokens are
   * substituted per panel. Defaults to {@link DEFAULT_PANEL_COPY_TITLE_TEMPLATE}.
   */
  titleTemplate?: string;
  /** New dashboard title, substituted for the {{dashboardTitle}} token. */
  dashboardTitle?: string;
  /** Abort signal; when aborted no further bulk batches are dispatched. */
  signal?: AbortSignal;
}

/** Thrown when a copy is aborted via {@link CopyDashboardPanelsOptions.signal}. */
export class CopyPanelsAbortError extends Error {
  constructor() {
    super('Copy panels aborted');
    this.name = 'AbortError';
  }
}

export interface CopyDashboardPanelsResult {
  /**
   * The panels array with each successfully-copied by-reference panel's `id`
   * repointed to its new copy. Panels whose copy failed are left pointing at the
   * original object (still shared). Layout fields (gridData, panelIndex,
   * embeddableConfig, title) are preserved, so layout/sections are unchanged.
   */
  panels: SavedDashboardPanel[];
  /** The saved objects created, for compensating cleanup on a later failure. */
  createdObjects: CreatedPanelCopy[];
  /** Panels whose backing object could not be copied (left shared). */
  failures: PanelCopyFailure[];
}

/**
 * Best-effort delete of panel copies created by {@link copyDashboardPanels}.
 * Used to compensate when a later step fails so no orphan copies are left.
 */
export async function rollbackPanelCopies(
  client: SavedObjectsClientContract,
  createdObjects: CreatedPanelCopy[]
): Promise<void> {
  await Promise.all(
    createdObjects.map((obj) => client.delete(obj.type, obj.id).catch(() => undefined))
  );
}

/**
 * Duplicates the backing saved object of every by-reference panel and returns a
 * new panels array repointed to the copies.
 *
 * Scope (deliberately one level): only the object a panel points at directly is
 * copied. Everything that object references downstream (index-pattern, dataset,
 * data-source, a saved search linked by a visualization, ...) is kept as-is in
 * the copy's `references`, so those stay shared with the source dashboard.
 *
 * Mechanics: sources are read with `bulkGet` and copies written with
 * `bulkCreate`, both chunked to {@link MAX_COPY_PANELS_BATCH_SIZE}. New ids are
 * pre-generated (uuid) so the dashboard's panel references can be repointed
 * without depending on per-create responses.
 *
 * By-value panels (no `id`/savedObjectId) are already self-contained and are
 * passed through unchanged. Two panels referencing the SAME object each get
 * their own independent copy (intra-dashboard sharing is not preserved) -- this
 * matches the "copy each panel's own backing object" intent.
 *
 * Partial failure: a panel whose source get or whose create fails is reported in
 * `failures` and left pointing at the original object (still shared); it is not
 * retried. Callers can surface the list to the user.
 *
 * Abort: when `signal` aborts, no further batches are dispatched, any copies
 * already created are rolled back, and {@link CopyPanelsAbortError} is thrown.
 */
export async function copyDashboardPanels(
  client: SavedObjectsClientContract,
  panels: SavedDashboardPanel[],
  options: CopyDashboardPanelsOptions = {}
): Promise<CopyDashboardPanelsResult> {
  const {
    titleTemplate = DEFAULT_PANEL_COPY_TITLE_TEMPLATE,
    dashboardTitle = '',
    signal,
  } = options;

  // By-reference panels are the ones with a backing saved object id.
  const refPanels = panels.filter((p) => !!p.id);
  if (refPanels.length === 0) {
    return { panels: [...panels], createdObjects: [], failures: [] };
  }

  const createdObjects: CreatedPanelCopy[] = [];
  const failures: PanelCopyFailure[] = [];
  // panelIndex -> new copy id, for repointing afterwards.
  const newIdByPanelIndex = new Map<string, string>();

  try {
    // 1) bulkGet every source object (chunked).
    // panel.type is both the embeddable type and the saved object/reference type.
    const sourceByPanelIndex = new Map<
      string,
      { type: string; attributes: { title?: string }; references: unknown[] }
    >();
    for (const batch of _.chunk(refPanels, MAX_COPY_PANELS_BATCH_SIZE)) {
      if (signal?.aborted) {
        throw new CopyPanelsAbortError();
      }
      const resp = await client.bulkGet<{ title?: string }>(
        batch.map((p) => ({ type: p.type, id: p.id as string }))
      );
      resp.savedObjects.forEach((so, i) => {
        const panel = batch[i];
        // A missing/errored source is detected via `so.error` (SimpleSavedObject
        // always defaults `attributes` to a truthy `{}`, so `!so.attributes` is
        // belt-and-suspenders for any non-standard client, not the live detector).
        if (so.error || !so.attributes) {
          failures.push({ panelIndex: panel.panelIndex, type: panel.type, id: panel.id as string });
        } else {
          sourceByPanelIndex.set(panel.panelIndex, {
            type: panel.type,
            attributes: so.attributes,
            references: (so.references as unknown[]) ?? [],
          });
        }
      });
    }

    // 2) Build create inputs with pre-generated ids + templated titles.
    const toCreate = refPanels
      .filter((p) => sourceByPanelIndex.has(p.panelIndex))
      .map((p) => {
        const src = sourceByPanelIndex.get(p.panelIndex)!;
        const newId = uuidv4();
        const title =
          src.attributes.title !== undefined
            ? renderPanelCopyTitle(titleTemplate, src.attributes.title, dashboardTitle)
            : undefined;
        return {
          panelIndex: p.panelIndex,
          sourceId: p.id as string,
          type: src.type,
          id: newId,
          attributes: {
            ..._.cloneDeep(src.attributes),
            ...(title !== undefined && { title }),
          },
          references: _.cloneDeep(src.references) as any,
        };
      });

    // 3) bulkCreate (chunked). Per-object errors are treated as copy failures.
    for (const batch of _.chunk(toCreate, MAX_COPY_PANELS_BATCH_SIZE)) {
      if (signal?.aborted) {
        throw new CopyPanelsAbortError();
      }
      const resp = await client.bulkCreate(
        batch.map((o) => ({
          type: o.type,
          id: o.id,
          attributes: o.attributes,
          references: o.references,
        })),
        { overwrite: false }
      );
      resp.savedObjects.forEach((so, i) => {
        const input = batch[i];
        if (so.error) {
          failures.push({
            panelIndex: input.panelIndex,
            type: input.type,
            id: input.sourceId,
            title: input.attributes.title as string | undefined,
          });
        } else {
          createdObjects.push({ type: so.type, id: so.id });
          newIdByPanelIndex.set(input.panelIndex, so.id);
        }
      });
    }

    // 4) Repoint panels to their copies; failed/by-value panels unchanged.
    const newPanels = panels.map((p) => {
      const newId = newIdByPanelIndex.get(p.panelIndex);
      return newId ? { ...p, id: newId } : p;
    });

    return { panels: newPanels, createdObjects, failures };
  } catch (error) {
    await rollbackPanelCopies(client, createdObjects);
    throw error;
  }
}
