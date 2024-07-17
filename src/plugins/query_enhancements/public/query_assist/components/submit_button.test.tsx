/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render } from '@testing-library/react';
import React, { ComponentProps } from 'react';
import { QueryAssistSubmitButton } from './submit_button';

type SubmitButtonProps = ComponentProps<typeof QueryAssistSubmitButton>;

const renderSubmitButton = (overrideProps: Partial<SubmitButtonProps> = {}) => {
  const props: SubmitButtonProps = Object.assign<SubmitButtonProps, Partial<SubmitButtonProps>>(
    {
      isDisabled: false,
    },
    overrideProps
  );
  const onSubmit = jest.fn((e) => e.preventDefault());
  const component = render(
    <form onSubmit={onSubmit}>
      <QueryAssistSubmitButton {...props} />
    </form>
  );
  return { component, onSubmit, props: props as jest.MockedObjectDeep<SubmitButtonProps> };
};

describe('<SubmitButton /> spec', () => {
  it('should trigger submit form', () => {
    const { component, onSubmit } = renderSubmitButton();
    fireEvent.click(component.getByTestId('query-assist-submit-button'));
    expect(onSubmit).toBeCalled();
  });
});
