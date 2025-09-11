/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * Memory Enhanced Claude Agent
 * Wraps existing ClaudeOSDAgent with memory capabilities
 */

import { ClaudeOSDAgent } from './claude_agent';
import { SimpleMemoryService, MemoryItem } from '../services/simple_memory_service';
import { ContextData } from '../types';

export class MemoryEnhancedClaudeAgent {
  private memoryService: SimpleMemoryService;

  constructor(private originalAgent: ClaudeOSDAgent, memoryService?: SimpleMemoryService) {
    this.memoryService = memoryService || new SimpleMemoryService();
  }

  async processRequest(userMessage: string, context: ContextData): Promise<string> {
    console.log('🧠 Memory Enhanced Agent processing request:', userMessage);

    // Handle memory commands first
    if (userMessage.trim() === 'list memories') {
      return this.handleListMemories();
    }

    if (userMessage.startsWith('load ')) {
      return this.handleLoadMemory(userMessage);
    }

    if (userMessage.includes('list top 5 memories')) {
      const cleanQuery = userMessage.replace('list top 5 memories', '').trim();
      return this.handleSearchMemories(cleanQuery);
    }

    if (userMessage.trim() === 'manage memory') {
      return this.handleManageMemory();
    }

    // Handle context commands
    if (userMessage.trim() === 'list system context') {
      return this.handleListSystemContext(context);
    }

    if (userMessage.trim() === 'list memory context') {
      return this.handleListMemoryContext();
    }

    if (userMessage.trim() === 'list full context') {
      return this.handleListFullContext(context);
    }

    // Handle save command
    if (userMessage.trim() === 'save') {
      return this.handleSaveSession();
    }

    // Handle delete session command
    if (userMessage.startsWith('delete ')) {
      return this.handleDeleteSession(userMessage);
    }

    // Handle rename session command
    if (userMessage.startsWith('rename ')) {
      return this.handleRenameSession(userMessage);
    }

    // For regular queries, enhance with memory context
    try {
      // 1. Search for relevant memories
      const relevantMemories = this.memoryService.searchMemories(userMessage, 3);

      // 2. Build enhanced context with memory
      const enhancedContext = {
        ...context,
        memoryContext: this.formatMemoriesForContext(relevantMemories),
        chatHistory: this.memoryService.getCurrentChatHistory().slice(-6), // Last 3 exchanges from current chat
        sessionSummary: this.memoryService.getSessionSummary(),
      };

      // 3. Enhance the user message with memory context if relevant memories found
      let enhancedMessage = userMessage;
      if (relevantMemories.length > 0) {
        const memoryContext = relevantMemories
          .map((m) => `Previous: ${m.content.substring(0, 100)}...`)
          .join('\n');

        enhancedMessage = `Context from previous conversations:\n${memoryContext}\n\nCurrent question: ${userMessage}`;
      }

      // 4. Call original agent with enhanced context
      const response = await this.originalAgent.processRequest(enhancedMessage, enhancedContext);

      // 5. Add to chat history (temporary, not saved to memory)
      this.memoryService.addToChatHistory(userMessage, response, context);

      return response;
    } catch (error) {
      console.error('❌ Memory Enhanced Agent error:', error);

      // Fallback to original agent if memory enhancement fails
      const response = await this.originalAgent.processRequest(userMessage, context);
      // DO NOT save to memory automatically

      return response + '\n\n⚠️ Memory enhancement temporarily unavailable';
    }
  }

  private handleListMemories(): string {
    const sessions = this.memoryService.listAllMemories();

    if (sessions.length === 0) {
      return '💾 No memory sessions found. Start a conversation to create memories!';
    }

    let response = '💾 Available Memory Sessions:\n\n';

    sessions.forEach((session, index) => {
      const userQueries = session.memories.filter((m) => m.type === 'user_query').length;
      const timeAgo = this.getTimeAgo(session.createdAt);
      const displayName = session.name || session.sessionId;

      response += `${index + 1}. ${displayName}\n`;
      response += `   📊 ${userQueries} conversations | 🕒 ${timeAgo}\n`;
      response += `   💬 Load with: load ${displayName}\n\n`;
    });

    response += '💡 Commands:\n';
    response += '• load <saved memory title> - Load specific memory session\n';
    response += '• manage memory - View current session details\n';
    response += '• Add "list top 5 memories" to any question for related context';

    return response;
  }

