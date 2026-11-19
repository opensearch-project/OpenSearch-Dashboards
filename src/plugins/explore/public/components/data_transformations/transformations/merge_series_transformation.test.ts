/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createMergeSeriesTransformation,
  mergeSeriesMethod,
  mergeSeriesTransformationDefinition,
} from './merge_series_transformation';
import { TransformationService } from '../transformation_service';
import { limitTransformationDefinition } from './limit_transformation';
// import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/utils';
import type { SeriesResult } from '../../../application/in_context_vis_editor/multi_query_builder/types';

const oneSeries = (refId: string, values: number[]): SeriesResult => ({
  refId,
  rows: values.map((v) => ({ v })),
  fieldSchema: [{ name: 'v', type: 'number' }],
});

describe('merge series transformation', () => {
  it('merges every series into one with a Query column', () => {
    const result = mergeSeriesMethod([oneSeries('A', [1]), oneSeries('B', [2])]);

    expect(result.status).toBe('applied');
    expect(result.series).toHaveLength(1);
    expect(result.series[0].rows).toEqual([
      { v: 1, Query: 'A' },
      { v: 2, Query: 'B' },
    ]);
  });

  it('is skipped, without an issue, when there is one series', () => {
    const only = oneSeries('A', [1]);
    expect(mergeSeriesMethod([only])).toEqual({ series: [only], status: 'skipped', issues: [] });
  });

  it('creates a multi-series instance with no config', () => {
    const instance = createMergeSeriesTransformation();
    expect(instance.definition_id).toBe(mergeSeriesTransformationDefinition.id);
    expect(instance.config).toEqual({});
    expect(typeof instance.seriesMethod).toBe('function');
  });

  describe('in the pipeline', () => {
    const run = (stepIds: string[], limit = 1) => {
      const service = new TransformationService();
      service.registerDefinition(limitTransformationDefinition);
      service.registerDefinition(mergeSeriesTransformationDefinition);
      stepIds.forEach((id) => service.addInstance(id));
      service.pipeline$.value
        .filter(({ definition_id: id }) => id === 'limit')
        .forEach(({ instance_id: id }) => service.updateInstanceConfig(id, { limit }));
      // A limit above the merge sees both queries: it runs on the one picked (A). Below the merge
      // there's one series, so it needs no pick.
      const mergeIndex = stepIds.indexOf('merge_series');
      service.pipeline$.value.forEach(({ instance_id: id }, index) => {
        if (stepIds[index] === 'limit' && index < mergeIndex)
          service.updateInstanceApplyTo(id, 'A');
      });
      return service.applyPipelineToSeries([oneSeries('A', [1, 2]), oneSeries('B', [3, 4])]);
    };

    // it('runs steps above it on each query, and steps below it on the merged series', () => {
    //   // Limit 1 before the merge: one row from each query.
    //   expect(run(['limit', 'merge_series']).rows).toEqual([
    //     { v: 1, Query: 'A' },
    //     { v: 3, Query: 'B' },
    //   ]);
    // it('runs steps above it on one query (the first), and steps below it on the merged series', () => {
    //   // Limit 1 before the merge, without applyTo: only the first query is limited.
    it('runs steps above it on the picked query, and steps below it on the merged series', () => {
      // Limit 1 before the merge, on query A: only A is limited.
      expect(run(['limit', 'merge_series']).rows).toEqual([
        { v: 1, Query: 'A' },
        { v: 3, Query: 'B' },
        { v: 4, Query: 'B' },
      ]);
      // Limit 1 after the merge: one row in all.
      expect(run(['merge_series', 'limit']).rows).toEqual([{ v: 1, Query: 'A' }]);
    });

    it('lets steps below it use the Query column', () => {
      const service = new TransformationService();
      service.registerDefinition(mergeSeriesTransformationDefinition);
      service.addInstance('merge_series');
      const [merge] = service.pipeline$.value;
      service.addInstance('merge_series');
      const result = service.applyPipelineToSeries([oneSeries('A', [1]), oneSeries('B', [2])]);

      // The second merge sees one series: skipped, and offered the Query column.
      expect(result.steps.map(({ status }) => status)).toEqual(['applied', 'skipped']);
      const second = service.pipeline$.value.find(
        ({ instance_id: id }) => id !== merge.instance_id
      );
      expect(
        service.stageFields$.value.get(second?.instance_id ?? '')?.map(({ name }) => name)
      ).toEqual(['v', 'Query']);
    });

    it('leaves the implicit merge at the end when it is hidden', () => {
      const service = new TransformationService();
      service.registerDefinition(mergeSeriesTransformationDefinition);
      service.addInstance('merge_series');
      service.toggleInstanceHide(service.pipeline$.value[0].instance_id);

      const result = service.applyPipelineToSeries([oneSeries('A', [1]), oneSeries('B', [2])]);
      expect(result.steps[0].status).toBe('skipped');
      expect(result.rows).toEqual([
        { v: 1, Query: 'A' },
        { v: 2, Query: 'B' },
      ]);
    });
  });
});
