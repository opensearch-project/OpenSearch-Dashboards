# Chat Component Requirements

## Overview
A custom chat component that connects to a LangGraph agent using ag-ui for observability use cases, with advanced context-aware capabilities and universal accessibility.

## Context Architecture Overview

The chat system implements a sophisticated multi-layered context architecture that balances AI efficiency with comprehensive data availability:

### Key Principles
1. **Minimal Automatic Context**: Prevents overwhelming the AI with unnecessary data while ensuring critical information is always available
2. **Rich Optional Context**: Empowers users to selectively add comprehensive context through @ mentions when deeper analysis is needed
3. **Dynamic Adaptation**: Context automatically adjusts based on page state, user actions, and search modes
4. **Persistent Context**: User-selected contexts can be pinned to persist across navigation
5. **Priority-Based Discovery**: Page-specific contexts appear first in suggestions for immediate relevance

### Benefits
- **AI Efficiency**: Automatic context kept minimal (~1KB) to maintain fast response times
- **User Control**: Users decide what additional context to include based on their needs
- **Contextual Relevance**: Dynamic loading ensures context matches current user activity
- **Seamless Integration**: Pages integrate via simple hook pattern with standardized methods
- **Visual Clarity**: Context pills provide clear visibility of active contexts with management controls

## Core Features

### 1. LangGraph Agent Integration
- Connect to LangGraph agent on server
- Real-time streaming responses
- Support for one-on-one chat interaction

### 2. Step Visualization
Display different agent states:
- **Thinking**: Show when agent is processing
- **Tool Calls**: Display searches, queries, dashboard reads, visualization creation
- **Tool Responses**: Show outputs when relevant to UI
- **Streaming**: Real-time response display

### 3. Task Management
- Agent-controlled task list creation
- Dynamic task management during conversation
- Visual task progress tracking

### 4. Context Management

#### Context Architecture

##### Context Layers
**User Story:** As a user, I want the chat assistant to have access to relevant page information without overwhelming it with data, while still being able to add comprehensive context when needed.

**Context Types:**
1. **Automatic Context (Minimal Footprint)**
   - Always included in chat conversations
   - Minimal data to avoid overwhelming the AI
   - Contains critical information for immediate awareness
   - Example: Dashboard overview, critical alerts, current search query

2. **Optional Context (Rich Data via @ Mentions)**
   - Available through @ mention system
   - Comprehensive data sets for deeper analysis
   - User-controlled inclusion for specific needs
   - Example: Full metrics, application health details, business KPIs

3. **Dynamic Context (State-Based)**
   - Automatically adjusts based on page state
   - Conditional inclusion based on user actions
   - Example: Search-mode specific widgets appear only during search

4. **Pinned Context (Persistent)**
   - User-selected contexts that persist across pages
   - Survives navigation and page refreshes
   - Stored in localStorage for session continuity

##### Context Priority System
**User Story:** As a user, I want page-specific context to appear first in my @ suggestions so I can quickly access the most relevant information for my current view.

**Priority Requirements:**
- Context items have a `priority` field (lower number = higher priority)
- Page context assigned `priority: 1` to appear first
- Suggestions sorted by priority before category grouping
- Ensures most relevant contexts are immediately visible

##### Context Categories
**User Story:** As a user, I want context suggestions organized by category so I can quickly find the type of information I need.

**Categories:**
- **Page Information**: Page context offered by a page and navigation state. e.g. discover table results
- **Index patterns**: Recently accessed index patterns
- **Saved objects**: Other saved obejcts (last 5 based on the search criteria)

#### @ Hotkey Resource Reference
**User Story:** As a user, I want to use @ mentions to add specific context to my chat conversations for more informed assistance.

**Accessible Resources:**
- Page-specific context with priority ordering
- Dashboard visualizations (individual or groups)
- Time ranges and date filters
- Saved queries and search patterns
- Datasets and data sources
- MCP server resources

**Selection Behavior:**
- @ key triggers dropdown with categorized suggestions
- Priority-based ordering ensures relevance
- Visual icons for quick type identification
- Descriptive tooltips for context understanding
- Keyboard navigation with arrow keys
- Enter to select, Escape to cancel

