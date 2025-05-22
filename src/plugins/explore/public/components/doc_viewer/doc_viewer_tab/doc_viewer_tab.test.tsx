/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DocViewerTab, IDocViewerTabProps } from './doc_viewer_tab';
import { DocViewRenderProps } from '../../../types/doc_views_types';
import { IndexPattern } from 'src/plugins/data/public';

const mockIndexPattern = {
  fields: [
    { name: 'timestamp', type: 'date' },
    { name: 'message', type: 'text' },
    { name: 'status', type: 'keyword' },
  ],
} as IndexPattern;

describe('DocViewerTab', () => {
  const MockComp = ({ columns }: DocViewRenderProps) => (
    <div data-test-subj="test-div">{columns![0]}</div>
  );

  const mockProps: IDocViewerTabProps = {
    id: 1,
    title: 'Test1',
    component: MockComp,
    renderProps: {
      hit: { _index: '0', _type: 'test type', _id: '1', _score: 1, _source: 'test source' },
      columns: ['test1'],
      indexPattern: mockIndexPattern,
    },
  };

  it('renders correctly with a component prop', () => {
    render(<DocViewerTab {...mockProps} />);

    // Check that our test component renders with props passed correctly
    const testComponent = screen.getByTestId('test-div');
    expect(testComponent).toBeInTheDocument();
  });

  it('renders correctly with a render prop', () => {
    const renderFn = jest.fn();

    render(<DocViewerTab {...mockProps} render={renderFn} />);

    // Check that the DocViewRenderTab is used when render prop is provided
    const renderTab = screen.getByTestId('docViewRenderTab');
    expect(renderTab).toBeInTheDocument();
  });

  it('shows error when neither component nor render is provided', () => {
    render(<DocViewerTab {...mockProps} component={undefined} render={undefined} />);

    // Check that error component is shown with proper message
    const errorComponent = screen.getByTestId('docViewerError');
    expect(errorComponent).toBeInTheDocument();
  });

  it('catches errors in child components', () => {
    // Create a component that throws an error when rendered
    const ErrorComponent = () => {
      throw new Error('Test error in component');
    };

    // Using Jest's spyOn to silence the expected error in console
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<DocViewerTab {...mockProps} component={ErrorComponent} />);

    // Check that error boundary caught the error and rendered the error component
    const errorComponent = screen.getByTestId('docViewerError');
    expect(errorComponent).toBeInTheDocument();

    // Restore console.error
    // eslint-disable-next-line no-console
    (console.error as jest.Mock).mockRestore();
  });
});
