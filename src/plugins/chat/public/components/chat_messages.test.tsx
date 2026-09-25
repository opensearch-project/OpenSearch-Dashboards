/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, act, waitFor, fireEvent } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { ChatMessages } from './chat_messages';
import { ChatLayoutMode } from '../types';
import type { Message, AssistantMessage, ToolMessage, UserMessage } from '../../common/types';
import { TOOL_EXECUTION_ERROR_PREFIX } from '../../common';
import { convertTimelineToMessageRows } from './chat_messages';
import {
  AssistantActionService,
  AssistantContextOptions,
  ToolCallState,
} from '../../../context_provider/public';
import { useOpenSearchDashboards } from '../../../opensearch_dashboards_react/public';
import { useChatContext } from '../contexts/chat_context';
import { StarterSuggestionsService } from '../../../starter_suggestions/public';

jest.mock('../../../opensearch_dashboards_react/public', () => ({
  ...jest.requireActual('../../../opensearch_dashboards_react/public'),
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../contexts/chat_context', () => ({
  ...jest.requireActual('../contexts/chat_context'),
  useChatContext: jest.fn(),
}));

const useOpenSearchDashboardsMock = useOpenSearchDashboards as jest.Mock;
const useChatContextMock = useChatContext as jest.Mock;

// Mock the child components
jest.mock('./message_row', () => ({
  MessageRow: ({ message, timeline }: any) => (
    <div data-test-subj="message-row" data-has-timeline={!!timeline}>
      {message.content}
    </div>
  ),
}));

jest.mock('./tool_call_row', () => ({
  ToolCallRow: () => <div data-test-subj="tool-call-row">Tool Call</div>,
}));

jest.mock('./error_row', () => ({
  ErrorRow: ({ error }: any) => <div data-test-subj="error-row">{error.content}</div>,
}));

