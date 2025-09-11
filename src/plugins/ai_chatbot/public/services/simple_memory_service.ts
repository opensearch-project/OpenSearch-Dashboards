/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * Simple Memory Service for Demo
 * Uses in-memory storage for quick implementation
 */

export interface MemoryItem {
  id: string;
  content: string;
  timestamp: string;
  context: any;
  type: 'user_query' | 'assistant_response';
}

export interface MemorySession {
  sessionId: string;
  name?: string;
  memories: MemoryItem[];
  createdAt: string;
}

export class SimpleMemoryService {
  private sessions: Map<string, MemorySession> = new Map(); // Saved memories only
  private currentSessionId: string;
  private currentChatHistory: MemoryItem[] = []; // Current session chat history (not saved)
  private readonly STORAGE_KEY = 'ai_assistant_memories';

  constructor() {
    this.loadFromStorage(); // Load existing memories from persistent storage
    this.currentSessionId = this.generateRandomSessionId();
    this.createSession(this.currentSessionId);
  }

  // Load memories from localStorage (persistent across page navigation)
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.sessions = new Map(Object.entries(data.sessions || {}));
        console.log(`💾 Loaded ${this.sessions.size} memory sessions from storage`);
      }
    } catch (error) {
      console.error('❌ Failed to load memories from storage:', error);
    }
  }

  // Save memories to localStorage (persistent across page navigation)
  private saveToStorage(): void {
    try {
      const data = {
        sessions: Object.fromEntries(this.sessions.entries()),
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      console.log(`💾 Saved ${this.sessions.size} memory sessions to storage`);
    } catch (error) {
      console.error('❌ Failed to save memories to storage:', error);
    }
  }

  private generateRandomSessionId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `session_${timestamp}_${random}`;
  }

  createSession(sessionId?: string, name?: string): string {
    const id = sessionId || this.generateRandomSessionId();
    const session: MemorySession = {
      sessionId: id,
      name,
      memories: [],
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(id, session);
    this.currentSessionId = id;
    this.saveToStorage(); // Persist to storage

    console.log(`🧠 Created memory session: ${id}`);
    return id;
  }

  // Add to chat history (temporary, current session only)
  addToChatHistory(userQuery: string, assistantResponse: string, context: any): void {
    const timestamp = new Date().toISOString();

    // Add to current chat history (not saved memory)
    this.currentChatHistory.push({
      id: `chat_${Date.now()}_user`,
      content: userQuery,
      timestamp,
      context,
      type: 'user_query',
    });

    this.currentChatHistory.push({
      id: `chat_${Date.now()}_assistant`,
      content: assistantResponse,
      timestamp,
      context,
      type: 'assistant_response',
    });

    console.log(`💬 Added to chat history (not saved to memory)`);
  }

  // Save current chat history to memory (only when user clicks save)
  async saveCurrentChatToMemory(): Promise<void> {
    const session = this.sessions.get(this.currentSessionId);
    if (!session) return;

    if (this.currentChatHistory.length === 0) {
      console.log('💾 No chat history to save');
      return;
    }

    // Move current chat history to saved memory
    session.memories.push(...this.currentChatHistory);
    this.saveToStorage(); // Persist to storage

    console.log(
      `💾 Saved ${this.currentChatHistory.length} chat items to memory session: ${this.currentSessionId}`
    );

    // Clear chat history after saving (optional - or keep it for continued conversation)
    // this.currentChatHistory = [];
  }

  listAllMemories(): MemorySession[] {
    return Array.from(this.sessions.values());
  }

  loadMemory(sessionId: string): MemorySession | null {
    return this.sessions.get(sessionId) || null;
  }

  searchMemories(query: string, limit: number = 5): MemoryItem[] {
    const allMemories: MemoryItem[] = [];

    // Collect all memories from all sessions
    for (const session of this.sessions.values()) {
      allMemories.push(...session.memories);
    }

    // Simple text-based search (for demo)
    const searchResults = allMemories
      .filter((memory) => memory.content.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    console.log(`🔍 Found ${searchResults.length} memories for query: "${query}"`);
    return searchResults;
  }

  // Get current chat history (temporary, not saved)
  getCurrentChatHistory(): MemoryItem[] {
    return this.currentChatHistory;
  }

  // Get saved memories for current session
  getCurrentSessionMemories(): MemoryItem[] {
    const session = this.sessions.get(this.currentSessionId);
    return session ? session.memories : [];
  }

  switchToSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      // Clear current chat history when switching sessions
      this.currentChatHistory = [];
      this.currentSessionId = sessionId;
      console.log(`🔄 Switched to memory session: ${sessionId}`);
      return true;
    }
    return false;
  }

  deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      this.saveToStorage(); // Persist to storage
      if (sessionId === this.currentSessionId) {
        // Create new session if we deleted the current one
        this.currentSessionId = this.createSession();
      }
    }
    console.log(`🗑️ Deleted session: ${sessionId}`);
    return deleted;
  }

  renameSession(sessionId: string, newName: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.name = newName;
    this.saveToStorage(); // Persist to storage
    console.log(`✏️ Renamed session ${sessionId} to: ${newName}`);
    return true;
  }

  deleteAllMemories(): boolean {
    try {
      const sessionCount = this.sessions.size;

      // Keep current session but clear its saved memories
      const currentSession = this.sessions.get(this.currentSessionId);

      // Clear all sessions
      this.sessions.clear();

      // Restore current session but with empty memories (preserve chat history)
      if (currentSession) {
        currentSession.memories = []; // Clear saved memories but keep session structure
        this.sessions.set(this.currentSessionId, currentSession);
      } else {
        // Create new session if current session doesn't exist
        this.createSession(this.currentSessionId);
      }

      // Keep current chat history (don't clear it - user might want to save it)
      // this.currentChatHistory = []; // Commented out to preserve current work

      // Update localStorage with only current session
      this.saveToStorage();

      console.log(
        `🗑️ Deleted all memories: ${sessionCount - 1} sessions cleared, current session preserved`
      );
      return true;
    } catch (error) {
      console.error('❌ Failed to delete all memories:', error);
      return false;
    }
  }

  getSessionDetails(sessionId: string): MemorySession | null {
    return this.sessions.get(sessionId) || null;
  }

  getAllSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  getCurrentSessionId(): string {
    return this.currentSessionId;
  }

  getSessionSummary(): string {
    const session = this.sessions.get(this.currentSessionId);
    if (!session) return 'No active session';

    const savedMemoryCount = session.memories.length;
    const savedUserQueries = session.memories.filter((m) => m.type === 'user_query').length;
    const chatHistoryCount = this.currentChatHistory.length;
    const chatUserQueries = this.currentChatHistory.filter((m) => m.type === 'user_query').length;

    return `Session: ${
      session.name || session.sessionId
    } | ${savedUserQueries} saved conversations | ${savedMemoryCount} saved memories | ${chatUserQueries} current chat`;
  }
}
