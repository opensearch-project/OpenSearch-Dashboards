# State Management Design Document

## Overview
This document outlines the Redux-based state management architecture for the chatbot functionality, following the pattern established by vis_builder plugin.

## Redux Store Structure

### Store Configuration
Following the vis_builder pattern with `@reduxjs/toolkit`:

```typescript
// public/chatbot/store/index.ts
import { combineReducers, configureStore, PreloadedState } from '@reduxjs/toolkit';
import { chatReducer } from './slices/chat_slice';
import { conversationReducer } from './slices/conversation_slice';
import { contextReducer } from './slices/context_slice';
import { uiReducer } from './slices/ui_slice';

const chatbotRootReducer = combineReducers({
  chat: chatReducer,
  conversations: conversationReducer,
  context: contextReducer,
  ui: uiReducer,
});

export const configureChatbotStore = (preloadedState?: PreloadedState<ChatbotRootState>) => {
  return configureStore({
    reducer: chatbotRootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types
          ignoredActions: ['chat/streamUpdate'],
        },
      }),
  });
};

export type ChatbotRootState = ReturnType<typeof chatbotRootReducer>;
export type ChatbotStore = ReturnType<typeof configureChatbotStore>;
export type ChatbotDispatch = ChatbotStore['dispatch'];
```

## State Slices

### Chat Slice
Manages active chat messages and streaming state:

```typescript
// public/chatbot/store/slices/chat_slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
  messages: Record<string, Message[]>; // Keyed by conversationId
  streamingMessage: StreamingMessage | null;
  sendingMessage: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: {},
  streamingMessage: null,
  sendingMessage: false,
  error: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },
    
    startStreaming: (state, action: PayloadAction<{ conversationId: string; messageId: string }>) => {
      state.streamingMessage = {
        conversationId: action.payload.conversationId,
        messageId: action.payload.messageId,
        content: '',
      };
    },
    
    updateStreaming: (state, action: PayloadAction<{ content: string }>) => {
      if (state.streamingMessage) {
        state.streamingMessage.content += action.payload.content;
        
        // Update the actual message in the messages array
        const messages = state.messages[state.streamingMessage.conversationId];
        if (messages) {
          const message = messages.find(m => m.id === state.streamingMessage!.messageId);
          if (message) {
            message.content = state.streamingMessage.content;
          }
        }
      }
    },
    
    endStreaming: (state) => {
      state.streamingMessage = null;
    },
    
    setSendingMessage: (state, action: PayloadAction<boolean>) => {
      state.sendingMessage = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { 
  addMessage, 
  startStreaming, 
  updateStreaming, 
  endStreaming,
  setSendingMessage,
  setError 
} = chatSlice.actions;

export const chatReducer = chatSlice.reducer;
```

### Conversation Slice
Manages conversation list and metadata:

```typescript
// public/chatbot/store/slices/conversation_slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  loading: boolean;
}

const initialState: ConversationState = {
  conversations: [],
  currentConversationId: null,
  loading: false,
};

export const conversationSlice = createSlice({
  name: 'conversations',
  initialState,
  reducers: {
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    
    addConversation: (state, action: PayloadAction<Conversation>) => {
      state.conversations.unshift(action.payload);
    },
    
    updateConversation: (state, action: PayloadAction<Partial<Conversation> & { id: string }>) => {
      const index = state.conversations.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = {
          ...state.conversations[index],
          ...action.payload,
        };
      }
    },
    
    deleteConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      
      if (state.currentConversationId === action.payload) {
        state.currentConversationId = state.conversations[0]?.id || null;
      }
    },
    
    setCurrentConversation: (state, action: PayloadAction<string>) => {
      state.currentConversationId = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setConversations,
  addConversation,
  updateConversation,
  deleteConversation,
  setCurrentConversation,
  setLoading,
} = conversationSlice.actions;

export const conversationReducer = conversationSlice.reducer;
```

### Context Slice
Manages context items and pinned contexts:

```typescript
// public/chatbot/store/slices/context_slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ContextState {
  availableContexts: ContextItem[];
  activeContexts: ContextItem[];
  pinnedContextIds: string[];
}

const initialState: ContextState = {
  availableContexts: [],
  activeContexts: [],
  pinnedContextIds: [],
};

export const contextSlice = createSlice({
  name: 'context',
  initialState,
  reducers: {
    setAvailableContexts: (state, action: PayloadAction<ContextItem[]>) => {
      state.availableContexts = action.payload;
    },
    
    addActiveContext: (state, action: PayloadAction<ContextItem>) => {
      if (!state.activeContexts.find(c => c.id === action.payload.id)) {
        state.activeContexts.push(action.payload);
      }
    },
    
    removeActiveContext: (state, action: PayloadAction<string>) => {
      state.activeContexts = state.activeContexts.filter(c => c.id !== action.payload);
    },
    
    togglePinContext: (state, action: PayloadAction<string>) => {
      const index = state.pinnedContextIds.indexOf(action.payload);
      if (index === -1) {
        state.pinnedContextIds.push(action.payload);
      } else {
        state.pinnedContextIds.splice(index, 1);
      }
    },
    
    clearActiveContexts: (state) => {
      // Keep only pinned contexts
      state.activeContexts = state.activeContexts.filter(
        c => state.pinnedContextIds.includes(c.id)
      );
    },
  },
});

export const {
  setAvailableContexts,
  addActiveContext,
  removeActiveContext,
  togglePinContext,
  clearActiveContexts,
} = contextSlice.actions;

export const contextReducer = contextSlice.reducer;
```

