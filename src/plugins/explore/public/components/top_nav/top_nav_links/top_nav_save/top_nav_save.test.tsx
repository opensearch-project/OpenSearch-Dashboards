/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getSaveButtonRun, saveTopNavData } from './top_nav_save';
import { ExploreServices } from '../../../../types';
import { ExecutionContextSearch } from '../../../../../../expressions';
import { SavedExplore } from '../../../../types/saved_explore_types';

// Mock dependencies
jest.mock('../../../../helpers/save_explore', () => ({
  saveSavedExplore: jest.fn(() => Promise.resolve({ id: 'saved-id' })),
}));

jest.mock('../../../../saved_explore/transforms', () => ({
  saveStateToSavedObject: jest.fn((obj) => obj),
}));

jest.mock('../../../../../../saved_objects/public', () => ({
  showSaveModal: jest.fn(),
}));

const mockServices = ({
  core: {
    i18n: {
      Context: React.Fragment,
    },
  },
} as unknown) as ExploreServices;

const mockSearchContext: ExecutionContextSearch = {
  query: { query: 'test', language: 'PPL' },
  filters: [],
  timeRange: { from: 'now-15m', to: 'now' },
};

const mockSaveStateProps = {
  dataset: undefined,
  tabState: {
    logs: {},
    visualizations: {
      styleOptions: {
        showTitle: true,
        title: '',
        fontSize: 60,
        useColor: false,
        colorSchema: 'blues' as any,
      },
      chartType: undefined,
      axesMapping: {},
    },
  },
  flavorId: 'logs',
  tabDefinition: {
    id: 'logs',
    name: 'Logs',
    label: 'Logs',
    flavor: 'logs' as any,
    supportedLanguages: ['PPL'],
    component: {} as any,
  },
};

const mockSavedExplore = ({
  id: 'test-id',
  title: 'Test Explore',
  type: 'logs',
  searchSource: {} as any,
  destroy: jest.fn(),
  save: jest.fn(),
  copyOnSave: false,
  lastSavedTitle: '',
  getEsType: jest.fn(),
  isSaved: jest.fn(() => true),
  getFullPath: jest.fn(),
  getOpenSearchType: jest.fn(),
} as unknown) as SavedExplore;

describe('top_nav_save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveTopNavData', () => {
    it('has correct configuration', () => {
      expect(saveTopNavData.tooltip).toBeDefined();
      expect(saveTopNavData.ariaLabel).toBeDefined();
      expect(saveTopNavData.testId).toBe('discoverSaveButton');
      expect(saveTopNavData.iconType).toBe('save');
      expect(saveTopNavData.controlType).toBe('icon');
    });
  });

  describe('getSaveButtonRun', () => {
    it('returns early when no savedExplore is provided', () => {
      const run = getSaveButtonRun(mockServices, jest.fn(), mockSearchContext, mockSaveStateProps);

      // Should not throw and should complete quickly
      const mockElement = document.createElement('button');
      const result = run(mockElement);
      expect(result).toBeUndefined();
    });

    it('calls showSaveModal when savedExplore is provided', () => {
      const { showSaveModal } = jest.requireMock('../../../../../../saved_objects/public');

      const run = getSaveButtonRun(
        mockServices,
        jest.fn(),
        mockSearchContext,
        mockSaveStateProps,
        mockSavedExplore
      );

      const mockElement = document.createElement('button');
      run(mockElement);

      expect(showSaveModal).toHaveBeenCalled();
    });
  });
});
