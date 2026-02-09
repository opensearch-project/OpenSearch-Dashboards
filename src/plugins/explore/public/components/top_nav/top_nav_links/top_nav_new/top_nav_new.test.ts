/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { newTopNavData, getNewButtonRun } from './top_nav_new';
import { resetExploreStateActionCreator } from '../../../../application/utils/state_management/actions/reset_explore_state';
import { ExploreServices } from '../../../../types';
import * as VB from '../../../visualizations/visualization_builder';

jest.mock('../../../../application/utils/state_management/actions/reset_explore_state', () => ({
  resetExploreStateActionCreator: jest.fn(() => 'RESET_ACTION'),
}));

describe('newTopNavData', () => {
  it('should have correct properties', () => {
    expect(newTopNavData).toMatchObject({
      tooltip: 'New',
      ariaLabel: 'New Search',
      testId: 'discoverNewButton',
      iconType: 'plusInCircle',
      controlType: 'icon',
    });
  });
});

describe('getNewButtonRun', () => {
  it('should dispatch resetExploreStateActionCreator and navigate to clean URL', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const visBuilder = new VB.VisualizationBuilder({});
    const clearUrlSpy = jest.spyOn(visBuilder, 'clearUrl');
    jest.spyOn(VB, 'getVisualizationBuilder').mockReturnValue(visBuilder);

    const dispatch = jest.fn();
    const mockPush = jest.fn();
    const services = ({
      store: { dispatch },
      scopedHistory: { push: mockPush },
    } as unknown) as ExploreServices;
    const clearEditors = jest.fn();

    const run = getNewButtonRun(services, clearEditors);
    run({} as HTMLElement);

    expect(resetExploreStateActionCreator).toHaveBeenCalledWith(services, clearEditors);
    expect(dispatch).toHaveBeenCalledWith('RESET_ACTION');
    expect(clearUrlSpy).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('should handle missing scopedHistory gracefully', () => {
    // @ts-expect-error TS2345 TODO(ts-error): fixme
    const visBuilder = new VB.VisualizationBuilder({});
    const clearUrlSpy = jest.spyOn(visBuilder, 'clearUrl');
    jest.spyOn(VB, 'getVisualizationBuilder').mockReturnValue(visBuilder);

    const dispatch = jest.fn();
    const services = ({
      store: { dispatch },
      scopedHistory: undefined,
    } as unknown) as ExploreServices;
    const clearEditors = jest.fn();

    const run = getNewButtonRun(services, clearEditors);

    // Should not throw when scopedHistory is undefined
    expect(() => run({} as HTMLElement)).not.toThrow();

    expect(resetExploreStateActionCreator).toHaveBeenCalledWith(services, clearEditors);
    expect(dispatch).toHaveBeenCalledWith('RESET_ACTION');
    expect(clearUrlSpy).toHaveBeenCalled();
  });
});
