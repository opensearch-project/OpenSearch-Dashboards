/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { buildQuerySection, buildTransformSection, resolveActiveSelection } from './utils';
import {
  TransformationInstance,
  TransformationService,
} from '../../../../components/data_transformations';

const makeInstance = (id: string, definitionId = 'sort_by'): TransformationInstance =>
  ({
    instance_id: id,
    definition_id: definitionId,
    config: {},
    hide: false,
  }) as unknown as TransformationInstance;

const makeService = (pipeline: TransformationInstance[]) => {
  const pipeline$ = new BehaviorSubject<TransformationInstance[]>(pipeline);
  return {
    pipeline$,
    getDefinition: jest.fn((id: string) => ({ label: `Label ${id}`, iconType: 'sortable' })),
    setPipeline: jest.fn((next: TransformationInstance[]) => pipeline$.next(next)),
  } as unknown as TransformationService & { setPipeline: jest.Mock };
};

const step = (status: string, codes: string[] = []) =>
  ({
    instanceId: 'x',
    definitionId: 'sort_by',
    status,
    issues: codes.map((code) => ({ code, message: code })),
  }) as any;

describe('buildQuerySection', () => {
  it('maps rows to items, passing isHidden and isValid through', () => {
    const section = buildQuerySection([
      { refId: 'A' },
      { refId: 'B', isHidden: true, isValid: false },
    ]);
    expect(section.items).toEqual([
      { id: 'A', label: 'A', iconType: 'visBarVertical', isHidden: false, isValid: undefined },
      { id: 'B', label: 'B', iconType: 'visBarVertical', isHidden: true, isValid: false },
    ]);
  });

  it('only makes queries draggable with a reorder handler and more than one row', () => {
    const onReorder = jest.fn();
    expect(buildQuerySection([{ refId: 'A' }, { refId: 'B' }]).draggable).toBe(false);
    expect(buildQuerySection([{ refId: 'A' }], onReorder).draggable).toBe(false);
    expect(buildQuerySection([{ refId: 'A' }, { refId: 'B' }], onReorder).draggable).toBe(true);
  });
});

describe('buildTransformSection', () => {
  it('labels transformations from their definitions', () => {
    const pipeline = [makeInstance('t1')];
    expect(buildTransformSection(pipeline, makeService(pipeline)).items[0]).toMatchObject({
      id: 't1',
      label: 'Label sort_by',
      iconType: 'sortable',
    });
  });

  it('reorders from the latest pipeline, not the build-time one', () => {
    const service = makeService([makeInstance('t1'), makeInstance('t2')]);
    const section = buildTransformSection(service.pipeline$.getValue(), service);
    // Pipeline changes after the section was built.
    const latest = [makeInstance('t1'), makeInstance('t2'), makeInstance('t3')];
    service.pipeline$.next(latest);

    section.onReorder?.(2, 0);
    expect(service.setPipeline).toHaveBeenCalledWith([latest[2], latest[0], latest[1]]);
  });

  it('marks failed steps invalid and steps with other issues as warnings', () => {
    const pipeline = ['t1', 't2', 't3', 't4'].map((id) => makeInstance(id));
    const items = buildTransformSection(
      pipeline,
      makeService(pipeline),
      new Map([
        ['t1', step('failed', ['execution_error'])],
        ['t2', step('skipped', ['missing_fields'])],
        ['t3', step('skipped', ['invalid_config'])],
        ['t4', step('applied', [])],
      ])
    ).items;
    expect(items.map((item) => item.isValid)).toEqual([false, true, true, true]);
    expect(items.map((item) => Boolean(item.showStepWarning))).toEqual([false, true, true, false]);
  });

  it('treats steps without a result as valid', () => {
    const pipeline = [makeInstance('t1'), makeInstance('t2')];
    const items = buildTransformSection(pipeline, makeService(pipeline)).items;
    expect(items.every((item) => item.isValid)).toBe(true);
  });
});

describe('resolveActiveSelection', () => {
  const ids = { queryIds: ['A', 'B'], transformIds: ['t1', 't2'] };

  it("shows the builder's selected row", () => {
    expect(resolveActiveSelection({ ...ids, selectedQueryRefId: 'B' })).toEqual({
      currentActive: 'query',
      activeItemId: 'B',
    });
  });

  it("a selected transformation wins over the builder's row while it exists", () => {
    expect(
      resolveActiveSelection({ ...ids, selectedQueryRefId: 'B', selectedTransformationId: 't2' })
    ).toEqual({ currentActive: 'transformation', activeItemId: 't2' });

    // Removed step: back to the builder's row.
    expect(
      resolveActiveSelection({
        ...ids,
        transformIds: ['t1'],
        selectedQueryRefId: 'B',
        selectedTransformationId: 't2',
      })
    ).toEqual({ currentActive: 'query', activeItemId: 'B' });
  });

  it("falls back to the first query when the builder's row isn't listed", () => {
    expect(resolveActiveSelection({ ...ids, selectedQueryRefId: 'Z' })).toEqual({
      currentActive: 'query',
      activeItemId: 'A',
    });
  });

  it('returns none without queries', () => {
    expect(resolveActiveSelection({ queryIds: [], transformIds: ['t1'] })).toEqual({
      currentActive: 'none',
    });
  });
});
