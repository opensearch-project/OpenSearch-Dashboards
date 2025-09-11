# UI Components Design Document

## Overview
This document outlines the UI component architecture for the migrated chatbot functionality, maintaining the existing ai_chatbot UX while improving structure.

## Component Hierarchy

```
ChatbotRoot
├── ChatPage (Full page mode)
│   ├── ConversationSidebar
│   │   ├── ConversationList
│   │   └── NewChatButton
│   └── MultiTurnChat
│       ├── MessageList
│       ├── ContextPills
│       └── ChatInput
├── SidePanelChat (Side panel mode)
│   ├── CompactHeader
│   │   ├── ConversationDropdown
│   │   └── ConnectionStatus
│   └── MultiTurnChat (shared)
└── GlobalSearchChat (Cmd+/ mode)
    └── FloatingCommandBar
        └── MultiTurnChat (simplified)
```

## Core Components

### MultiTurnChat Component
The core chat experience shared across all modes:

```typescript
interface MultiTurnChatProps {
  conversationId: string;
  mode: 'full' | 'panel' | 'search';
  onNewMessage?: (message: Message) => void;
  className?: string;
}

export const MultiTurnChat: React.FC<MultiTurnChatProps> = ({
  conversationId,
  mode,
  onNewMessage,
  className
}) => {
  const { messages, sendMessage, streaming } = useChat(conversationId);
  const { contexts, addContext, removeContext } = useContext();
  
  return (
    <EuiFlexGroup direction="column" className={className}>
      <EuiFlexItem grow>
        <MessageList 
          messages={messages} 
          streaming={streaming}
        />
      </EuiFlexItem>
      
      {contexts.length > 0 && (
        <EuiFlexItem grow={false}>
          <ContextPills 
            contexts={contexts}
            onRemove={removeContext}
          />
        </EuiFlexItem>
      )}
      
      <EuiFlexItem grow={false}>
        <ChatInput
          onSend={sendMessage}
          onContextTrigger={addContext}
          disabled={streaming}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
```

### MessageList Component
Displays chat messages with streaming support:

```typescript
interface MessageListProps {
  messages: Message[];
  streaming: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  streaming
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);
  
  return (
    <div ref={listRef} className="chat-message-list">
      {messages.map((message) => (
        <MessageBubble 
          key={message.id}
          message={message}
          streaming={streaming && message.id === messages[messages.length - 1]?.id}
        />
      ))}
    </div>
  );
};
```

### ChatInput Component
Input with @ mentions and / commands:

```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  onContextTrigger: () => void;
  disabled: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onContextTrigger,
  disabled
}) => {
  const [value, setValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionType, setSuggestionType] = useState<'context' | 'command' | null>(null);
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '@') {
      setSuggestionType('context');
      setShowSuggestions(true);
    } else if (e.key === '/') {
      setSuggestionType('command');
      setShowSuggestions(true);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleSend = () => {
    if (value.trim() && !disabled) {
      onSend(value);
      setValue('');
    }
  };
  
  return (
    <div className="chat-input-container">
      {showSuggestions && (
        <SuggestionsDropdown
          type={suggestionType}
          onSelect={(item) => {
            // Handle selection
            setShowSuggestions(false);
          }}
          onClose={() => setShowSuggestions(false)}
        />
      )}
      
      <EuiTextArea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Type a message... (@ for context, / for commands)"
        rows={2}
        resize="vertical"
      />
      
      <EuiButton
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        fill
      >
        Send
      </EuiButton>
    </div>
  );
};
```

## Mode-Specific Components

### SidePanelChat
Wrapper for side panel mode:

```typescript
export const SidePanelChat: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentConversation, switchConversation } = useConversations();
  
  if (isCollapsed) {
    return (
      <FloatingChatButton 
        onClick={() => setIsCollapsed(false)}
      />
    );
  }
  
  return (
    <EuiPanel className="side-panel-chat">
      <CompactHeader
        conversation={currentConversation}
        onConversationChange={switchConversation}
        onCollapse={() => setIsCollapsed(true)}
        onMaximize={() => navigateToFullPage()}
      />
      
      <MultiTurnChat
        conversationId={currentConversation.id}
        mode="panel"
      />
    </EuiPanel>
  );
};
```

### ChatPage
Full page chat experience:

```typescript
export const ChatPage: React.FC = () => {
  const { conversations, currentConversation, switchConversation, createConversation } = useConversations();
  
  return (
    <EuiPage>
      <EuiPageSideBar>
        <ConversationSidebar
          conversations={conversations}
          current={currentConversation}
          onSelect={switchConversation}
          onCreate={createConversation}
        />
      </EuiPageSideBar>
      
      <EuiPageBody>
        <EuiPageHeader>
          <EuiPageHeaderSection>
            <EuiTitle>
              <h1>{currentConversation.title}</h1>
            </EuiTitle>
          </EuiPageHeaderSection>
          
          <EuiPageHeaderSection>
            <ConnectionStatus />
          </EuiPageHeaderSection>
        </EuiPageHeader>
        
        <EuiPageContent>
          <MultiTurnChat
            conversationId={currentConversation.id}
            mode="full"
          />
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};
```