## Unified Chat Hook

### useChat Hook Implementation
Single hook to manage all chat operations:

```typescript
// public/chatbot/hooks/use_chat.ts
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatbotRootState, ChatbotDispatch } from '../store';
import { StreamingClient } from '../services/streaming_client';

export const useChat = (conversationId?: string) => {
  const dispatch = useDispatch<ChatbotDispatch>();
  const streamingClient = new StreamingClient();
  
  // Selectors
  const messages = useSelector((state: ChatbotRootState) => 
    conversationId ? state.chat.messages[conversationId] || [] : []
  );
  
  const streamingMessage = useSelector((state: ChatbotRootState) => 
    state.chat.streamingMessage
  );
  
  const sendingMessage = useSelector((state: ChatbotRootState) => 
    state.chat.sendingMessage
  );
  
  const activeContexts = useSelector((state: ChatbotRootState) => 
    state.context.activeContexts
  );
  
  const currentConversation = useSelector((state: ChatbotRootState) => 
    state.conversations.conversations.find(c => c.id === conversationId)
  );
  
  // Send message with streaming
  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || sendingMessage) return;
    
    try {
      dispatch(setSendingMessage(true));
      dispatch(setError(null));
      
      // Add user message
      const userMessage: Message = {
        id: generateId(),
        conversationId,
        role: 'user',
        content,
        timestamp: Date.now(),
      };
      
      dispatch(addMessage({ conversationId, message: userMessage }));
      
      // Create assistant message placeholder
      const assistantMessageId = generateId();
      const assistantMessage: Message = {
        id: assistantMessageId,
        conversationId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        streaming: true,
      };
      
      dispatch(addMessage({ conversationId, message: assistantMessage }));
      dispatch(startStreaming({ conversationId, messageId: assistantMessageId }));
      
      // Stream response
      const request = {
        message: content,
        conversationId,
        context: {
          automatic: getAutomaticContext(),
          optional: activeContexts,
          pinned: getPinnedContexts(),
        },
      };
      
      for await (const event of streamingClient.streamMessage(request)) {
        switch (event.type) {
          case 'message_delta':
            dispatch(updateStreaming({ content: event.data.content }));
            break;
            
          case 'message_complete':
            dispatch(endStreaming());
            break;
            
          case 'error':
            dispatch(setError(event.data.message));
            dispatch(endStreaming());
            break;
            
          case 'thinking':
            // Could update UI to show thinking indicator
            break;
            
          case 'tool_call':
            // Could display tool usage in UI
            break;
        }
      }
      
      // Update conversation metadata
      dispatch(updateConversation({
        id: conversationId,
        updatedAt: Date.now(),
        messageCount: messages.length + 2,
      }));
      
    } catch (error) {
      console.error('Failed to send message:', error);
      dispatch(setError(error.message));
    } finally {
      dispatch(setSendingMessage(false));
    }
  }, [conversationId, sendingMessage, activeContexts, dispatch]);
  
  // Create new conversation
  const createConversation = useCallback(async (title?: string) => {
    const conversation: Conversation = {
      id: generateId(),
      title: title || 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    dispatch(addConversation(conversation));
    dispatch(setCurrentConversation(conversation.id));
    
    return conversation;
  }, [dispatch]);
  
  // Switch conversation
  const switchConversation = useCallback((id: string) => {
    dispatch(setCurrentConversation(id));
  }, [dispatch]);
  
  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    dispatch(deleteConversation(id));
    
    // Also delete from backend
    try {
      await fetch(`/api/assistant/chatbot/conversations/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [dispatch]);
  
  // Load conversations on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        dispatch(setLoading(true));
        
        const response = await fetch('/api/assistant/chatbot/conversations');
        const data = await response.json();
        
        dispatch(setConversations(data.conversations));
        
        if (data.conversations.length > 0 && !conversationId) {
          dispatch(setCurrentConversation(data.conversations[0].id));
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        dispatch(setLoading(false));
      }
    };
    
    loadConversations();
  }, []);
  
  return {
    // State
    messages,
    currentConversation,
    streaming: !!streamingMessage,
    sending: sendingMessage,
    
    // Actions
    sendMessage,
    createConversation,
    switchConversation,
    deleteConversation,
    
    // Context
    activeContexts,
    addContext: (context: ContextItem) => dispatch(addActiveContext(context)),
    removeContext: (id: string) => dispatch(removeActiveContext(id)),
    togglePin: (id: string) => dispatch(togglePinContext(id)),
  };
};
```

## Persistence Strategy

### LocalStorage Persistence
Persist pinned contexts and UI preferences:

```typescript
// public/chatbot/store/persistence.ts
export const loadPersistedState = (): Partial<ChatbotRootState> => {
  try {
    const pinnedContexts = localStorage.getItem('assistant-pinned-contexts');
    const uiPreferences = localStorage.getItem('assistant-ui-preferences');
    
    return {
      context: pinnedContexts ? {
        ...initialContextState,
        pinnedContextIds: JSON.parse(pinnedContexts),
      } : undefined,
      ui: uiPreferences ? JSON.parse(uiPreferences) : undefined,
    };
  } catch (error) {
    console.error('Failed to load persisted state:', error);
    return {};
  }
};

