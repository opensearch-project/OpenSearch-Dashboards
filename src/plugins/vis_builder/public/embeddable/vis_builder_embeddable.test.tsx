/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisBuilderEmbeddable } from './vis_builder_embeddable';

// These exercise the isVisible fetch-gate logic (OSD PR #12809) directly on the
// prototype methods with a minimal hand-built stub, avoiding a full embeddable
// construction (which needs saved-object/services/DOM wiring). Mirrors the
// VisualizeEmbeddable data-fetch pause tests, since the two share the same shape:
// gate in updateHandler, resume-flush in handleChanges.
describe('VisBuilderEmbeddable data-fetch pause', () => {
  const anyProto = VisBuilderEmbeddable.prototype as any;
  const updateHandler = anyProto.updateHandler as () => Promise<void>;
  const handleChanges = anyProto.handleChanges as () => Promise<void>;

  describe('updateHandler', () => {
    it('defers the data fetch while not visible and records that one is owed', async () => {
      const handler = { update: jest.fn() };
      const stub: any = {
        input: { isVisible: false },
        pendingFetchOnResume: false,
        handler,
      };

      await updateHandler.call(stub);

      expect(handler.update).not.toHaveBeenCalled();
      expect(stub.pendingFetchOnResume).toBe(true);
    });
  });

  describe('handleChanges resume', () => {
    const makeStub = (overrides: Record<string, unknown>) => {
      const filters: unknown[] = [];
      const stub: any = {
        // Inputs are already synced into the private fields (no dirty deltas), so
        // the resume path must rely on pendingFetchOnResume, not the dirty checks.
        input: { isVisible: true, timeRange: undefined, query: undefined, filters },
        timeRange: undefined,
        query: undefined,
        filters,
        serializedState: 'state',
        getSerializedState: () => 'state',
        transferInputToUiState: () => {},
        pendingFetchOnResume: false,
        handler: {},
        updateHandler: jest.fn(),
        ...overrides,
      };
      return stub;
    };

    it('runs a single deferred refresh when resumed with a fetch owed', async () => {
      const stub = makeStub({ pendingFetchOnResume: true });

      await handleChanges.call(stub);

      expect(stub.pendingFetchOnResume).toBe(false);
      expect(stub.updateHandler).toHaveBeenCalledTimes(1);
    });

    it('does not refresh on resume when nothing changed while paused', async () => {
      const stub = makeStub({ pendingFetchOnResume: false });

      await handleChanges.call(stub);

      expect(stub.updateHandler).not.toHaveBeenCalled();
    });

    it('does not flush while still not visible', async () => {
      const stub = makeStub({
        pendingFetchOnResume: true,
        input: { isVisible: false, timeRange: undefined, query: undefined, filters: [] },
      });

      await handleChanges.call(stub);

      // Still owed, and no fetch attempted.
      expect(stub.pendingFetchOnResume).toBe(true);
      expect(stub.updateHandler).not.toHaveBeenCalled();
    });
  });
});
