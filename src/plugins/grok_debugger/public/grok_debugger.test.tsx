/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent, waitFor } from '@testing-library/react';
import { GrokDebugger } from './grok_debugger';

const mockHttp = { post: jest.fn() };

const renderComponent = () => render(<GrokDebugger http={mockHttp as any} />);

const fillFields = (
  utils: ReturnType<typeof renderComponent>,
  sampleLog: string,
  pattern: string
) => {
  fireEvent.change(utils.getByPlaceholderText(/127\.0\.0\.1/), { target: { value: sampleLog } });
  fireEvent.change(utils.getByPlaceholderText(/IPORHOST/), { target: { value: pattern } });
};

beforeEach(() => jest.clearAllMocks());

describe('GrokDebugger', () => {
  it('renders the form fields', () => {
    const { getByPlaceholderText, getByText } = renderComponent();
    expect(getByPlaceholderText(/127\.0\.0\.1/)).toBeInTheDocument();
    expect(getByPlaceholderText(/IPORHOST/)).toBeInTheDocument();
    expect(getByText('Simulate')).toBeInTheDocument();
    expect(getByText('Clear')).toBeInTheDocument();
    expect(getByText('Results')).toBeInTheDocument();
  });

  it('clears all fields when Clear is clicked', () => {
    const utils = renderComponent();
    fillFields(utils, '127.0.0.1', '%{IP:client}');
    fireEvent.click(utils.getByText('Clear'));
    expect((utils.getByPlaceholderText(/127\.0\.0\.1/) as HTMLTextAreaElement).value).toBe('');
    expect((utils.getByPlaceholderText(/IPORHOST/) as HTMLTextAreaElement).value).toBe('');
  });

  it('disables Simulate button when inputs are empty', () => {
    const { getByText } = renderComponent();
    expect(getByText('Simulate').closest('button')).toBeDisabled();
  });

  it('enables Simulate button when both fields are filled', () => {
    const utils = renderComponent();
    fillFields(utils, '127.0.0.1 GET /index', '%{IP:client}');
    expect(utils.getByText('Simulate').closest('button')).not.toBeDisabled();
  });

  it('shows success result on successful simulate', async () => {
    mockHttp.post.mockResolvedValueOnce({
      docs: [{ doc: { _source: { client: '127.0.0.1' } } }],
    });

    const utils = renderComponent();
    fillFields(utils, '127.0.0.1', '%{IP:client}');
    fireEvent.click(utils.getByText('Simulate'));

    await utils.findByText('✓ Pattern matched');
    expect(utils.getAllByText('127.0.0.1').length).toBeGreaterThan(0);
    expect(utils.getByText('client')).toBeInTheDocument();
  });

  it('shows error when doc contains an error', async () => {
    mockHttp.post.mockResolvedValueOnce({
      docs: [{ error: { reason: 'Pattern did not match' } }],
    });

    const utils = renderComponent();
    fillFields(utils, 'bad log', '%{IP:client}');
    fireEvent.click(utils.getByText('Simulate'));

    await utils.findByText('✗ Pattern match failed');
    expect(utils.getByText('Pattern did not match')).toBeInTheDocument();
  });

  it('shows error from root_cause on HTTP 400', async () => {
    mockHttp.post.mockRejectedValueOnce({
      body: { error: { root_cause: [{ reason: 'Unable to find pattern [BADPATTERN]' }] } },
    });

    const utils = renderComponent();
    fillFields(utils, '127.0.0.1', '%{BADPATTERN:x}');
    fireEvent.click(utils.getByText('Simulate'));

    await utils.findByText('Unable to find pattern [BADPATTERN]');
  });

  it('sends capture_all_matches when checkbox is checked', async () => {
    mockHttp.post.mockResolvedValueOnce({
      docs: [{ doc: { _source: { ip: ['1.1.1.1'] } } }],
    });

    const utils = renderComponent();
    fillFields(utils, '1.1.1.1', '%{IP:ip}');
    fireEvent.click(utils.getByRole('checkbox', { name: 'Capture all matches' }));
    fireEvent.click(utils.getByText('Simulate'));

    await waitFor(() => expect(mockHttp.post).toHaveBeenCalled());
    const body = JSON.parse(mockHttp.post.mock.calls[0][1].body);
    expect(body.pipeline.processors[0].grok.capture_all_matches).toBe(true);
  });

  it('sends custom pattern_definitions when provided', async () => {
    mockHttp.post.mockResolvedValueOnce({
      docs: [{ doc: { _source: { num: '404' } } }],
    });

    const utils = renderComponent();
    fillFields(utils, '404', '%{MYNUM:num}');
    fireEvent.change(utils.getByPlaceholderText(/CUSTOM_PATTERN/), {
      target: { value: 'MYNUM \\d+' },
    });
    fireEvent.click(utils.getByText('Simulate'));

    await waitFor(() => expect(mockHttp.post).toHaveBeenCalled());
    const body = JSON.parse(mockHttp.post.mock.calls[0][1].body);
    expect(body.pipeline.processors[0].grok.pattern_definitions).toEqual({ MYNUM: '\\d+' });
  });
});
