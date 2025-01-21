import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { UploadForm } from './upload_form';
import { HttpStart, NotificationsStart } from '../../../../core/public';
import { PreviewComponent } from './preview_component'; // Adjust the path as necessary

const mockHttp: HttpStart = {
  get: jest.fn(),
  post: jest.fn(),
  // ...other methods
} as any;

const mockNotifications: NotificationsStart = {
  toasts: {
    addSuccess: jest.fn(),
    addDanger: jest.fn(),
    // ...other methods
  },
} as any;

describe('UploadForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form', () => {
    const { getByText } = render(<UploadForm http={mockHttp} notifications={mockNotifications} />);
    expect(getByText('Upload Form')).toBeInTheDocument();
  });

  it('handles file change', async () => {
    const { getByLabelText } = render(
      <UploadForm http={mockHttp} notifications={mockNotifications} />
    );
    const fileInput = getByLabelText('File') as HTMLInputElement;

    const file = new File(['name,age\nJohn,30\nJane,25'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(fileInput.files?.[0]).toBe(file);
    });
  });

  it('handles form submission', async () => {
    (mockHttp.post as jest.Mock).mockResolvedValue({ documentsCount: 2, totalDocuments: 2 });

    const { getByText, getByLabelText } = render(
      <UploadForm http={mockHttp} notifications={mockNotifications} />
    );
    const fileInput = getByLabelText('File') as HTMLInputElement;
    const indexNameInput = getByLabelText('Index Name') as HTMLInputElement;
    const submitButton = getByText('Submit');

    const file = new File(['name,age\nJohn,30\nJane,25'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.change(indexNameInput, { target: { value: 'test-index' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHttp.post).toHaveBeenCalledWith('/api/data_importer/upload', expect.any(Object));
      expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith(
        'Successfully indexed documents'
      );
    });
  });

  it('handles form submission error', async () => {
    (mockHttp.post as jest.Mock).mockRejectedValue(new Error('Upload failed'));

    const { getByText, getByLabelText } = render(
      <UploadForm http={mockHttp} notifications={mockNotifications} />
    );
    const fileInput = getByLabelText('File') as HTMLInputElement;
    const indexNameInput = getByLabelText('Index Name') as HTMLInputElement;
    const submitButton = getByText('Submit');

    const file = new File(['name,age\nJohn,30\nJane,25'], 'test.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.change(indexNameInput, { target: { value: 'test-index' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHttp.post).toHaveBeenCalledWith('/api/data_importer/upload', expect.any(Object));
      expect(mockNotifications.toasts.addDanger).toHaveBeenCalledWith('Error: Upload failed');
    });
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
