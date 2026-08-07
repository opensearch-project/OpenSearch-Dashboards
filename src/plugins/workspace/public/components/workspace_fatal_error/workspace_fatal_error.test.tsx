/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IntlProvider } from 'react-intl';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { WorkspaceFatalError } from './workspace_fatal_error';
import { context } from '../../../../opensearch_dashboards_react/public';
import { coreMock } from '../../../../../core/public/mocks';

describe('<WorkspaceFatalError />', () => {
  it('render normally', async () => {
    const { findByText, container } = render(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <WorkspaceFatalError />
      </IntlProvider>
    );
    await findByText('Something went wrong');
    expect(container).toMatchSnapshot();
  });

  it('render error with callout', async () => {
    const { findByText, container } = render(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <WorkspaceFatalError error="errorInCallout" />
      </IntlProvider>
    );
    await findByText('errorInCallout');
    expect(container).toMatchSnapshot();
  });

  it('click go back to homepage', async () => {
    const coreStartMock = coreMock.createStart();
    // Replace prepend with a jest.fn() that returns an absolute URL so that
    // window.location.href = prepend('/') doesn't throw "Invalid URL" in jsdom 26.
    const prependMock = jest.fn().mockReturnValue('http://localhost:5601/');
    coreStartMock.http.basePath.prepend = prependMock;

    const { getByText } = render(
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      <IntlProvider locale="en">
        <context.Provider
          value={
            {
              services: coreStartMock,
            } as any
          }
        >
          <WorkspaceFatalError error="errorInCallout" />
        </context.Provider>
      </IntlProvider>
    );
    fireEvent.click(getByText('Go back to homepage'));
    await waitFor(() => {
      expect(prependMock).toHaveBeenCalledWith('/', expect.anything());
    });
  });
});
