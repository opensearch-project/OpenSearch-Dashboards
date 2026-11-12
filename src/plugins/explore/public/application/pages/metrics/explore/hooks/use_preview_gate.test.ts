/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { usePreviewGate } from './use_preview_gate';

describe('usePreviewGate', () => {
  it('enables previews for a dataset type that does not require an explicit Run', () => {
    const { result } = renderHook(() => usePreviewGate(false, 'ds-1'));
    expect(result.current.previewsEnabled).toBe(true);
  });

  it('keeps previews off for an explicit-Run dataset type until they are requested', () => {
    const { result } = renderHook(() => usePreviewGate(true, 'ds-1'));
    expect(result.current.previewsEnabled).toBe(false);

    act(() => result.current.requestPreviews());
    expect(result.current.previewsEnabled).toBe(true);
  });

  it('turns previews off again when the reset key changes', () => {
    const { result, rerender } = renderHook(({ key }) => usePreviewGate(true, key), {
      initialProps: { key: 'ds-1' },
    });
    act(() => result.current.requestPreviews());
    expect(result.current.previewsEnabled).toBe(true);

    rerender({ key: 'ds-2' });
    expect(result.current.previewsEnabled).toBe(false);
  });

  it('keeps previews on when the same dataset arrives again as a new object', () => {
    const keyOf = (dataset: { type: string; id: string }) => `${dataset.type}::${dataset.id}`;
    const { result, rerender } = renderHook(({ key }) => usePreviewGate(true, key), {
      initialProps: { key: keyOf({ type: 'FAKE_METRICS', id: 'fake::one' }) },
    });
    act(() => result.current.requestPreviews());
    rerender({ key: keyOf({ type: 'FAKE_METRICS', id: 'fake::one' }) });
    expect(result.current.previewsEnabled).toBe(true);

    rerender({ key: keyOf({ type: 'FAKE_METRICS', id: 'fake::two' }) });
    expect(result.current.previewsEnabled).toBe(false);
  });

  it('a reset never turns previews off for a dataset type without the flag', () => {
    const { result, rerender } = renderHook(({ key }) => usePreviewGate(false, key), {
      initialProps: { key: 'ds-1' },
    });
    rerender({ key: 'ds-2' });
    expect(result.current.previewsEnabled).toBe(true);
  });
});