#### Context Pills Display
**User Story:** As a user, I want to see my active contexts clearly displayed so I understand what information the assistant has access to.

**Display Requirements:**
- Active contexts shown as colored pills above chat input
- Each pill shows icon, title, and action buttons
- Pin/unpin toggle for persistence control
- Remove button for context removal
- Color coding by context type for visual clarity
- Truncated titles with full description on hover
- "Show more" expandable when many contexts active
- Clear all button for bulk removal (excluding pinned)

#### Slash Commands
- `/investigate <optional info>` - Trigger investigation workflows
- Extensible for additional commands

#### Suggestion Positioning Requirements
**User Story:** As a user, I want suggestions to always be visible and accessible when I trigger them, regardless of the chat layout or available space.

**Positioning Behavior:**
- **Smart Positioning**: Suggestions must automatically position themselves to remain fully visible within the viewport
- **Above-Input Display**: In constrained layouts (such as side panels or compact views), suggestions should appear above the input field to ensure visibility
- **Consistent Accessibility**: Suggestions must never appear outside the visible area or be cut off by container boundaries
- **Boundary Awareness**: The suggestion dropdown must detect available space and adjust its position accordingly

**Accessibility Requirements:**
- All suggestions must be reachable via keyboard navigation
- Suggestions must remain within the scrollable area of their container
- In side panel mode with limited vertical space, suggestions must prioritize visibility over standard positioning
- The suggestion dropdown must not cause layout shifts that would move the input field out of view

**Consistency Requirements:**
- Positioning behavior must be consistent across all chat modes (side panel, full page, inline)
- Both @ context suggestions and / command suggestions must follow the same positioning rules
- The selected suggestion must always be visible within the dropdown's scroll area

### 5. Conversation Management
- **Multiple Conversations**: Users can create and manage multiple conversation threads
- **Conversation History**: All conversations are automatically saved and can be accessed later
- **Conversation Switching**: Users can easily switch between different conversations
- **Conversation Metadata**: Each conversation shows title, message count, and last activity date
- **New Chat Creation**: Users can start new conversations at any time with a dedicated button
- **Cross-mode Access**: Same conversations are available in both side panel and full page modes

### 6. Universal Accessibility

#### Multiple Usage Modes
1. **Full Page Chat App** - Dedicated chat interface with multi-turn conversation
2. **Side Panel** - Collapsible panel on any page with multi-turn conversation
3. **Inline Element Chat** - Contextual chat triggered by sparkle buttons on specific elements
4. **Global Search Chat** - AI-powered search and chat interface with cmd+/ hotkey

#### Mode-Specific Requirements

##### Multi-Turn Chat (Side Panel & Full Page)
- Shared conversation history between modes
- Complete task management view
- Tool call visualization
- Resizable side panel with width persistence
- Collapsible to floating button when minimized
- Shared core chat component for consistency
- Dedicated chat page accessible via navigation menu
- Maximize button on side panel to navigate to full page

**Full Page Mode Enhancements:**
- Left sidebar with conversation list and search functionality
- Rich conversation management with titles, previews, and metadata
- New Chat button prominently displayed
- Connection status indicator in header
- Search and filter conversations by title or content

**Side Panel Mode Enhancements:**
- Compact header with conversation selector dropdown
- New Chat button always accessible
- Connection status badge
- Space-efficient design for narrow panel

##### Global Search Chat
**User Story:** As a user, I want to quickly access both navigation commands and AI chat from anywhere in the application using a keyboard shortcut.

**Requirements:**
- Activated with cmd+/ (Mac) or ctrl+/ (Windows/Linux) keyboard shortcut
- Dual-purpose: search for navigation commands AND start AI conversations
- When I type something that doesn't match commands, I should see an inviting sparkle (✨) icon encouraging me to chat about it
- Pressing Enter should start a new AI conversation in the sidepanel with my query
- Must open the sidepanel automatically if it's currently closed
- Must always create a new conversation rather than adding to existing ones
- Should feel like an opportunity to chat when no commands are found, not an error state

