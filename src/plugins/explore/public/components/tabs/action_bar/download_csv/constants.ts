/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The upper limit option of the "Max" download option
 */
export const MAX_DOWNLOAD_CSV_COUNT = 10000;

/**
 * The available export options:
 * - Visible = download the current queried result
 * - Max = download Math.min(hits, MAX_DOWNLOAD_CSV_COUNT)
 */
export enum DownloadCsvFormId {
  Visible = 'visible',
  Max = 'max',
}
