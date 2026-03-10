/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';
import { ChatMountService } from './chat_mount_service';
import { ChatService } from './chat_service';
import { SuggestedActionsService } from './suggested_action';
import { ConfirmationService } from './confirmation_service';
import { SIDECAR_DOCKED_MODE } from '../../../../core/public';

// Mock React and react-dom
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn(),
  })),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('ChatMountService', () => {
  let chatMountService: ChatMountService;
  let mockCore: any;
  let mockChatService: any;
  let mockSuggestedActionsService: SuggestedActionsService;
  let mockConfirmationService: ConfirmationService;
  let mockChromeVisible$: BehaviorSubject<boolean>;
  let mockSidecarRef: any;
  let onWindowOpenCallback: Function;
  let onWindowCloseCallback: Function;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock chrome visibility observable
    mockChromeVisible$ = new BehaviorSubject<boolean>(true);

    // Mock sidecar reference
    mockSidecarRef = {
      close: jest.fn(),
    };

    // Mock core services
    mockCore = {
      chrome: {
        getIsVisible$: jest.fn(() => mockChromeVisible$),
      },
      overlays: {
        sidecar: {
          open: jest.fn(() => mockSidecarRef),
          show: jest.fn(),
          hide: jest.fn(),
        },
      },
      chat: {
        onWindowOpen: jest.fn((callback: Function) => {
          onWindowOpenCallback = callback;
          return jest.fn(); // Return unsubscribe function
        }),
        onWindowClose: jest.fn((callback: Function) => {
          onWindowCloseCallback = callback;
          return jest.fn(); // Return unsubscribe function
        }),
      },
    };

    // Mock chat service
    mockChatService = ({
      getPaddingSize: jest.fn(() => 400),
    } as unknown) as ChatService;

    // Mock suggested actions service
    mockSuggestedActionsService = {} as SuggestedActionsService;

    // Mock confirmation service
    mockConfirmationService = {} as ConfirmationService;

    chatMountService = new ChatMountService();
  });

  afterEach(() => {
    chatMountService.stop();
  });

  describe('start', () => {
    it('should return start contract with open, close, and toggleOpen methods', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      expect(contract).toEqual({
        open: expect.any(Function),
        close: expect.any(Function),
        toggleOpen: expect.any(Function),
      });
    });

    it('should register window open and close callbacks', () => {
      chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      expect(mockCore.chat.onWindowOpen).toHaveBeenCalledWith(expect.any(Function));
      expect(mockCore.chat.onWindowClose).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should subscribe to chrome visibility changes', () => {
      chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      expect(mockCore.chrome.getIsVisible$).toHaveBeenCalled();
    });
  });

  describe('open', () => {
    it('should open sidecar when open is called', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      contract.open();

      expect(mockCore.overlays.sidecar.open).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          className: 'chat-sidecar chat-sidecar--sidecar',
          config: {
            dockedMode: SIDECAR_DOCKED_MODE.RIGHT,
            paddingSize: 400,
            isHidden: false, // Chrome is visible by default
          },
        })
      );
    });

    it('should open sidecar with isHidden=true when chrome is not visible', () => {
      // Set chrome to not visible before starting
      mockChromeVisible$.next(false);

      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      contract.open();

      expect(mockCore.overlays.sidecar.open).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          config: expect.objectContaining({
            isHidden: true, // Chrome is not visible
          }),
        })
      );
    });

    it('should not open sidecar if already open', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      contract.open();
      expect(mockCore.overlays.sidecar.open).toHaveBeenCalledTimes(1);

      // Try to open again
      contract.open();
      expect(mockCore.overlays.sidecar.open).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should open sidecar when onWindowOpen callback is triggered', () => {
      chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      // Trigger the window open callback
      onWindowOpenCallback();

      expect(mockCore.overlays.sidecar.open).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should close sidecar when close is called', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      contract.open();
      contract.close();

      expect(mockSidecarRef.close).toHaveBeenCalled();
    });

    it('should not throw if close is called when sidecar is not open', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      expect(() => contract.close()).not.toThrow();
    });

    it('should close sidecar when onWindowClose callback is triggered', () => {
      chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      // Open the sidecar first
      onWindowOpenCallback();

      // Trigger the window close callback
      onWindowCloseCallback();

      expect(mockSidecarRef.close).toHaveBeenCalled();
    });
  });

  describe('toggleOpen', () => {
    it('should open sidecar when closed', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      contract.toggleOpen();

      expect(mockCore.overlays.sidecar.open).toHaveBeenCalled();
    });

    it('should close sidecar when open', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      contract.open();
      contract.toggleOpen();

      expect(mockSidecarRef.close).toHaveBeenCalled();
    });
  });

  describe('chrome visibility integration', () => {
    it('should track chrome visibility state', () => {
      chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      // Initially chrome is visible (default)
      expect(mockChromeVisible$.value).toBe(true);

      // Change chrome visibility
      mockChromeVisible$.next(false);
      expect(mockChromeVisible$.value).toBe(false);
    });

    it('should hide sidecar when chrome becomes invisible', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      // Open the sidecar
      contract.open();

      // Clear previous calls
      jest.clearAllMocks();

      // Make chrome invisible
      mockChromeVisible$.next(false);

      // Sidecar should be hidden
      expect(mockCore.overlays.sidecar.hide).toHaveBeenCalled();
      expect(mockCore.overlays.sidecar.show).not.toHaveBeenCalled();
    });

    it('should show sidecar when chrome becomes visible', () => {
      // Start with chrome invisible
      mockChromeVisible$.next(false);

      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      // Open the sidecar (it will be hidden initially)
      contract.open();

      // Clear previous calls
      jest.clearAllMocks();

      // Make chrome visible
      mockChromeVisible$.next(true);

      // Sidecar should be shown
      expect(mockCore.overlays.sidecar.show).toHaveBeenCalled();
      expect(mockCore.overlays.sidecar.hide).not.toHaveBeenCalled();
    });

    it('should not call show/hide when sidecar is not open', () => {
      chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      // Don't open the sidecar

      // Change chrome visibility
      mockChromeVisible$.next(false);
      mockChromeVisible$.next(true);

      // show/hide should not be called since sidecar is not open
      expect(mockCore.overlays.sidecar.show).not.toHaveBeenCalled();
      expect(mockCore.overlays.sidecar.hide).not.toHaveBeenCalled();
    });

    it('should prevent flash by opening with correct initial visibility', () => {
      // Set chrome to invisible before starting
      mockChromeVisible$.next(false);

      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      // Open the sidecar
      contract.open();

      // Verify sidecar was opened with isHidden=true (no flash)
      expect(mockCore.overlays.sidecar.open).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          config: expect.objectContaining({
            isHidden: true,
          }),
        })
      );

      // Verify hide was not called separately (would cause flash)
      expect(mockCore.overlays.sidecar.hide).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('should close sidecar on stop', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      contract.open();

      chatMountService.stop();

      expect(mockSidecarRef.close).toHaveBeenCalled();
    });

    it('should unsubscribe from chrome visibility on stop', () => {
      chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      chatMountService.stop();

      // After stop, changing chrome visibility should not trigger show/hide
      // because the subscription has been cleaned up
      jest.clearAllMocks();
      mockChromeVisible$.next(false);
      mockChromeVisible$.next(true);

      // show/hide should not be called since subscription was unsubscribed
      expect(mockCore.overlays.sidecar.show).not.toHaveBeenCalled();
      expect(mockCore.overlays.sidecar.hide).not.toHaveBeenCalled();
    });

    it('should call unsubscribe functions for window callbacks', () => {
      const unsubscribeWindowOpen = jest.fn();
      const unsubscribeWindowClose = jest.fn();

      mockCore.chat.onWindowOpen = jest.fn(() => unsubscribeWindowOpen);
      mockCore.chat.onWindowClose = jest.fn(() => unsubscribeWindowClose);

      chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      chatMountService.stop();

      expect(unsubscribeWindowOpen).toHaveBeenCalled();
      expect(unsubscribeWindowClose).toHaveBeenCalled();
    });

    it('should not throw if stop is called multiple times', () => {
      chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      expect(() => {
        chatMountService.stop();
        chatMountService.stop();
      }).not.toThrow();
    });
  });

  describe('mount point', () => {
    it('should create mount point with correct props', () => {
      const contract = chatMountService.start({
        core: mockCore,
        chatService: mockChatService,
        contextProvider: {} as any,
        charts: {} as any,
        suggestedActionsService: mockSuggestedActionsService,
        confirmationService: mockConfirmationService,
      });

      contract.open();

      // Verify sidecar.open was called with a mount function
      expect(mockCore.overlays.sidecar.open).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Object)
      );

      // Get the mount function
      const mountFunction = mockCore.overlays.sidecar.open.mock.calls[0][0];

      // Call the mount function with a mock element
      const mockElement = document.createElement('div');
      const unmount = mountFunction(mockElement);

      // Verify unmount function is returned
      expect(unmount).toEqual(expect.any(Function));
    });
  });
});