jest.mock('./chat_suggestions', () => ({
  ChatSuggestions: () => <div data-test-subj="chat-suggestions">Suggestions</div>,
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('ChatMessages', () => {
  let starterSuggestionsService: StarterSuggestionsService;
  let agentVisibleContexts: AssistantContextOptions[];
  let notifyContextStore: () => void;
  let subscribeToContextStore: jest.Mock;
  let currentAppId$: BehaviorSubject<string | undefined>;
  let getCurrentDataSourceId: jest.Mock;

  const defaultProps: React.ComponentProps<typeof ChatMessages> = {
    layoutMode: ChatLayoutMode.SIDECAR,
    timeline: [] as Message[],
    isStreaming: false,
    onResendMessage: jest.fn(),
    onApproveConfirmation: jest.fn(),
    onRejectConfirmation: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    starterSuggestionsService = new StarterSuggestionsService();
    agentVisibleContexts = [];
    notifyContextStore = () => {};
    currentAppId$ = new BehaviorSubject<string | undefined>('explore');
    getCurrentDataSourceId = jest.fn().mockResolvedValue('ds-1');

    subscribeToContextStore = jest.fn((callback: () => void) => {
      notifyContextStore = callback;
      return () => {
        notifyContextStore = () => {};
      };
    });
    const contextStore = { subscribe: subscribeToContextStore };

    useChatContextMock.mockReturnValue({
      chatService: {
        getAgentVisibleContexts: () => agentVisibleContexts,
        getCurrentDataSourceId,
      },
    });

    useOpenSearchDashboardsMock.mockReturnValue({
      services: {
        core: { application: { currentAppId$ } },
        contextProvider: { getAssistantContextStore: () => contextStore },
        starterSuggestions: starterSuggestionsService,
      },
    });
  });

  describe('rendering', () => {
    it('should render empty state when no messages', () => {
      const { getByText } = render(<ChatMessages {...defaultProps} />);

      expect(getByText("Hi, I'm your AI Assistant")).toBeTruthy();
    });

    it('should render messages from timeline', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getAllByTestId('message-row')).toHaveLength(2);
    });

    it('should render loading indicator when streaming with empty timeline', () => {
      const { getByText } = render(<ChatMessages {...defaultProps} isStreaming={true} />);

      expect(getByText('Thinking...')).toBeTruthy();
    });

    it('should apply layout mode class', () => {
      const { container } = render(
        <ChatMessages {...defaultProps} layoutMode={ChatLayoutMode.FULLSCREEN} />
      );

      expect(container.querySelector('.chatMessages--fullscreen')).toBeTruthy();
    });
  });

  describe('conversation history in empty state', () => {
    it('should render starter suggestions without conversation history when services are not provided', () => {
      const onShowHistory = jest.fn();
      const { getByText, queryByText } = render(
        <ChatMessages {...defaultProps} onShowHistory={onShowHistory} />
      );

      // Verify non-tool-gated starter suggestions are present
      expect(getByText('Ask questions about your data')).toBeTruthy();
      expect(getByText('Explain a concept')).toBeTruthy();
      // /investigate card is hidden when create_investigation tool is not registered
      expect(queryByText('/investigate an issue')).toBeNull();
      // RecentSessions should not render without required props
      expect(queryByText('RECENT')).toBeNull();
    });

    it('should show /investigate card when create_investigation tool is registered', () => {
      const service = AssistantActionService.getInstance();
      service.registerAction({
        name: 'create_investigation',
        description: 'Create an investigation',
        parameters: { type: 'object', properties: {}, required: [] },
      });

      const { getByText } = render(<ChatMessages {...defaultProps} />);

      expect(getByText('/investigate an issue')).toBeTruthy();

      // Cleanup
      service.unregisterAction('create_investigation');
    });

    it('should hide /investigate card when create_investigation tool is unregistered', () => {
      const service = AssistantActionService.getInstance();
      service.registerAction({
        name: 'create_investigation',
        description: 'Create an investigation',
        parameters: { type: 'object', properties: {}, required: [] },
      });

      const { queryByText } = render(<ChatMessages {...defaultProps} />);
      expect(queryByText('/investigate an issue')).toBeTruthy();

      // Unregister the tool within act() to flush state updates
      act(() => {
        service.unregisterAction('create_investigation');
      });

      expect(queryByText('/investigate an issue')).toBeNull();
    });

    it('should render RecentSessions component when all required props are provided', async () => {
      const onShowHistory = jest.fn();
      const onSelectConversation = jest.fn();
      const mockConversationHistoryService = {
        getConversations: jest.fn().mockResolvedValue({
          conversations: [
            {
              id: '1',
              threadId: 'thread-1',
              name: 'Test conversation',
              messages: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          hasMore: false,
          total: 1,
        }),
      };

      const { findByText } = render(
        <ChatMessages
          {...defaultProps}
          onShowHistory={onShowHistory}
          conversationHistoryService={mockConversationHistoryService as any}
          onSelectConversation={onSelectConversation}
        />
      );

      // Verify starter suggestions are present
      expect(await findByText('Ask questions about your data')).toBeTruthy();
      // RecentSessions should render with required props
      expect(await findByText('RECENT')).toBeTruthy();
      expect(await findByText('Test conversation')).toBeTruthy();
    });
  });

  describe('page-aware starter suggestions', () => {
    const PROVIDER_CARD_TEXT = 'Summarize this dashboard';

    const registerProvider = (getSuggestions: jest.Mock, appId: string | string[] = 'explore') =>
      starterSuggestionsService.registerProvider({ id: 'test', appId, getSuggestions });

    it('keeps the defaults when no provider is registered for the app', async () => {
      const { getByText } = render(<ChatMessages {...defaultProps} />);

      await waitFor(() => expect(getByText('Ask questions about your data')).toBeTruthy());
      expect(getByText('Explain a concept')).toBeTruthy();
    });

    it('does not watch the context store on an app with no provider', async () => {
      const { getByText } = render(<ChatMessages {...defaultProps} />);

      await waitFor(() => expect(getByText('Ask questions about your data')).toBeTruthy());
      expect(subscribeToContextStore).not.toHaveBeenCalled();
    });

    it('watches the context store once an app has a provider', async () => {
      registerProvider(jest.fn().mockReturnValue([{ icon: 'help', text: PROVIDER_CARD_TEXT }]));

      const { findByText } = render(<ChatMessages {...defaultProps} />);

      expect(await findByText(PROVIDER_CARD_TEXT)).toBeTruthy();
      expect(subscribeToContextStore).toHaveBeenCalledTimes(1);
    });

    it('keeps the defaults when a provider is registered for a different app', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions, 'dashboards');

      const { getByText, queryByText } = render(<ChatMessages {...defaultProps} />);

      await waitFor(() => expect(getByText('Ask questions about your data')).toBeTruthy());
      expect(queryByText(PROVIDER_CARD_TEXT)).toBeNull();
      expect(getSuggestions).not.toHaveBeenCalled();
    });

    it('swaps the defaults out for the cards the provider returns', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions);

      const { findByText, queryByText } = render(<ChatMessages {...defaultProps} />);

      expect(await findByText(PROVIDER_CARD_TEXT)).toBeTruthy();
      expect(queryByText('Ask questions about your data')).toBeNull();
    });

    it("marks the built-in cards with the app id and a 'default' provider segment", async () => {
      const { getByTestId } = render(<ChatMessages {...defaultProps} />);

      await waitFor(() =>
        expect(getByTestId('chatbotStarterSuggestion-explore-default-askData')).toHaveTextContent(
          'Ask questions about your data'
        )
      );
      // 'explain' sits at index 1 or 2 depending on whether the tool-gated
      // /investigate card is present; the subj must not move with it.
      expect(getByTestId('chatbotStarterSuggestion-explore-default-explain')).toHaveTextContent(
        'Explain a concept'
      );
    });

    it('names the answering provider in the card test subj', async () => {
      const getSuggestions = jest.fn().mockReturnValue([
        { id: 'fixQueryError', icon: 'alert', text: 'Fix this query error' },
        { id: 'summarizeResults', icon: 'help', text: PROVIDER_CARD_TEXT },
      ]);
      starterSuggestionsService.registerProvider({
        id: 'explore',
        appId: 'explore',
        getSuggestions,
      });

      const { findByTestId, getByTestId, queryByTestId } = render(
        <ChatMessages {...defaultProps} />
      );

      expect(
        await findByTestId('chatbotStarterSuggestion-explore-explore-fixQueryError')
      ).toHaveTextContent('Fix this query error');
      expect(
        getByTestId('chatbotStarterSuggestion-explore-explore-summarizeResults')
      ).toHaveTextContent(PROVIDER_CARD_TEXT);
      expect(queryByTestId('chatbotStarterSuggestion-explore-default-askData')).toBeNull();
    });

    it('labels a card with the appId it was fetched for, not the live one', async () => {
      // The provider answers for 'explore'; the service echoes that appId back,
      // so the subj cannot pair a newer app id with this provider's cards.
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ id: 'summarizeResults', icon: 'help', text: PROVIDER_CARD_TEXT }]);
      starterSuggestionsService.registerProvider({
        id: 'explore',
        appId: 'explore',
        getSuggestions,
      });

      const { findByTestId } = render(<ChatMessages {...defaultProps} />);

      expect(
        await findByTestId('chatbotStarterSuggestion-explore-explore-summarizeResults')
      ).toHaveTextContent(PROVIDER_CARD_TEXT);
    });

    it('does not call the provider once the conversation has messages', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ id: 'summarizeResults', icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions);

      const timeline: Message[] = [{ id: 'u1', role: 'user', content: 'hi' }];
      const { queryByText } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      await waitFor(() => expect(queryByText('Ask questions about your data')).toBeNull());
      expect(getSuggestions).not.toHaveBeenCalled();
    });

    it('does not call the provider while a response is streaming', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ id: 'summarizeResults', icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions);

      render(<ChatMessages {...defaultProps} isStreaming={true} />);

      await waitFor(() => expect(getSuggestions).not.toHaveBeenCalled());
    });

    it('calls the provider again when the screen goes back to empty', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ id: 'summarizeResults', icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions);

      const timeline: Message[] = [{ id: 'u1', role: 'user', content: 'hi' }];
      const { rerender, findByText } = render(
        <ChatMessages {...defaultProps} timeline={timeline} />
      );
      expect(getSuggestions).not.toHaveBeenCalled();

      rerender(<ChatMessages {...defaultProps} timeline={[]} />);

      expect(await findByText(PROVIDER_CARD_TEXT)).toBeTruthy();
      expect(getSuggestions).toHaveBeenCalledTimes(1);
    });

    it('ignores an invalidate raised while the conversation has messages', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ id: 'summarizeResults', icon: 'help', text: PROVIDER_CARD_TEXT }]);
      const registration = registerProvider(getSuggestions);

      const timeline: Message[] = [{ id: 'u1', role: 'user', content: 'hi' }];
      render(<ChatMessages {...defaultProps} timeline={timeline} />);

      registration.invalidate();

      await waitFor(() => expect(getSuggestions).not.toHaveBeenCalled());
    });

    it('falls back to the card position when a provider card has no id', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions);

      const { findByTestId } = render(<ChatMessages {...defaultProps} />);

      expect(await findByTestId('chatbotStarterSuggestion-explore-test-0')).toHaveTextContent(
        PROVIDER_CARD_TEXT
      );
    });

    it('hands the provider the current appId, pathname, contexts and defaults', async () => {
      agentVisibleContexts = [{ description: 'Page', value: { appId: 'explore' }, label: 'Page' }];
      const getSuggestions = jest.fn().mockReturnValue([]);
      registerProvider(getSuggestions);

      render(<ChatMessages {...defaultProps} />);

      await waitFor(() => expect(getSuggestions).toHaveBeenCalled());
      expect(getSuggestions).toHaveBeenCalledWith(
        expect.objectContaining({
          appId: 'explore',
          pathname: window.location.pathname,
          contexts: agentVisibleContexts,
          defaults: expect.arrayContaining([
            expect.objectContaining({ text: 'Ask questions about your data' }),
          ]),
        })
      );
    });

    it('drops the previous app cards as soon as the app changes', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions, ['explore', 'dashboards']);

      const { findByText, queryByText } = render(<ChatMessages {...defaultProps} />);
      expect(await findByText(PROVIDER_CARD_TEXT)).toBeTruthy();

      getSuggestions.mockReturnValue(new Promise(() => {}));
      act(() => {
        currentAppId$.next('dashboards');
      });

      expect(queryByText(PROVIDER_CARD_TEXT)).toBeNull();
      expect(queryByText('Ask questions about your data')).toBeTruthy();
    });

    it('does not re-query the provider when an unrelated tool registers', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions);
      const service = AssistantActionService.getInstance();

      const { findByText } = render(<ChatMessages {...defaultProps} />);
      expect(await findByText(PROVIDER_CARD_TEXT)).toBeTruthy();
      getSuggestions.mockClear();

      act(() => {
        service.registerAction({
          name: 'unrelated_tool',
          description: 'Not gating any built-in card',
          parameters: { type: 'object', properties: {}, required: [] },
          handler: async () => ({}),
        });
      });

      await waitFor(() => expect(getSuggestions).not.toHaveBeenCalled());
      service.unregisterAction('unrelated_tool');
    });

    it('wires getDataSourceId through to the chat service, resolved lazily', async () => {
      const getSuggestions = jest.fn().mockReturnValue([]);
      registerProvider(getSuggestions);

      render(<ChatMessages {...defaultProps} />);
      await waitFor(() => expect(getSuggestions).toHaveBeenCalled());

      expect(getCurrentDataSourceId).not.toHaveBeenCalled();
      const { getDataSourceId } = getSuggestions.mock.calls[0][0];
      await expect(getDataSourceId()).resolves.toBe('ds-1');
      expect(getCurrentDataSourceId).toHaveBeenCalledTimes(1);
    });

    it('keeps showing the defaults when the provider fails', async () => {
      const getSuggestions = jest.fn().mockRejectedValue(new Error('provider blew up'));
      jest.spyOn(console, 'error').mockImplementation(() => {});
      registerProvider(getSuggestions);

      const { getByText } = render(<ChatMessages {...defaultProps} />);

      await waitFor(() => expect(getSuggestions).toHaveBeenCalled());
      expect(getByText('Ask questions about your data')).toBeTruthy();
    });

    it('recomputes when the provider calls invalidate()', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValueOnce([{ icon: 'help', text: 'First render' }])
        .mockReturnValue([{ icon: 'help', text: 'After invalidate' }]);
      const registration = registerProvider(getSuggestions);

      const { findByText } = render(<ChatMessages {...defaultProps} />);
      expect(await findByText('First render')).toBeTruthy();

      act(() => {
        registration.invalidate();
      });

      expect(await findByText('After invalidate')).toBeTruthy();
    });

    it('recomputes when the assistant contexts change', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValueOnce([{ icon: 'help', text: 'First render' }])
        .mockReturnValue([{ icon: 'help', text: 'After context change' }]);
      registerProvider(getSuggestions);

      const { findByText } = render(<ChatMessages {...defaultProps} />);
      expect(await findByText('First render')).toBeTruthy();

      agentVisibleContexts = [
        { description: 'Page', value: { dashboardId: 'next' }, label: 'Page' },
      ];
      act(() => {
        notifyContextStore();
      });

      expect(await findByText('After context change')).toBeTruthy();
    });

    it('ignores a store notification that leaves the contexts unchanged', async () => {
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions);

      const { findByText } = render(<ChatMessages {...defaultProps} />);
      expect(await findByText(PROVIDER_CARD_TEXT)).toBeTruthy();
      expect(getSuggestions).toHaveBeenCalledTimes(1);

      act(() => {
        notifyContextStore();
      });

      expect(getSuggestions).toHaveBeenCalledTimes(1);
    });

    it('re-resolves the provider when the current app changes', async () => {
      const exploreProvider = jest.fn().mockReturnValue([{ icon: 'help', text: 'Explore card' }]);
      starterSuggestionsService.registerProvider({
        id: 'explore',
        appId: 'explore',
        getSuggestions: exploreProvider,
      });
      const dashboardProvider = jest
        .fn()
        .mockReturnValue([{ icon: 'help', text: 'Dashboard card' }]);
      starterSuggestionsService.registerProvider({
        id: 'dashboards',
        appId: 'dashboards',
        getSuggestions: dashboardProvider,
      });

      const { findByText } = render(<ChatMessages {...defaultProps} />);
      expect(await findByText('Explore card')).toBeTruthy();

      act(() => {
        currentAppId$.next('dashboards');
      });

      expect(await findByText('Dashboard card')).toBeTruthy();
    });

    it('lets the newest result win when an earlier async call settles last', async () => {
      const settlers: Array<(items: Array<{ icon: string; text: string }>) => void> = [];
      const getSuggestions = jest.fn(
        () =>
          new Promise<Array<{ icon: string; text: string }>>((resolve) => {
            settlers.push(resolve);
          })
      );
      const registration = registerProvider(getSuggestions as jest.Mock);

      const { findByText, queryByText } = render(<ChatMessages {...defaultProps} />);
      await waitFor(() => expect(settlers).toHaveLength(1));

      act(() => {
        registration.invalidate();
      });
      await waitFor(() => expect(settlers).toHaveLength(2));

      await act(async () => {
        settlers[1]([{ icon: 'help', text: 'Newest result' }]);
      });
      await act(async () => {
        settlers[0]([{ icon: 'help', text: 'Stale result' }]);
      });

      expect(await findByText('Newest result')).toBeTruthy();
      expect(queryByText('Stale result')).toBeNull();
    });

    it('still resolves the provider when the context provider is unavailable', async () => {
      useOpenSearchDashboardsMock.mockReturnValue({
        services: {
          core: { application: { currentAppId$ } },
          starterSuggestions: starterSuggestionsService,
        },
      });
      const getSuggestions = jest
        .fn()
        .mockReturnValue([{ icon: 'help', text: PROVIDER_CARD_TEXT }]);
      registerProvider(getSuggestions);

      const { findByText } = render(<ChatMessages {...defaultProps} />);

      expect(await findByText(PROVIDER_CARD_TEXT)).toBeTruthy();
      expect(getSuggestions).toHaveBeenCalledTimes(1);

      act(() => {
        notifyContextStore();
      });
      expect(getSuggestions).toHaveBeenCalledTimes(1);
    });

    describe('clicking a card', () => {
      const PROMPT = 'Summarize this dashboard, using the attached screenshot.';

      const clickCard = async (
        card: Record<string, unknown>,
        props: Partial<React.ComponentProps<typeof ChatMessages>>
      ) => {
        registerProvider(jest.fn().mockReturnValue([card]));
        const { findByText } = render(<ChatMessages {...defaultProps} {...props} />);

        fireEvent.click(await findByText(card.text as string));
      };

      it('fills the prompt and asks for a screenshot for a card that wants one', async () => {
        const onFillInput = jest.fn();
        const onAttachScreenshot = jest.fn();

        await clickCard(
          {
            icon: 'help',
            text: PROVIDER_CARD_TEXT,
            prompt: PROMPT,
            attach: { captureScreenshot: true },
          },
          { onFillInput, onAttachScreenshot }
        );

        expect(onFillInput).toHaveBeenCalledWith(PROMPT);
        expect(onAttachScreenshot).toHaveBeenCalledWith(true);
      });

      it('drops any attached screenshot for a card that wants none', async () => {
        const onFillInput = jest.fn();
        const onAttachScreenshot = jest.fn();

        await clickCard(
          { icon: 'help', text: PROVIDER_CARD_TEXT, prompt: PROMPT },
          { onFillInput, onAttachScreenshot }
        );

        expect(onFillInput).toHaveBeenCalledWith(PROMPT);
        expect(onAttachScreenshot).toHaveBeenCalledWith(false);
      });

      it('still fills the prompt where this page cannot capture', async () => {
        const onFillInput = jest.fn();

        await clickCard(
          {
            icon: 'help',
            text: PROVIDER_CARD_TEXT,
            prompt: PROMPT,
            attach: { captureScreenshot: true },
          },
          { onFillInput, onAttachScreenshot: undefined }
        );

        expect(onFillInput).toHaveBeenCalledWith(PROMPT);
      });

      it("runs a card's own action on top of the prompt and the attachments", async () => {
        const action = jest.fn();
        const onFillInput = jest.fn();
        const onAttachScreenshot = jest.fn();

        await clickCard(
          {
            icon: 'help',
            text: PROVIDER_CARD_TEXT,
            prompt: PROMPT,
            action,
            attach: { captureScreenshot: true },
          },
          { onFillInput, onAttachScreenshot }
        );

        expect(onFillInput).toHaveBeenCalledWith(PROMPT);
        expect(onAttachScreenshot).toHaveBeenCalledWith(true);
        expect(action).toHaveBeenCalledTimes(1);
      });

      it('runs an action-only card without touching the input', async () => {
        const action = jest.fn();
        const onFillInput = jest.fn();

        await clickCard({ icon: 'help', text: PROVIDER_CARD_TEXT, action }, { onFillInput });

        expect(action).toHaveBeenCalledTimes(1);
        expect(onFillInput).not.toHaveBeenCalled();
      });
    });
  });

  describe('smart scroll functionality', () => {
    // Mock scrollIntoView
    beforeEach(() => {
      Element.prototype.scrollIntoView = jest.fn();
    });

    it('should auto-scroll when new messages arrive', () => {
      const { rerender } = render(<ChatMessages {...defaultProps} timeline={[]} />);

      const newTimeline: Message[] = [{ id: '1', role: 'user', content: 'New message' }];

      rerender(<ChatMessages {...defaultProps} timeline={newTimeline} />);

      // scrollIntoView should be called for auto-scroll
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('should call scrollIntoView with smooth behavior', () => {
      const { rerender } = render(<ChatMessages {...defaultProps} timeline={[]} />);

      const newTimeline: Message[] = [{ id: '1', role: 'user', content: 'New message' }];

      rerender(<ChatMessages {...defaultProps} timeline={newTimeline} />);

      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('should handle multiple message updates', () => {
      const { rerender } = render(<ChatMessages {...defaultProps} timeline={[]} />);

      const timeline1: Message[] = [{ id: '1', role: 'user', content: 'Message 1' }];
      rerender(<ChatMessages {...defaultProps} timeline={timeline1} />);

      const timeline2: Message[] = [
        ...timeline1,
        { id: '2', role: 'assistant', content: 'Response 1' },
      ];
      rerender(<ChatMessages {...defaultProps} timeline={timeline2} />);

      // Should be called at least twice (may be called more due to React rendering)
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });

    it('should have scroll container with proper ref', () => {
      const { container } = render(<ChatMessages {...defaultProps} />);

      const messagesContainer = container.querySelector('.chatMessages');
      expect(messagesContainer).toBeTruthy();
    });
  });

  describe('message types', () => {
    it('should render user messages', () => {
      const timeline: Message[] = [{ id: '1', role: 'user', content: 'User message' }];

      const { getByText } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getByText('User message')).toBeTruthy();
    });

    it('should render assistant messages', () => {
      const timeline: Message[] = [{ id: '1', role: 'assistant', content: 'Assistant message' }];

      const { getByText } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getByText('Assistant message')).toBeTruthy();
    });

    it('should render assistant messages with array content', () => {
      const timeline: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: [
            { type: 'text', text: 'First part' },
            { type: 'text', text: 'Second part' },
          ],
        } as unknown as AssistantMessage, // Force type casting for the corner case.
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const messageRows = getAllByTestId('message-row');
      expect(messageRows).toHaveLength(2);
      expect(messageRows[0].textContent).toBe('First part');
      expect(messageRows[1].textContent).toBe('Second part');
    });

    it('should filter out empty text content from array assistant messages', () => {
      const timeline: Message[] = [
        // @ts-expect-error TS2352 TODO(ts-error): fixme
        {
          id: '1',
          role: 'assistant',
          content: [
            { type: 'text', text: 'Valid content' },
            { type: 'text', text: '' },
            { type: 'text', text: '   ' },
            { type: 'text', text: 'Another valid' },
          ],
        } as AssistantMessage,
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const messageRows = getAllByTestId('message-row');
      expect(messageRows).toHaveLength(2);
      expect(messageRows[0].textContent).toBe('Valid content');
      expect(messageRows[1].textContent).toBe('Another valid');
    });

    it('should not render assistant message with empty string content', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: '   ' },
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      // Only user message should be rendered
      expect(getAllByTestId('message-row')).toHaveLength(1);
    });

    it('should not render assistant message with null/undefined content', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: undefined } as unknown as AssistantMessage,
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      // Only user message should be rendered
      expect(getAllByTestId('message-row')).toHaveLength(1);
    });

    it('should handle assistant message with empty array content', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: [] } as unknown as AssistantMessage,
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      // Only user message should be rendered
      expect(getAllByTestId('message-row')).toHaveLength(1);
    });

    it('should filter out array content with null/undefined text', () => {
      const timeline: Message[] = [
        // @ts-expect-error TS2352 TODO(ts-error): fixme
        {
          id: '1',
          role: 'assistant',
          content: [
            { type: 'text', text: 'Valid' },
            { type: 'text', text: null } as any,
            { type: 'text', text: undefined } as any,
          ],
        } as AssistantMessage,
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getAllByTestId('message-row')).toHaveLength(1);
    });

    it('should render system messages as errors', () => {
      const timeline: Message[] = [{ id: '1', role: 'system', content: 'Error message' }];

      const { getByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getByTestId('error-row')).toBeTruthy();
    });

    it('should not render tool messages separately', () => {
      const timeline: Message[] = [
        { id: '1', role: 'tool', content: 'Tool result', toolCallId: 'tool-1' },
      ];

      const { queryByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      // Tool messages should not render as separate rows
      expect(queryByTestId('message-row')).toBeNull();
    });

    it('should render loading message when streaming without startResponse', () => {
      const timeline: Message[] = [{ id: '1', role: 'user', content: 'Hello' }];

      const { getByText } = render(
        <ChatMessages
          {...defaultProps}
          timeline={timeline}
          isStreaming={true}
          startResponse={false}
        />
      );

      expect(getByText('Thinking...')).toBeTruthy();
    });

    it('should not render loading message when startResponse is true', () => {
      const timeline: Message[] = [{ id: '1', role: 'user', content: 'Hello' }];

      const { queryByText } = render(
        <ChatMessages
          {...defaultProps}
          timeline={timeline}
          isStreaming={true}
          startResponse={true}
        />
      );

      expect(queryByText('Thinking...')).toBeNull();
    });
  });

  describe('tool calls', () => {
    it('should render tool calls from assistant messages', () => {
      const timeline: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Using a tool',
          toolCalls: [
            {
              id: 'tool-1',
              type: 'function',
              function: { name: 'search', arguments: '{"query": "test"}' },
            },
          ],
        },
      ];

      const { getByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      expect(getByTestId('tool-call-row')).toBeTruthy();
    });

    it('should match tool results with tool calls', () => {
      const timeline: Message[] = [
        {
          id: '1',
          role: 'assistant',
          content: 'Using a tool',
          toolCalls: [
            {
              id: 'tool-1',
              type: 'function',
              function: { name: 'search', arguments: '{"query": "test"}' },
            },
          ],
        },
        {
          id: '2',
          role: 'tool',
          content: 'Tool result',
          toolCallId: 'tool-1',
        },
      ];

      const { getByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      // Tool call should be rendered with its result
      expect(getByTestId('tool-call-row')).toBeTruthy();
    });
  });

  describe('suggestions', () => {
    it('should show suggestions after last assistant message when not streaming', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'Question' },
        { id: '2', role: 'assistant', content: 'Answer' },
      ];

      const { getByTestId } = render(
        <ChatMessages {...defaultProps} timeline={timeline} isStreaming={false} />
      );

      expect(getByTestId('chat-suggestions')).toBeTruthy();
    });

    it('should not show suggestions when streaming', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'Question' },
        { id: '2', role: 'assistant', content: 'Answer' },
      ];

      const { queryByTestId } = render(
        <ChatMessages {...defaultProps} timeline={timeline} isStreaming={true} />
      );

      expect(queryByTestId('chat-suggestions')).toBeNull();
    });

    it('should not show suggestions when last message is from user', () => {
      const timeline: Message[] = [
        { id: '1', role: 'assistant', content: 'Answer' },
        { id: '2', role: 'user', content: 'Question' },
      ];

      const { queryByTestId } = render(
        <ChatMessages {...defaultProps} timeline={timeline} isStreaming={false} />
      );

      expect(queryByTestId('chat-suggestions')).toBeNull();
    });

    it('should not show suggestions when timeline is empty', () => {
      const { queryByTestId } = render(
        <ChatMessages {...defaultProps} timeline={[]} isStreaming={false} />
      );

      expect(queryByTestId('chat-suggestions')).toBeNull();
    });
  });

  describe('event handlers', () => {
    it('should call onResendMessage when message is resent', () => {
      const onResendMessage = jest.fn();
      const timeline: Message[] = [{ id: '1', role: 'user', content: 'Message' }];

      render(
        <ChatMessages {...defaultProps} timeline={timeline} onResendMessage={onResendMessage} />
      );

      // The actual resend trigger would be in MessageRow component
      // This test verifies the prop is passed correctly
      expect(onResendMessage).not.toHaveBeenCalled();
    });
  });

  describe('scroll event cleanup', () => {
    it('should properly manage scroll container lifecycle', () => {
      const { container, unmount } = render(<ChatMessages {...defaultProps} />);

      const messagesContainer = container.querySelector('.chatMessages');
      expect(messagesContainer).toBeTruthy();

      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('accessibility', () => {
    it('should have messages container with proper structure', () => {
      const { container } = render(<ChatMessages {...defaultProps} />);

      const messagesContainer = container.querySelector('.chatMessages');
      expect(messagesContainer).toBeTruthy();
    });

    it('should render messages in accessible order', () => {
      const timeline: Message[] = [
        { id: '1', role: 'user', content: 'First' },
        { id: '2', role: 'assistant', content: 'Second' },
      ];

      const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

      const messages = getAllByTestId('message-row');
      expect(messages).toHaveLength(2);
      expect(messages[0].textContent).toBe('First');
      expect(messages[1].textContent).toBe('Second');
    });
  });
});

describe('convertTimelineToMessageRows', () => {
  // Rows are keyed by tool call id and each row renders the tool's card, so a tool call referenced
  // by several messages must still yield a single row.
  it('emits one row per tool call even when several messages carry the same tool call', () => {
    const toolCall = {
      id: 'tooluse_iAFNqCSCNIniFcsnxrbbGf',
      type: 'function' as const,
      function: { name: 'ask_user', arguments: '{"prompt":"What?"}' },
    };
    const timeline: Message[] = [
      { id: '0', role: 'user', content: 'ask me something' } as UserMessage,
      { id: '1', role: 'assistant', toolCalls: [toolCall] } as AssistantMessage,
      {
        id: 'fake-assistant-message-123',
        role: 'assistant',
        toolCalls: [toolCall],
      } as AssistantMessage,
    ];

    const rows = convertTimelineToMessageRows(timeline);
    const toolCallRows = rows.filter((r: any) => r.role === 'toolCall');
    const grouped = rows
      .filter((r: any) => r.role === 'toolCallGroup')
      .flatMap((r: any) => r.toolCalls);

    expect([
      ...toolCallRows.map((r: any) => r.toolCall.id),
      ...grouped.map((t: any) => t.id),
    ]).toEqual([toolCall.id]);
  });

  it('should handle empty timeline and simple messages without tool calls', () => {
    // Empty timeline
    expect(convertTimelineToMessageRows([])).toEqual([]);

    // Simple user and assistant messages
    const timeline: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Hello' } as UserMessage,
      { id: 'msg-2', role: 'assistant', content: 'Hi there!' } as AssistantMessage,
    ];

    const result = convertTimelineToMessageRows(timeline);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(timeline[0]);
    expect(result[1]).toEqual(timeline[1]);
  });

  it('should group completed tool calls from consecutive assistant messages', () => {
    const timeline: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Do tasks' } as UserMessage,
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Starting',
        toolCalls: [
          {
            id: 'tool-1',
            type: 'function',
            function: { name: 'task1', arguments: '{}' },
          },
        ],
      } as AssistantMessage,
      { id: 'tool-result-1', role: 'tool', content: 'Done 1', toolCallId: 'tool-1' } as ToolMessage,
      {
        id: 'msg-3',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tool-2',
            type: 'function',
            function: { name: 'task2', arguments: '{}' },
          },
          {
            id: 'tool-3',
            type: 'function',
            function: { name: 'task3', arguments: '{}' },
          },
        ],
      } as AssistantMessage,
      { id: 'tool-result-2', role: 'tool', content: 'Done 2', toolCallId: 'tool-2' } as ToolMessage,
      { id: 'tool-result-3', role: 'tool', content: 'Done 3', toolCallId: 'tool-3' } as ToolMessage,
      { id: 'msg-4', role: 'assistant', content: 'All complete' } as AssistantMessage,
    ];

    const result = convertTimelineToMessageRows(timeline);

    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ role: 'user' });
    expect(result[1]).toMatchObject({ role: 'assistant', id: 'msg-2' });

    // All three tool calls grouped together
    expect(result[2]).toMatchObject({ role: 'toolCallGroup' });
    const toolCallGroup = result[2] as { role: 'toolCallGroup'; toolCalls: any[] };
    expect(toolCallGroup.toolCalls).toHaveLength(3);
    expect(toolCallGroup.toolCalls[0]).toMatchObject({
      id: 'tool-1',
      toolName: 'task1',
      status: 'completed',
      result: 'Done 1',
    });
    expect(toolCallGroup.toolCalls[1]).toMatchObject({
      id: 'tool-2',
      toolName: 'task2',
      status: 'completed',
    });
    expect(toolCallGroup.toolCalls[2]).toMatchObject({
      id: 'tool-3',
      toolName: 'task3',
      status: 'completed',
    });

    expect(result[3]).toMatchObject({ role: 'assistant', id: 'msg-4' });
  });

  it('should display running tool calls individually without grouping', () => {
    const timeline: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Search' } as UserMessage,
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Searching...',
        toolCalls: [
          {
            id: 'tool-1',
            type: 'function',
            function: { name: 'search', arguments: '{"query": "test"}' },
          },
        ],
      } as AssistantMessage,
      // No tool result - tool is running (tracked via toolCallStates)
      { id: 'msg-3', role: 'assistant', content: 'Processing continues' } as AssistantMessage,
    ];

    const toolCallStates = new Map<string, ToolCallState>([
      ['tool-1', { id: 'tool-1', name: 'search', status: 'executing', timestamp: Date.now() }],
    ]);

    const result = convertTimelineToMessageRows(timeline, toolCallStates);

    // Should continue processing and show all messages
    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ role: 'user' });
    expect(result[1]).toMatchObject({ role: 'assistant', id: 'msg-2' });

    // Running tool shown individually
    expect(result[2]).toMatchObject({ role: 'toolCall' });
    const toolCallRow = result[2] as { role: 'toolCall'; toolCall: any };
    expect(toolCallRow.toolCall).toMatchObject({
      id: 'tool-1',
      toolName: 'search',
      status: 'running',
    });

    // Subsequent message is included
    expect(result[3]).toMatchObject({ role: 'assistant', id: 'msg-3' });
  });

  it('should not group tool calls when batch is incomplete (no closing message)', () => {
    const timeline: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Do tasks' } as UserMessage,
      {
        id: 'msg-2',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tool-1',
            type: 'function',
            function: { name: 'task1', arguments: '{}' },
          },
        ],
      } as AssistantMessage,
      { id: 'tool-result-1', role: 'tool', content: 'Done 1', toolCallId: 'tool-1' } as ToolMessage,
      {
        id: 'msg-3',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tool-2',
            type: 'function',
            function: { name: 'task2', arguments: '{}' },
          },
        ],
      } as AssistantMessage,
      { id: 'tool-result-2', role: 'tool', content: 'Done 2', toolCallId: 'tool-2' } as ToolMessage,
      // No closing assistant message with content - batch incomplete
    ];

    const result = convertTimelineToMessageRows(timeline);

    // Should not group - display individually since batch is incomplete, continue processing
    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({ role: 'user' });
    expect(result[1]).toMatchObject({ role: 'assistant', id: 'msg-2' });
    expect(result[2]).toMatchObject({ role: 'toolCall' });

    const toolCallRow1 = result[2] as { role: 'toolCall'; toolCall: any };
    expect(toolCallRow1.toolCall).toMatchObject({
      id: 'tool-1',
      toolName: 'task1',
      status: 'completed',
    });

    // Continue processing - next assistant message and its tool call
    expect(result[3]).toMatchObject({ role: 'assistant', id: 'msg-3' });
    expect(result[4]).toMatchObject({ role: 'toolCall' });

    const toolCallRow2 = result[4] as { role: 'toolCall'; toolCall: any };
    expect(toolCallRow2.toolCall).toMatchObject({
      id: 'tool-2',
      toolName: 'task2',
      status: 'completed',
    });
  });

  it('should not group when continuation messages have running tools', () => {
    const timeline: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Do tasks' } as UserMessage,
      {
        id: 'msg-2',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tool-1',
            type: 'function',
            function: { name: 'task1', arguments: '{}' },
          },
        ],
      } as AssistantMessage,
      { id: 'tool-result-1', role: 'tool', content: 'Done 1', toolCallId: 'tool-1' } as ToolMessage,
      {
        id: 'msg-3',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tool-2',
            type: 'function',
            function: { name: 'task2', arguments: '{}' },
          },
        ],
      } as AssistantMessage,
      // No result for tool-2 - it's running (tracked via toolCallStates)
      { id: 'msg-4', role: 'assistant', content: 'Still processing' } as AssistantMessage,
    ];

    const toolCallStates = new Map<string, ToolCallState>([
      ['tool-2', { id: 'tool-2', name: 'task2', status: 'executing', timestamp: Date.now() }],
    ]);

    const result = convertTimelineToMessageRows(timeline, toolCallStates);

    // Should not group when continuation has running tools, continue processing
    expect(result).toHaveLength(6);
    expect(result[0]).toMatchObject({ role: 'user' });
    expect(result[1]).toMatchObject({ role: 'assistant', id: 'msg-2' });
    expect(result[2]).toMatchObject({ role: 'toolCall' });

    const toolCallRow1 = result[2] as { role: 'toolCall'; toolCall: any };
    expect(toolCallRow1.toolCall).toMatchObject({
      id: 'tool-1',
      toolName: 'task1',
      status: 'completed',
    });

    // Continue processing - next assistant message with running tool
    expect(result[3]).toMatchObject({ role: 'assistant', id: 'msg-3' });
    expect(result[4]).toMatchObject({ role: 'toolCall' });

    const toolCallRow2 = result[4] as { role: 'toolCall'; toolCall: any };
    expect(toolCallRow2.toolCall).toMatchObject({
      id: 'tool-2',
      toolName: 'task2',
      status: 'running',
    });

    // Subsequent message is included
    expect(result[5]).toMatchObject({ role: 'assistant', id: 'msg-4' });
  });

  it('should treat historical tool calls with no result and no state as errors', () => {
    // Snapshot-loaded conversation where the tool call never produced a
    // ToolMessage and has no event-driven state — it was abandoned, not
    // still running.
    const timeline: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Search' } as UserMessage,
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Searching...',
        toolCalls: [
          {
            id: 'tool-1',
            type: 'function',
            function: { name: 'search', arguments: '{}' },
          },
        ],
      } as AssistantMessage,
    ];

    const result = convertTimelineToMessageRows(timeline);

    expect(result).toHaveLength(3);
    expect(result[2]).toMatchObject({ role: 'toolCall' });
    const toolCallRow = result[2] as { role: 'toolCall'; toolCall: any };
    expect(toolCallRow.toolCall).toMatchObject({
      id: 'tool-1',
      toolName: 'search',
      status: 'error',
    });
  });

  it('should preserve error status for failed tool calls', () => {
    const timeline: Message[] = [
      { id: 'msg-1', role: 'user', content: 'Do something' } as UserMessage,
      {
        id: 'msg-2',
        role: 'assistant',
        toolCalls: [
          {
            id: 'tool-1',
            type: 'function',
            function: { name: 'failing_tool', arguments: '{}' },
          },
        ],
      } as AssistantMessage,
      {
        id: 'tool-result-1',
        role: 'tool',
        content: `${TOOL_EXECUTION_ERROR_PREFIX}Tool execution failed`,
        toolCallId: 'tool-1',
      } as ToolMessage,
      { id: 'msg-3', role: 'assistant', content: 'Sorry, error' } as AssistantMessage,
    ];

    const result = convertTimelineToMessageRows(timeline);

    expect(result).toHaveLength(4);
    const toolCallGroup = result[2] as { role: 'toolCallGroup'; toolCalls: any[] };
    expect(toolCallGroup.toolCalls[0]).toMatchObject({
      id: 'tool-1',
      status: 'error',
      result: `${TOOL_EXECUTION_ERROR_PREFIX}Tool execution failed`,
    });
  });
});

