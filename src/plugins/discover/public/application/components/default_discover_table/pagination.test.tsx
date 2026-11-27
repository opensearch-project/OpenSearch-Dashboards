/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Pagination } from './pagination';

const renderPagination = (props: Partial<React.ComponentProps<typeof Pagination>> = {}) => {
  const defaultProps = {
    pageCount: 10,
    activePage: 0,
    goToPage: jest.fn(),
    startItem: 1,
    endItem: 50,
    totalItems: 500,
    sampleSize: 500,
    ...props,
  };
  return {
    ...render(
      <IntlProvider locale="en">
        <Pagination {...defaultProps} />
      </IntlProvider>
    ),
    props: defaultProps,
  };
};

describe('Pagination', () => {
  it('renders the pagination container', () => {
    renderPagination();
    expect(screen.getByTestId('osdDocTablePagination')).toBeInTheDocument();
  });

  it('displays the correct item range and total', () => {
    renderPagination({ startItem: 1, endItem: 50, totalItems: 500 });
    // FormattedMessage renders "1–50 of 500" (with ndash)
    const container = screen.getByTestId('osdDocTablePagination');
    expect(container.textContent).toContain('1');
    expect(container.textContent).toContain('50');
    expect(container.textContent).toContain('500');
  });

  it('calls goToPage when a page is clicked', () => {
    const goToPage = jest.fn();
    renderPagination({ goToPage, pageCount: 5, activePage: 0 });
    // EuiPagination renders page buttons with aria-label "Page X of Y"
    const page2Button = screen.getByLabelText('Page 2 of 5');
    fireEvent.click(page2Button);
    expect(goToPage).toHaveBeenCalledWith(1); // 0-indexed
  });

  it('shows the sample size warning when endItem >= sampleSize', () => {
    renderPagination({ endItem: 500, sampleSize: 500 });
    const container = screen.getByTestId('osdDocTablePagination');
    expect(container.textContent).toContain('Limited to');
    expect(container.textContent).toContain('500');
    expect(container.textContent).toContain('Refine your search');
  });

  it('does not show the sample size warning when endItem < sampleSize', () => {
    renderPagination({ endItem: 50, sampleSize: 500 });
    const container = screen.getByTestId('osdDocTablePagination');
    expect(container.textContent).not.toContain('Limited to');
    expect(container.textContent).not.toContain('Refine your search');
  });

  it('renders the correct number of page buttons', () => {
    renderPagination({ pageCount: 3 });
    expect(screen.getByLabelText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 2 of 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Page 3 of 3')).toBeInTheDocument();
  });
});
