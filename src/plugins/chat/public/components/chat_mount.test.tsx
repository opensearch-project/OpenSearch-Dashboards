/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ChatMount } from './chat_mount';
import { coreMock } from '../../../../core/public/mocks';
import { ChatService } from '../services/chat_service';
import { SuggestedActionsService } from '../services/suggested_action';
import { ConfirmationService } from '../services/confirmation_service';
import { ChatLayoutMode } from '../types';

// Mock dependencies
jest.mock('../../../opensearch_dashboards_react/public', () => ({
  OpenSearchDashboardsContextProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="opensearch-dashboards-context-provider">{children}</div>
  ),
}));

jest.mock('../../../context_provider/public', () => ({
  TextSelectionMonitor: () => <div data-test-subj="text-selection-monitor">Text Monitor</div>,
  GlobalAssistantProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="global-assistant-provider">{children}</div>
  ),
}));

jest.mock('../contexts/chat_context', () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="chat-provider">{children}</div>
  ),
}));

jest.mock('./chat_window', () => ({
  ChatWindow: ({ layoutMode, onClose }: { layoutMode: string; onClose: () => void }) => (
    <div data-test-subj="chat-window" data-layout-mode={layoutMode}>
      <button data-test-subj="close-button" onClick={onClose}>
        Close
      </button>
    </div>
  ),
}));

describe('ChatMount', () => {
  let mockCore: ReturnType<typeof coreMock.createStart>;
  let mockChatService: jest.Mocked<ChatService>;
  let mockSuggestedActionsService: jest.Mocked<SuggestedActionsService>;
  let mockConfirmationService: jest.Mocked<ConfirmationService>;
  let mockContextProvider: any;
  let mockCharts: any;
  let defaultProps: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCore = coreMock.createStart();
    mockCore.chat.closeWindow = jest.fn();

    mockChatService = {
      sendMessage: jest.fn(),
      stopStreaming: jest.fn(),
      getPaddingSize: jest.fn().mockReturnValue('m'),
    } as any;

    mockSuggestedActionsService = {
      getSuggestedActions: jest.fn(),
    } as any;

    mockConfirmationService = {
      requestConfirmation: jest.fn(),
    } as any;

    mockContextProvider = {
      getContextProvider: jest.fn(),
    };

    mockCharts = {
      theme: {
        useChartsTheme: jest.fn(),
      },
    };

    defaultProps = {
      core: mockCore,
      chatService: mockChatService,
      suggestedActionsService: mockSuggestedActionsService,
      confirmationService: mockConfirmationService,
    };
  });

  it('should render all required components with correct structure', () => {
    const { getByTestId, container } = render(<ChatMount {...defaultProps} />);

    expect(getByTestId('text-selection-monitor')).toBeTruthy();
    expect(getByTestId('opensearch-dashboards-context-provider')).toBeTruthy();
    expect(getByTestId('global-assistant-provider')).toBeTruthy();
    expect(getByTestId('chat-provider')).toBeTruthy();
    expect(getByTestId('chat-window')).toBeTruthy();

    const mountPoint = container.querySelector('.chatMount__mountPoint');
    expect(mountPoint).toBeTruthy();

    const content = container.querySelector('.chatMount__content');
    expect(content).toBeTruthy();
  });

  it('should render ChatWindow with SIDECAR layout mode', () => {
    const { getByTestId } = render(<ChatMount {...defaultProps} />);

    const chatWindow = getByTestId('chat-window');
    expect(chatWindow.getAttribute('data-layout-mode')).toBe(ChatLayoutMode.SIDECAR);
  });

  it('should render with optional contextProvider and charts', () => {
    const { getByTestId } = render(
      <ChatMount {...defaultProps} contextProvider={mockContextProvider} charts={mockCharts} />
    );

    expect(getByTestId('opensearch-dashboards-context-provider')).toBeTruthy();
    expect(getByTestId('chat-window')).toBeTruthy();
  });

  it('should render without optional dependencies', () => {
    const { getByTestId } = render(
      <ChatMount {...defaultProps} contextProvider={undefined} charts={undefined} />
    );

    expect(getByTestId('chat-window')).toBeTruthy();
  });

  it('should nest components in correct hierarchy', () => {
    const { container } = render(<ChatMount {...defaultProps} />);

    const mountPoint = container.querySelector('.chatMount__mountPoint');
    const content = mountPoint?.querySelector('.chatMount__content');
    const contextProvider = content?.querySelector(
      '[data-test-subj="opensearch-dashboards-context-provider"]'
    );
    const globalAssistant = contextProvider?.querySelector(
      '[data-test-subj="global-assistant-provider"]'
    );
    const chatProvider = globalAssistant?.querySelector('[data-test-subj="chat-provider"]');
    const chatWindow = chatProvider?.querySelector('[data-test-subj="chat-window"]');

    expect(mountPoint).toBeTruthy();
    expect(content).toBeTruthy();
    expect(contextProvider).toBeTruthy();
    expect(globalAssistant).toBeTruthy();
    expect(chatProvider).toBeTruthy();
    expect(chatWindow).toBeTruthy();
  });

  it('should render TextSelectionMonitor as sibling to main content', () => {
    const { container, getByTestId } = render(<ChatMount {...defaultProps} />);

    const textMonitor = getByTestId('text-selection-monitor');
    const mountPoint = container.querySelector('.chatMount__mountPoint');

    // TextSelectionMonitor should be a sibling, not a child of mountPoint
    expect(mountPoint?.contains(textMonitor)).toBe(false);
    expect(textMonitor.parentElement).toBe(mountPoint?.parentElement);
  });

  it('should call core.chat.closeWindow when ChatWindow onClose is triggered', () => {
    const { getByTestId } = render(<ChatMount {...defaultProps} />);

    const closeButton = getByTestId('close-button');
    closeButton.click();

    expect(mockCore.chat.closeWindow).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple close calls', () => {
    const { getByTestId } = render(<ChatMount {...defaultProps} />);

    const closeButton = getByTestId('close-button');
    closeButton.click();
    closeButton.click();
    closeButton.click();

    expect(mockCore.chat.closeWindow).toHaveBeenCalledTimes(3);
  });

  it('should handle rapid re-renders without errors', () => {
    const { rerender, getByTestId } = render(<ChatMount {...defaultProps} />);

    rerender(<ChatMount {...defaultProps} />);
    rerender(<ChatMount {...defaultProps} />);

    const newChatService = {
      ...mockChatService,
      sendMessage: jest.fn(),
    } as any;

    rerender(<ChatMount {...defaultProps} chatService={newChatService} />);

    expect(getByTestId('text-selection-monitor')).toBeTruthy();
    expect(getByTestId('chat-window')).toBeTruthy();
  });
});