describe('share button visibility', () => {
  const defaultProps = {
    layoutMode: ChatLayoutMode.SIDECAR,
    timeline: [] as Message[],
    isStreaming: false,
    threadId: 'thread-1',
  };

  it('should pass timeline to the last assistant message in a turn (share enabled)', () => {
    const timeline: Message[] = [
      { id: '1', role: 'user', content: 'Question' } as UserMessage,
      { id: '2', role: 'assistant', content: 'Answer' } as AssistantMessage,
    ];

    const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

    const messageRows = getAllByTestId('message-row');
    const assistantRow = messageRows.find((el) => el.textContent === 'Answer');
    expect(assistantRow?.getAttribute('data-has-timeline')).toBe('true');
  });

  it('should not pass timeline to intermediate assistant messages in a turn', () => {
    const timeline: Message[] = [
      { id: '1', role: 'user', content: 'Question' } as UserMessage,
      { id: '2', role: 'assistant', content: 'Let me check...' } as AssistantMessage,
      { id: '3', role: 'assistant', content: 'Final answer' } as AssistantMessage,
    ];

    const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

    const messageRows = getAllByTestId('message-row');
    const intermediateRow = messageRows.find((el) => el.textContent === 'Let me check...');
    const finalRow = messageRows.find((el) => el.textContent === 'Final answer');
    expect(intermediateRow?.getAttribute('data-has-timeline')).toBe('false');
    expect(finalRow?.getAttribute('data-has-timeline')).toBe('true');
  });

  it('should not pass timeline when streaming (share disabled)', () => {
    const timeline: Message[] = [
      { id: '1', role: 'user', content: 'Question' } as UserMessage,
      { id: '2', role: 'assistant', content: 'Streaming response...' } as AssistantMessage,
    ];

    const { getAllByTestId } = render(
      <ChatMessages {...defaultProps} timeline={timeline} isStreaming={true} />
    );

    const messageRows = getAllByTestId('message-row');
    const assistantRow = messageRows.find((el) => el.textContent === 'Streaming response...');
    expect(assistantRow?.getAttribute('data-has-timeline')).toBe('false');
  });

  it('should not pass timeline to any assistant message when streaming', () => {
    const timeline: Message[] = [
      { id: '1', role: 'user', content: 'First question' } as UserMessage,
      { id: '2', role: 'assistant', content: 'First answer' } as AssistantMessage,
      { id: '3', role: 'user', content: 'Second question' } as UserMessage,
      { id: '4', role: 'assistant', content: 'Still streaming...' } as AssistantMessage,
    ];

    const { getAllByTestId } = render(
      <ChatMessages {...defaultProps} timeline={timeline} isStreaming={true} />
    );

    const messageRows = getAllByTestId('message-row');
    const firstAnswer = messageRows.find((el) => el.textContent === 'First answer');
    const streamingAnswer = messageRows.find((el) => el.textContent === 'Still streaming...');
    // All share buttons disabled while any response is streaming
    expect(firstAnswer?.getAttribute('data-has-timeline')).toBe('false');
    expect(streamingAnswer?.getAttribute('data-has-timeline')).toBe('false');
  });
});

