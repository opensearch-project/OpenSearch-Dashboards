/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { SimplePopover } from './simple_popover';
import userEventModule from '@testing-library/user-event';

describe('<SimplePopover /> spec', () => {
  const userEvent = userEventModule.setup();

  it('renders the component', () => {
    render(<SimplePopover button={<div>123</div>} />);
    expect(document.body.children).toMatchSnapshot();
  });

  it('render the component with hover', async () => {
    const { getByTestId, queryByText } = render(
      <>
        <SimplePopover triggerType="hover" button={<div data-test-subj="test">button</div>}>
          content in popover
        </SimplePopover>
        <div data-test-subj="anotherElement">another element</div>
      </>
    );
    await userEvent.hover(getByTestId('test'));
    await waitFor(() => {
      expect(queryByText('content in popover')).not.toBeNull();
    });
    await userEvent.hover(getByTestId('anotherElement'));
    await waitFor(() => {
      expect(queryByText('content in popover')).toBeNull();
    });
  });

  it('render the component with click', async () => {
    const { getByTestId, queryByText } = render(
      <SimplePopover button={<div data-test-subj="test">button</div>}>
        content in popover
      </SimplePopover>
    );
    await userEvent.click(getByTestId('test'));
    await waitFor(() => {
      expect(queryByText('content in popover')).not.toBeNull();
    });
    await userEvent.click(document.body);
    await waitFor(() => {
      expect(queryByText('content in popover')).toBeNull();
    });
  });
});
