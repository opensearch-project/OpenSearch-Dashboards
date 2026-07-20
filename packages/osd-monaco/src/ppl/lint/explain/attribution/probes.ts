/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExplainAttributionCandidateSnapshot } from './snapshot';

export interface SourceEdit {
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface ExplainTreatmentProbe {
  candidate: ExplainAttributionCandidateSnapshot;
  query: string;
}

export interface ExplainProbeSet {
  controlQuery: string;
  treatments: ExplainTreatmentProbe[];
  buildTreatment(
    candidate: ExplainAttributionCandidateSnapshot,
    extraEdits?: SourceEdit[]
  ): string | undefined;
}

export function applySourceEdits(query: string, edits: SourceEdit[]): string | undefined {
  const ordered = [...edits].sort((left, right) => right.startOffset - left.startOffset);
  let boundary = query.length;
  let output = query;
  for (const edit of ordered) {
    if (
      edit.startOffset < 0 ||
      edit.endOffset < edit.startOffset ||
      edit.endOffset > query.length ||
      edit.endOffset > boundary
    ) {
      return undefined;
    }
    output = output.slice(0, edit.startOffset) + edit.text + output.slice(edit.endOffset);
    boundary = edit.startOffset;
  }
  return output;
}

function sameStage(candidates: ExplainAttributionCandidateSnapshot[]): boolean {
  const [first] = candidates;
  return candidates.every(
    (candidate) =>
      candidate.stageStartOffset === first.stageStartOffset &&
      candidate.stageEndOffset === first.stageEndOffset
  );
}

function filterProbeSet(
  query: string,
  candidates: ExplainAttributionCandidateSnapshot[]
): ExplainProbeSet {
  const neutralize = (except?: ExplainAttributionCandidateSnapshot): SourceEdit[] =>
    candidates
      .filter((candidate) => candidate.id !== except?.id)
      .map((candidate) => ({
        startOffset: candidate.startOffset,
        endOffset: candidate.endOffset,
        text: 'true',
      }));
  const buildTreatment = (
    candidate: ExplainAttributionCandidateSnapshot,
    extraEdits: SourceEdit[] = []
  ) => applySourceEdits(query, [...neutralize(candidate), ...extraEdits]);

  return {
    controlQuery: applySourceEdits(query, neutralize())!,
    treatments: candidates.map((candidate) => ({
      candidate,
      query: buildTreatment(candidate)!,
    })),
    buildTreatment,
  };
}

function aggregationProbeSet(
  query: string,
  candidates: ExplainAttributionCandidateSnapshot[]
): ExplainProbeSet | undefined {
  if (!sameStage(candidates)) {
    return undefined;
  }
  const [first] = candidates;
  const last = candidates[candidates.length - 1];
  if (first.separatorStartOffset === undefined) {
    return undefined;
  }

  const buildTreatment = (
    candidate: ExplainAttributionCandidateSnapshot,
    extraEdits: SourceEdit[] = []
  ) => {
    const reduced = applySourceEdits(query, [
      {
        startOffset: first.startOffset,
        endOffset: last.endOffset,
        text: candidate.sourceText,
      },
      { startOffset: first.stageEndOffset, endOffset: query.length, text: '' },
      ...extraEdits,
    ]);
    return reduced;
  };

  return {
    controlQuery: query.slice(0, first.separatorStartOffset).trimEnd(),
    treatments: candidates
      .map((candidate) => ({ candidate, query: buildTreatment(candidate) }))
      .filter((probe): probe is ExplainTreatmentProbe => probe.query !== undefined),
    buildTreatment,
  };
}

function sortProbeSet(
  query: string,
  candidates: ExplainAttributionCandidateSnapshot[]
): ExplainProbeSet | undefined {
  if (!sameStage(candidates)) {
    return undefined;
  }
  const [first] = candidates;
  const last = candidates[candidates.length - 1];
  if (first.separatorStartOffset === undefined) {
    return undefined;
  }

  const buildTreatment = (
    candidate: ExplainAttributionCandidateSnapshot,
    extraEdits: SourceEdit[] = []
  ) =>
    applySourceEdits(query, [
      {
        startOffset: first.startOffset,
        endOffset: last.endOffset,
        text: candidate.sourceText,
      },
      ...extraEdits,
    ]);

  return {
    controlQuery: applySourceEdits(query, [
      {
        startOffset: first.separatorStartOffset,
        endOffset: first.stageEndOffset,
        text: '',
      },
    ])!,
    treatments: candidates.map((candidate) => ({
      candidate,
      query: buildTreatment(candidate)!,
    })),
    buildTreatment,
  };
}

export function buildExplainProbeSet(
  query: string,
  candidates: ExplainAttributionCandidateSnapshot[]
): ExplainProbeSet | undefined {
  if (candidates.length === 0) {
    return undefined;
  }
  if (candidates.some((candidate) => candidate.operation !== candidates[0].operation)) {
    return undefined;
  }

  switch (candidates[0].operation) {
    case 'filter':
      return filterProbeSet(query, candidates);
    case 'aggregation':
      return aggregationProbeSet(query, candidates);
    case 'sort':
      return sortProbeSet(query, candidates);
  }
}