describe('share button with running tool calls', () => {
  const defaultProps = {
    layoutMode: ChatLayoutMode.SIDECAR,
    timeline: [] as Message[],
    isStreaming: false,
    threadId: 'thread-1',
  };

  afterEach(() => {
    // The AssistantActionService is a process-wide singleton, so stray
    // toolCallStates from one test can bleed into the next. Drain it after
    // every test so each case starts from a clean map.
    const service = AssistantActionService.getInstance();
    const ids = Array.from(service.getCurrentState().toolCallStates.keys());
    ids.forEach((id) => service.clearToolCallState(id));
  });

  it('should not pass timeline when tool calls are still running', () => {
    // Simulate a turn where the assistant has text content but a tool call is
    // still executing (tracked in the event-driven toolCallStates).
    const service = AssistantActionService.getInstance();
    service.updateToolCallState('tc1', {
      id: 'tc1',
      name: 'SearchTool',
      status: 'executing',
      timestamp: Date.now(),
    });

    const timeline: Message[] = [
      { id: '1', role: 'user', content: 'Question' } as UserMessage,
      {
        id: '2',
        role: 'assistant',
        content: 'Let me look into that...',
        toolCalls: [
          { id: 'tc1', type: 'function', function: { name: 'SearchTool', arguments: '{}' } },
        ],
      } as AssistantMessage,
      // No ToolMessage for tc1 — tool is still running per toolCallStates
    ];

    const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

    const messageRows = getAllByTestId('message-row');
    const assistantRow = messageRows.find((el) =>
      el.textContent?.includes('Let me look into that')
    );
    expect(assistantRow?.getAttribute('data-has-timeline')).toBe('false');
  });

  it('should pass timeline when all tool calls have completed', () => {
    const timeline: Message[] = [
      { id: '1', role: 'user', content: 'Question' } as UserMessage,
      {
        id: '2',
        role: 'assistant',
        content: '',
        toolCalls: [
          { id: 'tc1', type: 'function', function: { name: 'SearchTool', arguments: '{}' } },
        ],
      } as AssistantMessage,
      { id: '3', role: 'tool', content: 'Results', toolCallId: 'tc1' } as ToolMessage,
      { id: '4', role: 'assistant', content: 'Here is the answer' } as AssistantMessage,
    ];

    const { getAllByTestId } = render(<ChatMessages {...defaultProps} timeline={timeline} />);

    const messageRows = getAllByTestId('message-row');
    const finalRow = messageRows.find((el) => el.textContent === 'Here is the answer');
    expect(finalRow?.getAttribute('data-has-timeline')).toBe('true');
  });
});