##### Inline Element Chat
**User Story:** As a user, I want to ask questions about specific elements on the page by clicking sparkle buttons.

**Requirements:**
- Sparkle button triggers contextual chat for specific page elements
- Single-turn interactions focused on the element context

#### Context Handling
- **Global Search**: Access to page context and navigation state
- **Inline Chat**: Access to page context, component data, and DOM element
- **Side Panel/Full Page**: Access to full application context
- All modes should support @ and / hotkeys with appropriate context

## Page Integration Patterns

### Dynamic Context Loading
**User Story:** As a user, I want the chat context to automatically adapt based on my actions on the page so the assistant has relevant information about what I'm doing.

**Dynamic Context Patterns:**
1. **Search Mode Context**
   - Additional contexts appear when search is active
   - Search query and results included in automatic context
   - Search-specific widgets available as optional context

2. **Filter-Based Context**
   - Context updates when filters are applied
   - Time range changes reflected in context
   - Dataset selections update available context

3. **Selection-Based Context**
   - Context changes based on selected items
   - Clicked visualizations add specific context
   - Selected cases/alerts provide detailed context

**State Change Handling:**
- Pages monitor their own state changes
- Context updates triggered by state changes
- Previous context cleaned up on state transitions
- Pinned contexts preserved across changes

## Technical Requirements

### Component Structure
- Responsive design for all modes
- Modular architecture with clean separation of concerns:
  - **MultiTurnChat** - Core chat functionality without UI chrome
  - **SidePanelChat** - Side panel wrapper with compact conversation management
  - **ChatPage** - Full page wrapper with rich sidebar conversation browser
  - **FloatingCommandBar** - Base component for global search and inline chat
  - **SuggestionsDropdown** - Reusable for @ and / suggestions with priority sorting
  - **SparkleButton** - Trigger component for inline chat on any element
  - **ContextPill** - Visual representation of active context items
  - **ContextPills** - Container for managing multiple context pills

### State Management
- Real-time connection handling
- Shared message history persistence
- Context state management via ChatProvider
- Session management with UUID-based conversation tracking
- Conversation switching and history preservation
- Page context stored in Map for efficient lookups
- Pinned context persistence in localStorage

### Integration Points
- Dashboard visualization context
- Query execution context
- MCP server integration
- Time range awareness
- Page-specific context integration
- Global context provider
- OpenSearch saved object for conversation history persistence

## Context Management Best Practices

### Automatic Context Guidelines
**User Story:** As a product owner, I want to ensure the chat assistant has essential information without being overwhelmed by data.

**Best Practices:**
1. **Keep It Minimal**
   - Include only critical information
   - Focus on current page state and active alerts
   - Limit to 2-3 automatic context items
   - Total data size should be < 1KB

2. **Make It Relevant**
   - Current page identification
   - Active critical issues
   - Current search/filter state
   - Recent user actions

3. **Avoid Redundancy**
   - Don't duplicate information across contexts
   - Use references instead of full data when possible
   - Clean up outdated context promptly

### Optional Context Guidelines
**User Story:** As a developer, I want to provide comprehensive context options that users can selectively include based on their needs.

**Best Practices:**
1. **Organize by Category**
   - Group related contexts together
   - Use consistent category names
   - Apply appropriate icons and colors

2. **Provide Rich Data**
   - Include detailed metrics and KPIs
   - Add historical comparisons
   - Include related entity information
   - Provide actionable insights

3. **Enable Discovery**
   - Clear, descriptive titles
   - Helpful descriptions/tooltips
   - Visual type indicators
   - Priority ordering for relevance

### Performance Considerations
**User Story:** As a user, I want the chat system to remain responsive even with many active contexts.

**Performance Requirements:**
1. **Efficient Storage**
   - Use Map for O(1) context lookups
   - Lazy load optional context data
   - Limit context history depth

2. **Smart Updates**
   - Batch context updates
   - Debounce rapid state changes
   - Use shallow equality checks

3. **Memory Management**
   - Clear unused contexts on navigation
   - Limit pinned contexts to 10 items
   - Implement context expiration