  private handleLoadMemory(command: string): string {
    const memoryTitle = command.replace('load ', '').trim();

    // Find session by name or sessionId
    const sessions = this.memoryService.listAllMemories();
    const session = sessions.find(
      (s) => (s.name && s.name === memoryTitle) || s.sessionId === memoryTitle
    );

    if (!session) {
      return `❌ Memory session "${memoryTitle}" not found. Use list memories to see available sessions.`;
    }

    const switched = this.memoryService.switchToSession(session.sessionId);
    if (!switched) {
      return `❌ Failed to switch to memory session "${memoryTitle}".`;
    }

    const userQueries = session.memories.filter((m) => m.type === 'user_query').length;
    const timeAgo = this.getTimeAgo(session.createdAt);
    const displayName = session.name || session.sessionId;

    let response = `✅ Loaded Memory Session: ${displayName}\n\n`;
    response += `📊 Contains ${userQueries} conversations (${session.memories.length} total memories)\n`;
    response += `🕒 Created ${timeAgo}\n\n`;

    if (session.memories.length > 0) {
      response += '📝 Recent Memories:\n';
      const recentMemories = session.memories
        .filter((m) => m.type === 'user_query')
        .slice(-3)
        .reverse();

      recentMemories.forEach((memory, index) => {
        const preview = memory.content.substring(0, 80);
        response += `${index + 1}. ${preview}${memory.content.length > 80 ? '...' : ''}\n`;
      });
    }

    response += '\n💾 This session is now active. All new conversations will be saved here.';

    return response;
  }

  private handleSearchMemories(query: string): string {
    if (!query.trim()) {
      return '🔍 Please provide a search query. Example: "error analysis list top 5 memories"';
    }

    const memories = this.memoryService.searchMemories(query, 5);

    if (memories.length === 0) {
      return `🔍 No memories found for "${query}". Try different keywords or ask your question normally.`;
    }

    let response = `🔍 **Found ${memories.length} related memories for "${query}":**\n\n`;

    memories.forEach((memory, index) => {
      const timeAgo = this.getTimeAgo(memory.timestamp);
      const preview = memory.content.substring(0, 100);
      const type = memory.type === 'user_query' ? '👤' : '🤖';

      response += `${index + 1}. ${type} ${preview}${memory.content.length > 100 ? '...' : ''}\n`;
      response += `   🕒 ${timeAgo}\n\n`;
    });

    response +=
      '💡 These memories will be automatically included in context for relevant questions.\n';
    response +=
      'Continue with your question, or use `load <session_id>` to switch to a specific session.';

    return response;
  }