export const persistState = (state: ChatbotRootState) => {
  try {
    localStorage.setItem(
      'assistant-pinned-contexts',
      JSON.stringify(state.context.pinnedContextIds)
    );
    
    localStorage.setItem(
      'assistant-ui-preferences',
      JSON.stringify(state.ui)
    );
  } catch (error) {
    console.error('Failed to persist state:', error);
  }
};
```

### Backend Persistence
Conversations stored in OpenSearch:

```typescript
// server/chatbot/services/conversation_service.ts
export class ConversationService {
  async saveConversation(conversation: Conversation): Promise<void> {
    await this.client.index({
      index: 'assistant-conversations',
      id: conversation.id,
      body: conversation,
    });
  }
  
  async getConversations(userId: string): Promise<Conversation[]> {
    const response = await this.client.search({
      index: 'assistant-conversations',
      body: {
        query: {
          match: { userId },
        },
        sort: [{ updatedAt: 'desc' }],
      },
    });
    
    return response.body.hits.hits.map(hit => hit._source);
  }
}
```

## Performance Optimizations

### Memoized Selectors
Use reselect for expensive computations:

```typescript
import { createSelector } from '@reduxjs/toolkit';

export const selectMessagesByConversation = createSelector(
  [(state: ChatbotRootState) => state.chat.messages, 
   (state, conversationId: string) => conversationId],
  (messages, conversationId) => messages[conversationId] || []
);

export const selectActiveConversation = createSelector(
  [(state: ChatbotRootState) => state.conversations.conversations,
   (state: ChatbotRootState) => state.conversations.currentConversationId],
  (conversations, currentId) => 
    conversations.find(c => c.id === currentId)
);
```

### Batch Updates
Group rapid updates:

```typescript
// Debounce streaming updates
const debouncedStreamUpdate = debounce((content: string) => {
  dispatch(updateStreaming({ content }));
}, 50);
```

## Integration with Assistant Plugin

### Store Provider Setup
Wrap chatbot components with store provider:

```typescript
// public/chatbot/ChatbotProvider.tsx
export const ChatbotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store] = useState(() => {
    const preloadedState = loadPersistedState();
    return configureChatbotStore(preloadedState);
  });
  
  // Setup persistence
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      persistState(store.getState());
    });
    
    return unsubscribe;
  }, [store]);
  
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};
```

### Isolation from Other Redux Stores
The chatbot store is completely isolated:
- Separate store instance
- No shared reducers
- Independent middleware
- Separate persistence

This ensures no conflicts with existing assistant plugin state or other plugins using Redux.

## Testing Strategy

### Store Testing
```typescript
describe('Chat Slice', () => {
  it('should handle adding messages', () => {
    const state = chatReducer(initialState, addMessage({
      conversationId: 'conv-1',
      message: { id: 'msg-1', content: 'Hello' },
    }));
    
    expect(state.messages['conv-1']).toHaveLength(1);
  });
  
  it('should handle streaming updates', () => {
    const state = chatReducer(
      { ...initialState, streamingMessage: { content: 'Hello' } },
      updateStreaming({ content: ' World' })
    );
    
    expect(state.streamingMessage.content).toBe('Hello World');
  });
});
```

### Hook Testing
```typescript
import { renderHook, act } from '@testing-library/react-hooks';

describe('useChat Hook', () => {
  it('should send message and receive response', async () => {
    const { result } = renderHook(() => useChat('conv-1'));
    
    await act(async () => {
      await result.current.sendMessage('Hello');
    });
    
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe('user');
    expect(result.current.messages[1].role).toBe('assistant');
  });
});
```