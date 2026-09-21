/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { StreamingQueryStatus } from '../../../../application/utils/state_management/types';

const MS_PER_SECOND = 1000;
const SECONDS_DECIMAL_PLACES = 3;

/**
 * Durations over a second read as seconds: five- and six-digit millisecond counts are hard to scan.
 */
export const formatDuration = (elapsedMs?: number): string => {
  if (typeof elapsedMs !== 'number' || !Number.isFinite(elapsedMs)) {
    return String(elapsedMs);
  }
  if (elapsedMs < MS_PER_SECOND) {
    return i18n.translate('explore.discover.hitsCounter.durationMs', {
      defaultMessage: '{value} ms',
      values: { value: elapsedMs.toLocaleString() },
    });
  }
  const seconds = (elapsedMs / MS_PER_SECOND).toLocaleString(undefined, {
    minimumFractionDigits: SECONDS_DECIMAL_PLACES,
    maximumFractionDigits: SECONDS_DECIMAL_PLACES,
  });
  return i18n.translate('explore.discover.hitsCounter.durationSeconds', {
    defaultMessage: '{value} s',
    values: { value: seconds },
  });
};

export type StreamingPhase = 'none' | 'polling' | 'aborted' | 'completed';

/** `none` covers the non-streaming path, which gets no annotation at all. */
export const getStreamingPhase = (streaming?: StreamingQueryStatus): StreamingPhase => {
  if (!streaming) return 'none';
  if (streaming.isPolling) return 'polling';
  return streaming.aborted ? 'aborted' : 'completed';
};

/**
 * Progress as reported by the engine.
 *
 * Absent for plan shapes that report no progress, in which case there is no honest percentage to show.
 * Note this stalls at 80% while a query runs — see the note in `formatStreamingAnnotation`.
 */
export const formatProgressPercent = (fractionDone?: number): number | undefined => {
  if (typeof fractionDone !== 'number' || !Number.isFinite(fractionDone) || fractionDone < 0) {
    return undefined;
  }
  return Math.min(100, Math.floor(fractionDone * 100));
};

/**
 * Trailing annotation for the states that carry information: in flight, or stopped short.
 *
 * Completion is deliberately unmarked. Annotating it would add a word to every finished query while
 * saying nothing actionable, and it would read inconsistently against languages that never stream.
 *
 * The percentage comes from the engine's `fraction_done`, which reserves its top 20% for coordinator
 * work it cannot measure, so it stalls at 80% until the query completes.
 */
export const formatStreamingAnnotation = (streaming: StreamingQueryStatus | undefined): string => {
  const phase = getStreamingPhase(streaming);
  const percent = formatProgressPercent(streaming?.fractionDone);

  if (phase === 'polling') {
    // Without a percentage there is nothing to say that the loading bar does not already convey.
    return percent === undefined
      ? ''
      : ` (${i18n.translate('explore.discover.hitsCounter.progressPercent', {
          defaultMessage: '{percent}%',
          values: { percent },
        })})`;
  }

  if (phase === 'aborted') {
    return percent === undefined
      ? ` (${i18n.translate('explore.discover.hitsCounter.aborted', {
          defaultMessage: 'Stopped',
        })})`
      : ` (${i18n.translate('explore.discover.hitsCounter.abortedAtPercent', {
          defaultMessage: 'Stopped at {percent}%',
          values: { percent },
        })})`;
  }

  // `completed` and `none` are both unmarked.
  return '';
};