  private handleManageMemory(): string {
    const savedMemories = this.memoryService.getCurrentSessionMemories();
    const chatHistory = this.memoryService.getCurrentChatHistory();
    const sessionSummary = this.memoryService.getSessionSummary();
    const sessionId = this.memoryService.getCurrentSessionId();
    const currentSession = this.memoryService.getSessionDetails(sessionId);
    const displayName = currentSession?.name || sessionId;

    let response = `💾 Current Memory Session:\n${sessionSummary}\n\n`;

    // Show saved memories
    if (savedMemories.length > 0) {
      response += '💾 Saved Memories in Current Session:\n';
      const recentSaved = savedMemories
        .filter((m) => m.type === 'user_query')
        .slice(-3)
        .reverse();

      recentSaved.forEach((memory, index) => {
        const timeAgo = this.getTimeAgo(memory.timestamp);
        const preview = memory.content.substring(0, 80);

        response += `${index + 1}. ${preview}${memory.content.length > 80 ? '...' : ''}\n`;
        response += `   🕒 ${timeAgo}\n\n`;
      });
    } else {
      response += '💾 No saved memories in current session.\n\n';
    }

    // Show current chat history
    if (chatHistory.length > 0) {
      const chatQueries = chatHistory.filter((m) => m.type === 'user_query').length;
      response += `💬 Current Chat History: ${chatQueries} conversations (not saved)\n`;
      response += 'Use "save" command to save current chat to memory.\n\n';
    } else {
      response += '💬 No current chat history.\n\n';
    }

    response += ' Session Management:\n';
    response += `• Current Session: ${displayName}\n`;
    response += `• Delete Session: delete ${displayName}\n`;
    response += `• Rename Session: rename ${displayName} <new_name>\n\n`;

    response += '💡 Available Commands:\n';
    response += '• list memories - See all memory sessions\n';
    response += '• load <saved memory title> - Switch to different session\n';
    response += '• save - Save current chat to memory\n';
    response += '• list full context - View all 4 parts of context system\n';
    response += '• Add "list top 5 memories" to questions for context';

    return response;
  }

  private handleListSystemContext(context: ContextData): string {
    let response = '🖥️ System Context:\n\n';

    if (!context || Object.keys(context).length === 0) {
      return response + 'No system context available.';
    }

    // Format system context nicely
    Object.entries(context).forEach(([key, value]) => {
      if (key !== 'memoryContext' && key !== 'conversationHistory' && key !== 'sessionSummary') {
        response += `${key}: `;
        if (typeof value === 'object') {
          response += `${JSON.stringify(value, null, 2)}\n\n`;
        } else {
          response += `${value}\n\n`;
        }
      }
    });

    return response;
  }

  private handleListMemoryContext(): string {
    const sessionSummary = this.memoryService.getSessionSummary();

    let response = '💾 Memory Context:\n\n';
    response += `Session: ${sessionSummary}\n\n`;

    // Show loaded memories (saved memories that have been loaded into current context)
    const relevantMemories = this.memoryService.searchMemories('', 5); // Get recent saved memories

    if (relevantMemories.length === 0) {
      return response + 'No saved memories loaded in current context.';
    }

    response += 'Loaded Saved Memories:\n';

    // Group by conversation pairs
    const conversations: Array<{ user: string; assistant: string }> = [];
    for (let i = 0; i < relevantMemories.length - 1; i += 2) {
      const userMem = relevantMemories[i];
      const assistantMem = relevantMemories[i + 1];

      if (userMem?.type === 'user_query' && assistantMem?.type === 'assistant_response') {
        conversations.push({
          user: userMem.content,
          assistant: assistantMem.content,
        });
      }
    }

    conversations.slice(0, 3).forEach((conv, index) => {
      response += `User: ${conv.user}\n`;
      response += `Assistant: ${conv.assistant.substring(0, 100)}${
        conv.assistant.length > 100 ? '...' : ''
      }\n\n`;
    });

    return response;
  }

