/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl, shallowWithIntl } from 'test_utils/enzyme_helpers';
import { QueryResult } from './query_result';

enum ResultStatus {
  UNINITIALIZED = 'uninitialized',
  LOADING = 'loading', // initial data load
  READY = 'ready', // results came back
  NO_RESULTS = 'none', // no results came back
  ERROR = 'error', // error occurred
}

describe('Query Result', () => {
  it('shows loading status', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.LOADING,
        startTime: Number.NEGATIVE_INFINITY,
      },
    };
    const component = shallowWithIntl(<QueryResult {...props} />);
    expect(component).toMatchSnapshot();
  });

  it('should not render if status is uninitialized', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.UNINITIALIZED,
        startTime: Number.NEGATIVE_INFINITY,
      },
    };
    const component = shallowWithIntl(<QueryResult {...props} />);
    expect(component.isEmptyRender()).toBe(true);
  });

  it('shows ready status with complete message', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.READY,
        startTime: new Date().getTime(),
      },
    };
    const component = mountWithIntl(<QueryResult {...props} />);
    const loadingIndicator = component.find(`[data-test-subj="queryResultLoading"]`);
    expect(loadingIndicator.exists()).toBeFalsy();
    expect(component.find('EuiText').text()).toEqual('Completed');
  });

  it('shows ready status with complete in miliseconds message', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.READY,
        startTime: new Date().getTime(),
        elapsedMs: 500,
      },
    };
    const component = mountWithIntl(<QueryResult {...props} />);
    expect(component.find('EuiText').text()).toEqual('Completed in 500 ms');
  });

  it('shows ready status with complete in seconds message', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.READY,
        startTime: new Date().getTime(),
        elapsedMs: 2000,
      },
    };
    const component = mountWithIntl(<QueryResult {...props} />);
    expect(component.find('EuiText').text()).toEqual('Completed in 2.0 s');
  });

  it('shows ready status with split seconds', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.READY,
        startTime: new Date().getTime(),
        elapsedMs: 2700,
      },
    };
    const component = mountWithIntl(<QueryResult {...props} />);
    expect(component.find('EuiText').text()).toEqual('Completed in 2.7 s');
  });

  it('show error status with error message', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.ERROR,
        body: {
          error: {
            reason: 'error reason',
            details: 'error details',
          },
          statusCode: 400,
        },
      },
    };
    const component = shallowWithIntl(<QueryResult {...props} />);
    expect(component.find(`[data-test-subj="queryResultError"]`).text()).toMatchInlineSnapshot(
      `"<EuiPopover />"`
    );
    component.find(`[data-test-subj="queryResultError"]`).simulate('click');
    expect(component).toMatchSnapshot();
  });

  it('returns null when error body is empty', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.ERROR,
      },
    };
    const component = shallowWithIntl(<QueryResult {...props} />);
    expect(component).toEqual({});
  });
});
