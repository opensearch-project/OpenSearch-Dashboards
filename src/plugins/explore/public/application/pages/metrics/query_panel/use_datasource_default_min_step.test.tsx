/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook, waitFor } from '@testing-library/react';
import { useDatasourceDefaultMinStep } from './use_datasource_default_min_step';

describe('useDatasourceDefaultMinStep', () => {
  let find: jest.Mock;
  let update: jest.Mock;
  let addWarning: jest.Mock;
  let addDanger: jest.Mock;
  let services: any;

  const savedObject = (meta?: string) => ({
    savedObjects: [{ id: 'so-1', attributes: { connectionId: 'local', type: 'Prometheus', meta } }],
  });

  beforeEach(() => {
    find = jest.fn(() => Promise.resolve(savedObject(JSON.stringify({ defaultMinStep: '15s' }))));
    update = jest.fn(() => Promise.resolve({}));
    addWarning = jest.fn();
    addDanger = jest.fn();
    services = {
      savedObjects: { client: { find, update } },
      notifications: { toasts: { addWarning, addDanger } },
    };
  });

  const render = (connectionId = 'local') =>
    renderHook(() => useDatasourceDefaultMinStep(services, connectionId));

  it('loads the default stored on the connection', async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.defaultMinStep).toBe('15s'));
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'data-connection', searchFields: ['connectionId'] })
    );
  });

  it('skips the lookup without a connection', () => {
    const { result } = render('');
    expect(find).not.toHaveBeenCalled();
    expect(result.current.defaultMinStep).toBeUndefined();
  });

  it('ignores saved objects for other connections', async () => {
    find.mockResolvedValue({
      savedObjects: [
        {
          id: 'so-2',
          attributes: { connectionId: 'local-2', meta: JSON.stringify({ defaultMinStep: '1m' }) },
        },
      ],
    });
    const { result } = render();
    await waitFor(() => expect(find).toHaveBeenCalled());
    expect(result.current.defaultMinStep).toBeUndefined();
  });

  it('treats unparseable connection metadata as empty', async () => {
    find.mockResolvedValue(savedObject('not json'));
    const { result } = render();
    await waitFor(() => expect(find).toHaveBeenCalled());
    expect(result.current.defaultMinStep).toBeUndefined();
  });

  it('preserves unrelated connection metadata when saving', async () => {
    find.mockResolvedValue(savedObject(JSON.stringify({ other: 'keep', defaultMinStep: '15s' })));
    const { result } = render();
    await waitFor(() => expect(result.current.defaultMinStep).toBe('15s'));

    act(() => {
      result.current.onDefaultMinStepChange('1m');
    });

    expect(update).toHaveBeenCalledWith('data-connection', 'so-1', {
      meta: JSON.stringify({ other: 'keep', defaultMinStep: '1m' }),
    });
  });

  it('clears the default when set to undefined', async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.defaultMinStep).toBe('15s'));

    act(() => {
      result.current.onDefaultMinStepChange(undefined);
    });

    expect(result.current.defaultMinStep).toBeUndefined();
    expect(update).toHaveBeenCalledWith('data-connection', 'so-1', { meta: '{}' });
  });

  it('warns that the value is session-only when the connection has no saved object', async () => {
    find.mockResolvedValue({ savedObjects: [] });
    const { result } = render();
    await waitFor(() => expect(find).toHaveBeenCalled());

    act(() => {
      result.current.onDefaultMinStepChange('1m');
    });

    expect(result.current.defaultMinStep).toBe('1m');
    expect(update).not.toHaveBeenCalled();
    expect(addWarning).toHaveBeenCalled();
  });

  it('reports a failed save', async () => {
    update.mockRejectedValue(new Error('forbidden'));
    const { result } = render();
    await waitFor(() => expect(result.current.defaultMinStep).toBe('15s'));

    act(() => {
      result.current.onDefaultMinStepChange('1m');
    });

    await waitFor(() => expect(addDanger).toHaveBeenCalled());
    expect(result.current.defaultMinStep).toBe('1m');
  });

  it('survives a failed lookup', async () => {
    find.mockRejectedValue(new Error('forbidden'));
    const { result } = render();
    await waitFor(() => expect(find).toHaveBeenCalled());
    expect(result.current.defaultMinStep).toBeUndefined();
  });

  it('reloads when the connection changes', async () => {
    const { result, rerender } = renderHook(({ id }) => useDatasourceDefaultMinStep(services, id), {
      initialProps: { id: 'local' },
    });
    await waitFor(() => expect(result.current.defaultMinStep).toBe('15s'));

    find.mockResolvedValue({
      savedObjects: [
        {
          id: 'so-9',
          attributes: { connectionId: 'other', meta: JSON.stringify({ defaultMinStep: '2m' }) },
        },
      ],
    });
    rerender({ id: 'other' });

    await waitFor(() => expect(result.current.defaultMinStep).toBe('2m'));
  });
});