  private handleListFullContext(context: ContextData): string {
    let response = '📋 Full Context (4 Parts):\n\n';

    // 1. System Context
    response += '1. System Context\n';
    if (context && Object.keys(context).length > 0) {
      Object.entries(context).forEach(([key, value]) => {
        if (key !== 'memoryContext' && key !== 'chatHistory' && key !== 'sessionSummary') {
          response += `${key}: `;
          if (typeof value === 'object') {
            response += `${JSON.stringify(value)}\n`;
          } else {
            response += `${value}\n`;
          }
        }
      });
    } else {
      response += 'No system context available.\n';
    }

    // 2. Memory Context (saved memories only)
    response += '\n2. Memory Context\n';
    const savedMemories = this.memoryService.getCurrentSessionMemories();
    if (savedMemories.length > 0) {
      const recentSaved = savedMemories.slice(-4);
      recentSaved.forEach((memory) => {
        const type = memory.type === 'user_query' ? 'User' : 'Assistant';
        // Show full content without truncation
        response += `${type}: ${memory.content}\n\n`;
      });
    } else {
      response += 'No saved memories in current session.\n';
    }

    // 3. Chat History (current session conversation)
    response += '\n3. Chat History\n';
    const chatHistory = this.memoryService.getCurrentChatHistory();
    if (chatHistory.length > 0) {
      const recentChat = chatHistory.slice(-4); // Last 2 exchanges
      recentChat.forEach((memory) => {
        const type = memory.type === 'user_query' ? 'User' : 'Assistant';
        // Show full content without truncation
        response += `${type}: ${memory.content}\n\n`;
      });
    } else {
      response += 'No chat history in current session.\n';
    }

    // 4. Tools Definition
    response += '\n4. Tools Definition\n';
    try {
      const tools = this.originalAgent.getAvailableTools();
      if (tools && tools.length > 0) {
        tools.forEach((tool: any) => {
          response += `• ${tool.name}: ${tool.description}\n`;
        });
      } else {
        response += 'No tools available or tools not accessible.\n';
      }
    } catch (error) {
      response += 'Tools information not available.\n';
    }

    return response;
  }

  private handleSaveSession(): string {
    const sessionId = this.memoryService.getCurrentSessionId();
    const currentSession = this.memoryService.getSessionDetails(sessionId);
    const displayName = currentSession?.name || sessionId;

    // Save current chat history to memory
    this.memoryService.saveCurrentChatToMemory();

    const sessionSummary = this.memoryService.getSessionSummary();

    return `✅ Updated saved memory ${displayName}\n\n📊 ${sessionSummary}\n\n💾 Current chat conversation has been saved to memory.`;
  }

  private handleDeleteSession(command: string): string {
    const displayName = command.replace('delete ', '').trim();

    // Find session by name or sessionId
    const sessions = this.memoryService.listAllMemories();
    const session = sessions.find(
      (s) => (s.name && s.name === displayName) || s.sessionId === displayName
    );

    if (!session) {
      return `❌ Session "${displayName}" not found. Use list memories to see available sessions.`;
    }

    const deleted = this.memoryService.deleteSession(session.sessionId);
    if (deleted) {
      const newSessionId = this.memoryService.getCurrentSessionId();
      return `✅ Deleted session "${displayName}"\n\n🆕 Created new session: ${newSessionId}\n\n💡 Use list memories to see remaining sessions.`;
    } else {
      return `❌ Failed to delete session "${displayName}".`;
    }
  }

  private handleRenameSession(command: string): string {
    // Parse: "rename current_name new_name"
    const parts = command.replace('rename ', '').trim().split(' ');
    if (parts.length < 2) {
      return '❌ Invalid format. Use: rename <current_name> <new_name>';
    }

    const currentName = parts[0];
    const newName = parts.slice(1).join(' ');

    // Find session by name or sessionId
    const sessions = this.memoryService.listAllMemories();
    const session = sessions.find(
      (s) => (s.name && s.name === currentName) || s.sessionId === currentName
    );

    if (!session) {
      return `❌ Session "${currentName}" not found. Use list memories to see available sessions.`;
    }

    const renamed = this.memoryService.renameSession(session.sessionId, newName);
    if (renamed) {
      return `✅ Renamed session "${currentName}" to "${newName}"\n\n💡 The session will now display as "${newName}" in memory lists.`;
    } else {
      return `❌ Failed to rename session "${currentName}".`;
    }
  }

  private formatMemoriesForContext(memories: MemoryItem[]): string {
    if (memories.length === 0) return '';

    return memories.map((m) => `[${m.type}] ${m.content}`).join('\n---\n');
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  }

  // Expose memory service for external access
  getMemoryService(): SimpleMemoryService {
    return this.memoryService;
  }

  // Get available tools from original agent
  getAvailableTools() {
    return this.originalAgent.getAvailableTools();
  }
}
