/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { StreamingQueryStatus } from '../../../../application/utils/state_management/types';

export type StreamingPhase = 'none' | 'polling' | 'aborted' | 'completed';

/** `none` covers the non-streaming path, which gets no annotation at all. */
export const getStreamingPhase = (streaming?: StreamingQueryStatus): StreamingPhase => {
  if (!streaming) return 'none';
  if (streaming.isPolling) return 'polling';
  return streaming.aborted ? 'aborted' : 'completed';
};

/**
 * Progress as reported by the engine. Absent for plan shapes that report no progress, in which case
 * there is no honest percentage to show.
 *
 * The engine reserves the top 20% of `fraction_done` for coordinator work it cannot measure, so this
 * stalls at 80% until the query completes.
 */
export const formatProgressPercent = (fractionDone?: number): number | undefined => {
  if (typeof fractionDone !== 'number' || !Number.isFinite(fractionDone) || fractionDone < 0) {
    return undefined;
  }
  return Math.min(100, Math.floor(fractionDone * 100));
};

/**
 * Annotation text for the states that carry information: in flight, or stopped short. Returns bare
 * text; the caller owns how it is presented.
 *
 * Completion is deliberately unmarked. Annotating it would add a word to every finished query while
 * saying nothing actionable, and would read inconsistently against languages that never stream.
 */
export const formatStreamingAnnotation = (streaming?: StreamingQueryStatus): string => {
  const phase = getStreamingPhase(streaming);
  const percent = formatProgressPercent(streaming?.fractionDone);

  if (phase === 'polling') {
    // Without a percentage there is nothing to say that the progress bar does not already convey.
    return percent === undefined
      ? ''
      : i18n.translate('explore.discover.hitsCounter.progressPercent', {
          defaultMessage: '{percent}%',
          values: { percent },
        });
  }

  if (phase === 'aborted') {
    return percent === undefined
      ? i18n.translate('explore.discover.hitsCounter.aborted', { defaultMessage: 'Stopped' })
      : i18n.translate('explore.discover.hitsCounter.abortedAtPercent', {
          defaultMessage: 'Stopped at {percent}%',
          values: { percent },
        });
  }

  return '';
};
