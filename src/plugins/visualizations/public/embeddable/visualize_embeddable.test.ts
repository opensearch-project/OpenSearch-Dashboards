/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { VisualizeEmbeddable } from './visualize_embeddable';
import { PersistedState } from '../persisted_state';

// transferCustomizationsToUiState only depends on a small slice of `this`;
// build a minimal stub and bind the prototype method onto it so we can
// exercise the behavior against a real PersistedState without standing up
// the full embeddable (which needs data plugin, timefilter, etc.).
type CallableTransfer = () => void;
type CallableReset = () => void;

interface StubState {
  input: { vis?: { [key: string]: unknown }; table?: unknown };
  vis: { uiState: PersistedState };
  parent?: unknown;
  visCustomizations?: unknown;
  uiStateChangeHandler: () => void;
  resetUiStateChanges: CallableReset;
}

const proto = VisualizeEmbeddable.prototype as unknown as {
  transferCustomizationsToUiState: CallableTransfer;
  resetUiStateChanges: CallableReset;
};

const transfer = proto.transferCustomizationsToUiState;
const resetChanges = proto.resetUiStateChanges;

const buildStub = (savedUiState: Record<string, unknown>, input: StubState['input']): StubState => {
  const stub: StubState = {
    input,
    vis: { uiState: new PersistedState(savedUiState) },
    parent: { id: 'parent' },
    uiStateChangeHandler: () => {},
    // Bind the helper through `this` so the stub mirrors the real instance.
    resetUiStateChanges() {
      resetChanges.call(stub);
    },
  };
  return stub;
};

describe('VisualizeEmbeddable.transferCustomizationsToUiState', () => {
  it('preserves saved slice colors when the dashboard panel only customizes legendOpen', () => {
    // Saved viz uiState (e.g. colors set via the Visualize editor + a default
    // legend state). Mirrors `uiStateJSON` deserialized into PersistedState.
    const savedUiState = {
      vis: {
        colors: { 'Slice A': '#ff0000', 'Slice B': '#00ff00' },
        legendOpen: true,
      },
    };
    // Mirrors a Flight-style sample dashboard where the panel embeddableConfig
    // only carries `{vis: {legendOpen: false}}` — no `colors`.
    const stub = buildStub(savedUiState, { vis: { legendOpen: false } });

    transfer.call(stub);

    expect(stub.vis.uiState.get('vis.colors')).toEqual({
      'Slice A': '#ff0000',
      'Slice B': '#00ff00',
    });
    expect(stub.vis.uiState.get('vis.legendOpen')).toBe(false);
  });

  it('lets dashboard color overrides take precedence while keeping unmodified saved colors', () => {
    const savedUiState = {
      vis: { colors: { 'Slice A': '#ff0000', 'Slice B': '#00ff00' } },
    };
    // Dashboard overrides only Slice A. Slice B should still come from defaults.
    const stub = buildStub(savedUiState, { vis: { colors: { 'Slice A': '#0000ff' } } });

    transfer.call(stub);

    expect(stub.vis.uiState.get('vis.colors')).toEqual({
      'Slice A': '#0000ff',
      'Slice B': '#00ff00',
    });
  });

  it('falls back to saved defaults when the panel has no customizations', () => {
    const savedUiState = {
      vis: { colors: { 'Slice A': '#ff0000' }, legendOpen: false },
    };
    const stub = buildStub(savedUiState, {});

    transfer.call(stub);

    expect(stub.vis.uiState.get('vis.colors')).toEqual({ 'Slice A': '#ff0000' });
    expect(stub.vis.uiState.get('vis.legendOpen')).toBe(false);
  });

  it('reverts to saved defaults after the dashboard customization is removed', () => {
    const savedUiState = {
      vis: { colors: { 'Slice A': '#ff0000' }, legendOpen: true },
    };
    const stub = buildStub(savedUiState, { vis: { legendOpen: false } });

    transfer.call(stub);
    expect(stub.vis.uiState.get('vis.legendOpen')).toBe(false);

    // Subsequent cycle: panel embeddableConfig is now empty.
    stub.input = {};
    transfer.call(stub);

    expect(stub.vis.uiState.get('vis.legendOpen')).toBe(true);
    expect(stub.vis.uiState.get('vis.colors')).toEqual({ 'Slice A': '#ff0000' });
  });
});

describe('VisualizeEmbeddable data-fetch pause', () => {
  const anyProto = VisualizeEmbeddable.prototype as any;
  const updateHandler = anyProto.updateHandler as () => Promise<void>;
  const handleChanges = anyProto.handleChanges as () => Promise<void>;

  describe('updateHandler', () => {
    it('defers the data fetch while paused and records that one is owed', async () => {
      const handler = { update: jest.fn() };
      const stub: any = {
        input: { dataFetchPaused: true },
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
        // input already synced into the private fields (no dirty deltas), so the
        // resume path must rely on pendingFetchOnResume, not the dirty checks.
        input: { dataFetchPaused: false, timeRange: undefined, query: undefined, filters },
        timeRange: undefined,
        query: undefined,
        filters,
        pendingFetchOnResume: false,
        handler: {},
        vis: {},
        domNode: undefined,
        transferCustomizationsToUiState: () => {},
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

    it('does not flush while still paused', async () => {
      const stub = makeStub({
        pendingFetchOnResume: true,
        input: { dataFetchPaused: true, timeRange: undefined, query: undefined, filters: [] },
      });

      await handleChanges.call(stub);

      // Still owed, and no fetch attempted.
      expect(stub.pendingFetchOnResume).toBe(true);
      expect(stub.updateHandler).not.toHaveBeenCalled();
    });
  });
});
