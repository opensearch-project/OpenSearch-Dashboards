/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { saveStateToSavedObject } from './transforms';
import { SavedExplore } from '../types/saved_explore_types';

const createMockSavedExplore = (): SavedExplore =>
  (({
    title: 'test',
    description: '',
    type: '',
    visualization: '',
    uiState: '',
    version: 0,
  } as unknown) as SavedExplore);

describe('saveStateToSavedObject', () => {
  describe('activeTab in uiState', () => {
    it('uses activeTabId when tabDefinition exists', () => {
      const obj = createMockSavedExplore();
      const tabDef = { id: 'logs', label: 'Logs', flavor: ['logs'], order: 10 } as any;

      saveStateToSavedObject(obj, 'logs', tabDef, undefined, undefined, 'logs');

      expect(JSON.parse(obj.uiState!).activeTab).toBe('logs');
    });

    it('ignores activeTabId when tabDefinition is undefined', () => {
      const obj = createMockSavedExplore();

      saveStateToSavedObject(obj, 'metrics', undefined, undefined, undefined, 'logs');

      expect(JSON.parse(obj.uiState!).activeTab).toBe('');
    });

    it('falls back to tabDefinition.id when activeTabId is empty', () => {
      const obj = createMockSavedExplore();
      const tabDef = { id: 'metrics', label: 'Table', flavor: ['metrics'], order: 10 } as any;

      saveStateToSavedObject(obj, 'metrics', tabDef, undefined, undefined, '');

      expect(JSON.parse(obj.uiState!).activeTab).toBe('metrics');
    });

    it('falls back to empty string when both tabDefinition and activeTabId are absent', () => {
      const obj = createMockSavedExplore();

      saveStateToSavedObject(obj, 'metrics');

      expect(JSON.parse(obj.uiState!).activeTab).toBe('');
    });
  });
});
