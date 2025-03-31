/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import React from 'react';
import { render, act } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { dataPluginMock } from '../../../../../plugins/data/public/mocks';
import { DataStorage } from '../../../../../plugins/data/common';
import { createSearchBar } from './create_search_bar';

jest.mock('./index', () => ({
  SearchBar: () => <div>SearchBar</div>,
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useRef: jest.fn().mockReturnValue({ current: new AbortController() }),
}));

const mockTimeRange = {
  from: 'now-15m',
  to: 'now',
};
const mockRefreshInterval = {
  pause: false,
  value: 0,
};

jest.mock('./lib/use_timefilter', () => ({
  useTimefilter: jest.fn(() => ({
    timeRange: mockTimeRange,
    refreshInterval: mockRefreshInterval,
  })),
}));

describe('createSearchBar', () => {
  const coreStartMock = coreMock.createStart();
  const dataMock = dataPluginMock.createStartContract();
  const storageMock = new DataStorage(window.localStorage, 'opensearchDashboards.');
  const isGeneratingppl$ = new BehaviorSubject(false);

  const statefulSearchBarDepsMock = {
    core: coreStartMock,
    storage: storageMock,
    isGeneratingppl$,
    data: dataMock,
  };

  const defaultOptions = {
    appName: 'test',
    intl: null as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders SearchBar component with correct props', () => {
    const SearchBarComponent = createSearchBar(statefulSearchBarDepsMock);

    const { getByText } = render(<SearchBarComponent {...defaultOptions} />);

    expect(getByText('SearchBar')).toBeInTheDocument();
  });

  it('aborts ongoing request when isGeneratingppl$ emits true', () => {
    const abortMock = jest.spyOn(AbortController.prototype, 'abort').mockImplementation(() => {});

    const SearchBarComponent = createSearchBar(statefulSearchBarDepsMock);

    render(<SearchBarComponent {...defaultOptions} />);

    act(() => {
      isGeneratingppl$.next(true);
    });

    expect(abortMock).toHaveBeenCalledTimes(1);
  });
});