## Context Management Components

### ContextPills
Display active contexts:

```typescript
interface ContextPillsProps {
  contexts: Context[];
  onRemove: (id: string) => void;
  onPin?: (id: string) => void;
}

export const ContextPills: React.FC<ContextPillsProps> = ({
  contexts,
  onRemove,
  onPin
}) => {
  return (
    <EuiFlexGroup gutterSize="s" wrap>
      {contexts.map((context) => (
        <EuiFlexItem key={context.id} grow={false}>
          <ContextPill
            context={context}
            onRemove={() => onRemove(context.id)}
            onPin={onPin ? () => onPin(context.id) : undefined}
          />
        </EuiFlexItem>
      ))}
    </EuiFlexGroup>
  );
};
```

### SuggestionsDropdown
@ mentions and / commands dropdown:

```typescript
interface SuggestionsDropdownProps {
  type: 'context' | 'command' | null;
  onSelect: (item: any) => void;
  onClose: () => void;
}

export const SuggestionsDropdown: React.FC<SuggestionsDropdownProps> = ({
  type,
  onSelect,
  onClose
}) => {
  const suggestions = useSuggestions(type);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Smart positioning to ensure visibility
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'above' | 'below'>('below');
  
  useEffect(() => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
        setPosition('above');
      }
    }
  }, []);
  
  // Group and sort suggestions by priority
  const groupedSuggestions = useMemo(() => {
    return suggestions
      .sort((a, b) => (a.priority || 999) - (b.priority || 999))
      .reduce((groups, item) => {
        const category = item.category || 'Other';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(item);
        return groups;
      }, {} as Record<string, any[]>);
  }, [suggestions]);
  
  return (
    <div 
      ref={dropdownRef}
      className={`suggestions-dropdown suggestions-dropdown--${position}`}
    >
      {Object.entries(groupedSuggestions).map(([category, items]) => (
        <div key={category}>
          <EuiTitle size="xxxs">
            <h4>{category}</h4>
          </EuiTitle>
          
          <EuiSelectable
            options={items}
            singleSelection
            onChange={(options) => {
              const selected = options.find(o => o.checked);
              if (selected) {
                onSelect(selected);
              }
            }}
          >
            {(list) => list}
          </EuiSelectable>
        </div>
      ))}
    </div>
  );
};
```

## Styling Approach

### Using EUI Components
- Leverage EUI components for consistency with OpenSearch Dashboards
- Custom CSS only for chat-specific layouts
- Theme variables for colors and spacing

### Custom Styles
Located in `public/chatbot/styles/`:

```scss
// chat.scss
.chat-message-list {
  height: 100%;
  overflow-y: auto;
  padding: $euiSize;
  
  .message-bubble {
    margin-bottom: $euiSizeM;
    
    &--user {
      text-align: right;
      
      .message-content {
        background-color: $euiColorPrimary;
        color: $euiColorEmptyShade;
      }
    }
    
    &--assistant {
      .message-content {
        background-color: $euiColorLightestShade;
      }
    }
  }
}

.side-panel-chat {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 400px;
  z-index: 999;
  
  @include euiBreakpoint('xs', 's') {
    width: 100%;
  }
}

.suggestions-dropdown {
  position: absolute;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  background: $euiColorEmptyShade;
  border: $euiBorderThin;
  border-radius: $euiBorderRadius;
  box-shadow: $euiShadowLarge;
  
  &--above {
    bottom: 100%;
    margin-bottom: $euiSizeXS;
  }
  
  &--below {
    top: 100%;
    margin-top: $euiSizeXS;
  }
}
```

## Accessibility Patterns

### Keyboard Navigation
- Tab through interactive elements
- Enter to send message
- Escape to close suggestions
- Arrow keys to navigate suggestions

### Screen Reader Support
- ARIA labels for all interactive elements
- Live regions for streaming messages
- Announce context changes

### Focus Management
- Auto-focus input after sending message
- Trap focus in modals
- Return focus on close

## Performance Optimizations

### Message List Virtualization
For conversations with many messages:

```typescript
import { FixedSizeList } from 'react-window';

export const VirtualizedMessageList: React.FC<MessageListProps> = ({
  messages
}) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <MessageBubble message={messages[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={600}
      itemCount={messages.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Lazy Loading Components
```typescript
const ChatPage = lazy(() => import('./ChatPage'));
const SidePanelChat = lazy(() => import('./SidePanelChat'));
```

## Testing Strategy

### Component Testing
- Unit tests with React Testing Library
- Snapshot tests for UI consistency
- Integration tests for user flows

### Visual Testing
- Storybook for component development
- Visual regression tests
- Responsive design testing

### Accessibility Testing
- Automated a11y checks
- Keyboard navigation tests
- Screen reader testing