/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StyleAccordion } from './style_accordion';

describe('StyleAccordion', () => {
  const accordionLabel = 'Accordion Label';
  const childContent = 'Child Content';

  it('should render the accordion label', () => {
    render(
      <StyleAccordion id="test-accordion" accordionLabel={accordionLabel} initialIsOpen={false} />
    );
    const labelElement = screen.getByText(accordionLabel);
    expect(labelElement).toBeInTheDocument();
  });

  it('should render the child content when the accordion is open', () => {
    render(
      // @ts-expect-error TS2322 TODO(ts-error): fixme
      <StyleAccordion id="test-accordion" accordionLabel={accordionLabel} initialIsOpen={true}>
        {childContent}
      </StyleAccordion>
    );
    const childContentElement = screen.getByText(childContent);
    expect(childContentElement).toBeInTheDocument();
  });
});
