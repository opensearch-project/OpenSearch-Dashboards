/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl, shallowWithIntl } from 'test_utils/enzyme_helpers';
import { QueryError } from './query_error';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ResultStatus } from './types';

describe('Query Result', () => {
  it('should not render if status is uninitialized', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.UNINITIALIZED,
        startTime: Number.NEGATIVE_INFINITY,
      },
    };
    const component = shallowWithIntl(<QueryError {...props} />);
    expect(component.isEmptyRender()).toBe(true);
  });

  it('shows ready status with complete message', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.READY,
        startTime: new Date().getTime(),
      },
    };
    const component = mountWithIntl(<QueryError {...props} />);
    const loadingIndicator = component.find('[data-test-subj="queryResultLoading"]');
    expect(loadingIndicator.exists()).toBeFalsy();
    expect(component.find('EuiText').text()).toEqual('Completed');
  });

  it('shows ready status with complete in miliseconds message', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.READY,
        startTime: Date.now(),
        elapsedMs: 500,
      },
    };
    const component = mountWithIntl(<QueryError {...props} />);
    expect(component.find('EuiText').text()).toEqual('Completed in 500 ms');
  });

  it('shows ready status with complete in seconds message', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.READY,
        startTime: Date.now(),
        elapsedMs: 2000,
      },
    };
    const component = mountWithIntl(<QueryError {...props} />);
    expect(component.find('EuiText').text()).toEqual('Completed in 2.0 s');
  });

  it('shows ready status with split seconds', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.READY,
        startTime: Date.now(),
        elapsedMs: 2700,
      },
    };
    const component = mountWithIntl(<QueryError {...props} />);
    expect(component.find('EuiText').text()).toEqual('Completed in 2.7 s');
  });

  it('show error status with error message', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.ERROR,
        body: {
          error: {
            message: {
              reason: 'error reason',
              details: 'error details',
              status: 400,
            },
          },
          statusCode: 400,
        },
      },
    };
    const component = shallowWithIntl(<QueryError {...props} />);
    const errorElement = component.find(`[data-test-subj="queryPanelResultError"]`);
    expect(errorElement.exists()).toBe(true);
  });

  it('returns null when error body is empty', () => {
    const props = {
      queryStatus: {
        status: ResultStatus.ERROR,
      },
    };
    const component = shallowWithIntl(<QueryError {...props} />);
    expect(component).toEqual({});
  });

  it('should render error message correctly with normal search strategy', async () => {
    const props = {
      queryStatus: {
        status: ResultStatus.ERROR,
        body: {
          error: {
            error: 'error',
            statusCode: 400,
            message: {
              error: {
                reason: 'error reason',
                details: 'error details',
                type: 'error type',
              },
              status: 400,
            },
          },
        },
      },
    };

    render(<QueryError {...props} />);

    await fireEvent.click(screen.getByText('Error'));

    await waitFor(() => {
      expect(screen.getByText('error reason')).toBeInTheDocument();
    });
  });

  it('should render error message correctly with async search strategy', async () => {
    const props = {
      queryStatus: {
        status: ResultStatus.ERROR,
        body: {
          error: {
            error: 'error',
            statusCode: 400,
            message: {
              error: 'error message',
              status: 400,
            },
          },
        },
      },
    };

    render(<QueryError {...props} />);

    await fireEvent.click(screen.getByText('Error'));

    await waitFor(() => {
      expect(screen.getByText('error message')).toBeInTheDocument();
    });
  });

  it('should render error message with flexible error format', async () => {
    const props = {
      queryStatus: {
        status: ResultStatus.ERROR,
        body: {
          error: {
            error: 'error',
            statusCode: 400,
            message: {
              reason: 'error message',
              status: 400,
            },
          },
        },
      },
    };

    render(<QueryError {...props} />);

    await fireEvent.click(screen.getByText('Error'));

    await waitFor(() => {
      expect(screen.getByText('{"reason":"error message","status":400}')).toBeInTheDocument();
    });
  });
});
