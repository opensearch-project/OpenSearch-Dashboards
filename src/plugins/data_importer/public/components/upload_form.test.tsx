import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { UploadFormComponent } from './upload_form_component';
import { PreviewComponent } from './preview_component';

describe('UploadFormComponent', () => {
  const props = {
    indexName: '',
    setIndexName: jest.fn(),
    delimiter: ',',
    setDelimiter: jest.fn(),
    clusters: [],
    cluster: '',
    setCluster: jest.fn(),
    file: null,
    handleFileChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false,
    message: '',
    indexOptions: [],
  };

  it('renders form elements', () => {
    render(<UploadFormComponent {...props} />);
    expect(screen.getByLabelText(/Index Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Delimiter/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/File/i)).toBeInTheDocument();
  });

  it('calls handleSubmit on form submit', () => {
    render(<UploadFormComponent {...props} />);
    fireEvent.submit(screen.getByRole('button', { name: /Upload and Index/i }));
    expect(props.handleSubmit).toHaveBeenCalled();
  });
});

describe('PreviewComponent', () => {
  const props = {
    previewData: [{ field1: 'value1', field2: 'value2' }],
    visibleRows: 1,
    loadMoreRows: jest.fn(),
  };

  it('renders preview data', () => {
    render(<PreviewComponent {...props} />);
    expect(screen.getByText(/Preview Data/i)).toBeInTheDocument();
    expect(screen.getByText(/value1/i)).toBeInTheDocument();
    expect(screen.getByText(/value2/i)).toBeInTheDocument();
  });

  it('calls loadMoreRows on button click', () => {
    render(<PreviewComponent {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Click to Add More/i }));
    expect(props.loadMoreRows).toHaveBeenCalled();
  });
});
