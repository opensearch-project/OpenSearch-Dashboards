/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, fireEvent, screen, act } from '@testing-library/react';
import { WorkspaceCollaboratorInput } from './workspace_collaborator_input';

describe('WorkspaceCollaboratorInput', () => {
  const defaultProps = {
    index: 0,
    collaboratorId: '',
    accessLevel: 'readOnly' as const,
    onCollaboratorIdChange: jest.fn(),
    onAccessLevelChange: jest.fn(),
    onDelete: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('calls onCollaboratorIdChange when input value changes', () => {
    render(<WorkspaceCollaboratorInput {...defaultProps} />);
    const input = screen.getByTestId('workspaceCollaboratorIdInput-0');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(defaultProps.onCollaboratorIdChange).toHaveBeenCalledWith('test', 0);
  });

  it('calls onAccessLevelChange when access level changes', () => {
    render(<WorkspaceCollaboratorInput {...defaultProps} />);
    const readButton = screen.getByText('Admin');
    fireEvent.click(readButton);
    expect(defaultProps.onAccessLevelChange).toHaveBeenCalledWith('admin', 0);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<WorkspaceCollaboratorInput {...defaultProps} />);
    const deleteButton = screen.getByRole('button', { name: 'Delete collaborator 0' });
    fireEvent.click(deleteButton);
    expect(defaultProps.onDelete).toHaveBeenCalledWith(0);
  });

  it('collaborator id input should be invalid when error passed', () => {
    render(<WorkspaceCollaboratorInput {...defaultProps} error="error" />);
    expect(screen.getByTestId('workspaceCollaboratorIdInput-0')).toBeInvalid();
  });

  describe('with identitySource', () => {
    const httpMock = { get: jest.fn() };
    const identitySource = { source: 'LDAP', type: 'user' };
    const propsWithIdentitySource = {
      ...defaultProps,
      identitySource,
      http: httpMock as any,
    };

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('renders EuiComboBox when identitySource is provided', () => {
      render(<WorkspaceCollaboratorInput {...propsWithIdentitySource} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.queryByTestId('workspaceCollaboratorIdInput-0')).not.toBeNull();
    });

    it('calls http.get on search after debounce', async () => {
      httpMock.get.mockResolvedValue([{ id: 'user-1', name: 'Alice' }]);
      render(<WorkspaceCollaboratorInput {...propsWithIdentitySource} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'ali' } });

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      expect(httpMock.get).toHaveBeenCalledWith('/api/security/identity/_entries', {
        query: { source: 'LDAP', type: 'user', keyword: 'ali' },
        signal: expect.any(AbortSignal),
      });
    });

    it('clears options when search value is empty', () => {
      render(<WorkspaceCollaboratorInput {...propsWithIdentitySource} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: '' } });
      jest.advanceTimersByTime(300);
      expect(httpMock.get).not.toHaveBeenCalled();
    });

    it('handles http error gracefully', async () => {
      httpMock.get.mockRejectedValue(new Error('Network error'));
      render(<WorkspaceCollaboratorInput {...propsWithIdentitySource} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      expect(httpMock.get).toHaveBeenCalled();
      // Should not throw, component remains functional
    });

    it('does not call http.get when identitySource or http is missing', () => {
      render(<WorkspaceCollaboratorInput {...defaultProps} identitySource={identitySource} />);
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'test' } });
      jest.advanceTimersByTime(300);
      expect(httpMock.get).not.toHaveBeenCalled();
    });

    it('aborts previous request on new search', async () => {
      httpMock.get.mockResolvedValue([{ id: 'user-1', name: 'Alice' }]);
      render(<WorkspaceCollaboratorInput {...propsWithIdentitySource} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'al' } });
      jest.advanceTimersByTime(100);
      fireEvent.change(input, { target: { value: 'ali' } });

      await act(async () => {
        jest.advanceTimersByTime(300);
      });

      // Only the second search should have completed
      expect(httpMock.get).toHaveBeenCalledTimes(1);
      expect(httpMock.get).toHaveBeenCalledWith('/api/security/identity/_entries', {
        query: { source: 'LDAP', type: 'user', keyword: 'ali' },
        signal: expect.any(AbortSignal),
      });
    });
  });
});
