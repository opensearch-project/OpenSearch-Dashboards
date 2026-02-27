/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export {
  ChatServiceInterface,
  ChatServiceSetup,
  ChatServiceStart,
  ChatImplementationFunctions,
  Message,
  DeveloperMessage,
  SystemMessage,
  AssistantMessage,
  UserMessage,
  ToolMessage,
  ActivityMessage,
  ActivityType,
  ToolCall,
  FunctionCall,
  Role,
  ChatWindowState,
  SavedConversation,
  ConversationMemoryProvider,
  ConversationPaginationParams,
  PaginatedConversations,
} from './types';

export {
  EventType,
  BaseEvent,
  Event,
  RunStartedEvent,
  RunFinishedEvent,
  RunErrorEvent,
  MessagesSnapshotEvent,
  TextMessageStartEvent,
  TextMessageContentEvent,
  TextMessageEndEvent,
  TextMessageChunkEvent,
  ThinkingTextMessageStartEvent,
  ThinkingTextMessageContentEvent,
  ThinkingTextMessageEndEvent,
  ThinkingStartEvent,
  ThinkingEndEvent,
  ToolCallStartEvent,
  ToolCallArgsEvent,
  ToolCallEndEvent,
  ToolCallResultEvent,
  ToolCallChunkEvent,
  StateSnapshotEvent,
  StateDeltaEvent,
  StepStartedEvent,
  StepFinishedEvent,
  RawEvent,
  CustomEvent,
} from './events';

export { ChatService } from './chat_service';
export { coreChatServiceMock } from './chat_service.mock';

export {
  ChatScreenshotService,
  ChatScreenshotServiceInterface,
  ChatScreenshotButton,
} from './screenshot_service';
