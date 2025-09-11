# Agent Integration Design Document

## Overview
This document details the integration with the AI-Agents API, focusing on HTTP streaming, error handling, and comprehensive logging for debugging.

## AI-Agents API Specification

### Endpoint Structure
Based on the AI-Agents server implementation:

```
POST / - Main streaming endpoint (SSE)
GET /health - Health check
GET /api/info - Protocol information
GET /api/tools - Available tools
```

### Request Format
```typescript
interface RunAgentInput {
  message: string;
  conversationId?: string;
  context?: {
    automatic?: any;    // Minimal automatic context
    optional?: any[];   // User-selected contexts via @mentions
    pinned?: any[];     // Persistent pinned contexts
  };
  model?: string;       // Optional model selection
  stream?: boolean;     // Default: true for SSE
}
```

### Response Format (SSE Events)
```typescript
// SSE Event Structure
data: {"type": "event_type", "data": {...}}

// Event Types
type EventType = 
  | 'message_start'
  | 'message_delta' 
  | 'message_complete'
  | 'thinking'
  | 'tool_call'
  | 'tool_response'
  | 'error'
  | 'done';
```

## HTTP Streaming Implementation

### Server-Side SSE Client
Located in `server/chatbot/services/agent_client.ts`:

```typescript
export class AgentClient {
  private endpoint: string;
  private timeout: number;
  private debug: boolean;
  private logger: Logger;

  async streamChat(request: RunAgentInput): AsyncGenerator<StreamEvent> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new AgentError(`Agent returned ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const events = this.parseSSEBuffer(buffer);
      
      for (const event of events) {
        yield event;
      }
    }
  }

  private parseSSEBuffer(buffer: string): StreamEvent[] {
    const events: StreamEvent[] = [];
    const lines = buffer.split('\n');
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          events.push(data);
        } catch (e) {
          this.logger.warn('Failed to parse SSE event', e);
        }
      }
    }
    
    return events;
  }
}
```

### Client-Side Streaming
Located in `public/chatbot/services/streaming_client.ts`:

```typescript
export class StreamingClient {
  async *streamMessage(
    message: string,
    conversationId: string
  ): AsyncGenerator<StreamEvent> {
    const response = await fetch('/api/assistant/chatbot/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, conversationId }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Parse SSE events
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const event = JSON.parse(line.slice(6));
          yield event;
        }
      }
    }
  }
}
```

## Logging Architecture

### Log Levels and Configuration
```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class AgentLogger {
  private level: LogLevel;
  private correlationId: string;
  
  constructor(debug: boolean) {
    this.level = debug ? LogLevel.DEBUG : LogLevel.INFO;
    this.correlationId = generateId();
  }
  
  debug(message: string, data?: any) {
    if (this.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, data);
    }
  }
  
  private log(level: string, message: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      correlationId: this.correlationId,
      message,
      data: this.sanitizeData(data),
    };
    
    console.log(`[Assistant-Agent] ${JSON.stringify(entry)}`);
    
    // Also send to server logs if configured
    if (this.shouldSendToServer(level)) {
      this.sendToServer(entry);
    }
  }
  
  private sanitizeData(data: any): any {
    // Remove sensitive information
    if (!data) return data;
    
    const sanitized = { ...data };
    
    // Redact potential sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}
```

### What to Log

#### Debug Mode (assistant.chatbot.agent.debug: true)
- Full request bodies (sanitized)
- Full response bodies (sanitized)
- SSE event parsing details
- Timing information
- Connection state changes
- Retry attempts

#### Production Mode (debug: false)
- Request start/end (without body)
- Response status codes
- Error messages
- Performance metrics (response time)
- Connection failures

### Log Format Examples

```json
// Debug Mode - Request
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "DEBUG",
  "correlationId": "abc-123",
  "message": "Sending agent request",
  "data": {
    "conversationId": "conv-456",
    "messageLength": 125,
    "hasContext": true,
    "contextSize": 2048
  }
}

// Debug Mode - Streaming Event
{
  "timestamp": "2024-01-15T10:30:01Z",
  "level": "DEBUG",
  "correlationId": "abc-123",
  "message": "Received SSE event",
  "data": {
    "eventType": "message_delta",
    "contentLength": 50,
    "sequenceNumber": 3
  }
}

// Production Mode - Error
{
  "timestamp": "2024-01-15T10:30:02Z",
  "level": "ERROR",
  "correlationId": "abc-123",
  "message": "Agent request failed",
  "data": {
    "statusCode": 500,
    "errorMessage": "Internal server error",
    "retryCount": 2
  }
}
```

## Error Handling Strategies

### Error Types and Handling

```typescript
export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = false
  ) {
    super(message);
  }
}

// Specific error types
export class NetworkError extends AgentError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', true);
  }
}

export class TimeoutError extends AgentError {
  constructor(message: string) {
    super(message, 'TIMEOUT_ERROR', true);
  }
}

export class AuthenticationError extends AgentError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', false);
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
export class RetryHandler {
  private maxRetries = 3;
  private baseDelay = 1000;
  
  async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (!this.isRetryable(error) || attempt === this.maxRetries) {
          throw error;
        }
        
        const delay = this.baseDelay * Math.pow(2, attempt);
        logger.debug(`Retrying ${context} after ${delay}ms`, {
          attempt,
          error: error.message
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private isRetryable(error: any): boolean {
    if (error instanceof AgentError) {
      return error.retryable;
    }
    
    // Network errors are generally retryable
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // 5xx errors are retryable, 4xx are not
    if (error.statusCode >= 500) {
      return true;
    }
    
    return false;
  }
}
```

## Connection Management

### Health Check Implementation

```typescript
export class AgentHealthMonitor {
  private healthCheckInterval = 30000; // 30 seconds
  private isHealthy = true;
  
  startMonitoring() {
    setInterval(async () => {
      try {
        const response = await fetch(`${this.endpoint}/health`);
        this.isHealthy = response.ok;
        
        if (!response.ok) {
          logger.warn('Agent health check failed', {
            status: response.status
          });
        }
      } catch (error) {
        this.isHealthy = false;
        logger.error('Agent health check error', error);
      }
    }, this.healthCheckInterval);
  }
  
  getStatus(): 'healthy' | 'unhealthy' | 'unknown' {
    return this.isHealthy ? 'healthy' : 'unhealthy';
  }
}
```

### Graceful Degradation

When the agent is unavailable:
1. Show clear status indicator in UI
2. Disable chat input with informative message
3. Cache messages locally for retry when available
4. Provide fallback suggestions or help content

## Performance Monitoring

### Metrics to Track

```typescript
interface PerformanceMetrics {
  requestStartTime: number;
  firstByteTime: number;
  streamStartTime: number;
  streamEndTime: number;
  totalBytes: number;
  eventCount: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  
  startRequest(correlationId: string) {
    this.metrics.set(correlationId, {
      requestStartTime: Date.now(),
      firstByteTime: 0,
      streamStartTime: 0,
      streamEndTime: 0,
      totalBytes: 0,
      eventCount: 0,
    });
  }
  
  recordFirstByte(correlationId: string) {
    const metric = this.metrics.get(correlationId);
    if (metric && !metric.firstByteTime) {
      metric.firstByteTime = Date.now();
      
      const ttfb = metric.firstByteTime - metric.requestStartTime;
      logger.info('Time to first byte', { ttfb, correlationId });
    }
  }
  
  getMetrics(correlationId: string): PerformanceMetrics | undefined {
    return this.metrics.get(correlationId);
  }
}
```

## Security Considerations

### Input Validation

```typescript
export class InputValidator {
  validateMessage(message: string): void {
    // Check message length
    if (message.length > 10000) {
      throw new Error('Message too long');
    }
    
    // Check for injection attempts
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(message)) {
        throw new Error('Invalid message content');
      }
    }
  }
  
  sanitizeContext(context: any): any {
    // Remove any executable code
    return JSON.parse(JSON.stringify(context));
  }
}
```

### Rate Limiting

```typescript
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests = 10;
  private windowMs = 60000; // 1 minute
  
  checkLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // Remove old requests outside window
    const validRequests = userRequests.filter(
      time => now - time < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(userId, validRequests);
    
    return true;
  }
}
```

## Testing Strategy

### Mock SSE Server for Testing

```typescript
export class MockAgentServer {
  async handleRequest(request: RunAgentInput): Response {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'message_start',
            data: { conversationId: request.conversationId }
          })}\n\n`)
        );
        
        // Simulate streaming response
        const words = 'This is a mock response'.split(' ');
        for (const word of words) {
          await sleep(100);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'message_delta',
              data: { content: word + ' ' }
            })}\n\n`)
          );
        }
        
        // Send completion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            type: 'message_complete',
            data: { }
          })}\n\n`)
        );
        
        controller.close();
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      }
    });
  }
}
```

## Debugging Workflow

### Development Tools

1. **Browser DevTools Integration**
   - Custom formatter for SSE events
   - Network tab shows streaming responses
   - Console shows structured logs

2. **Debug Panel in UI**
   - Show/hide with keyboard shortcut (Ctrl+Shift+D)
   - Display current connection status
   - Show recent events and timings
   - Export debug logs

3. **Correlation ID Tracking**
   - Generated for each conversation
   - Passed through all layers
   - Enables end-to-end tracing