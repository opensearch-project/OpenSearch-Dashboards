/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateGraph, START, END, Annotation } from '@langchain/langgraph';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { Logger } from '../../utils/logger';
import { ReactAgentState } from './react_agent';

// Configuration constants
const REACT_MAX_ITERATIONS = 10; // Maximum tool execution cycles before forcing final response

// Define state annotation for LangGraph
const ReactStateAnnotation = Annotation.Root({
  messages: Annotation<any[]>({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
  currentStep: Annotation<string>({
    reducer: (x, y) => y || x,
    default: () => 'processInput',
  }),
  toolCalls: Annotation<any[]>({
    reducer: (x, y) => y, // Replace instead of accumulate
    default: () => [],
  }),
  toolResults: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  iterations: Annotation<number>({
    reducer: (x, y) => y,
    default: () => 0,
  }),
  maxIterations: Annotation<number>({
    reducer: (x, y) => y || x,
    default: () => REACT_MAX_ITERATIONS,
  }),
  shouldContinue: Annotation<boolean>({
    reducer: (x, y) => y,
    default: () => true,
  }),
  streamingCallbacks: Annotation<any>({
    reducer: (x, y) => y || x,
    default: () => undefined,
  }),
  clientState: Annotation<any>({
    reducer: (x, y) => y || x,
    default: () => undefined,
  }),
  clientContext: Annotation<any[]>({
    reducer: (x, y) => y || x,
    default: () => undefined,
  }),
  clientTools: Annotation<any[]>({
    reducer: (x, y) => y || x,
    default: () => undefined,
  }),
  threadId: Annotation<string>({
    reducer: (x, y) => y || x,
    default: () => undefined,
  }),
  runId: Annotation<string>({
    reducer: (x, y) => y || x,
    default: () => undefined,
  }),
  modelId: Annotation<string>({
    reducer: (x, y) => y || x,
    default: () => undefined,
  }),
  lastToolExecution: Annotation<number>({
    reducer: (x, y) => y || x,
    default: () => undefined,
  }),
});

// Type for the state inferred from annotation
type ReactGraphState = typeof ReactStateAnnotation.State;

export class ReactGraphBuilder {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Build the LangGraph state graph with nodes and edges
   */
  buildStateGraph(
    processInputNode: (
      state: ReactAgentState
    ) => Promise<Partial<ReactAgentState> | Record<string, any>>,
    callModelNode: (
      state: ReactAgentState
    ) => Promise<Partial<ReactAgentState> | Record<string, any>>,
    executeToolsNode: (
      state: ReactAgentState
    ) => Promise<Partial<ReactAgentState> | Record<string, any>>,
    generateResponseNode: (
      state: ReactAgentState
    ) => Promise<Partial<ReactAgentState> | Record<string, any>>
  ): any {
    // Create state graph with Annotation
    const graph = new StateGraph(ReactStateAnnotation);

    // Add nodes (avoiding reserved names)
    // Cast to any to work around TypeScript strict typing with Annotation API
    graph.addNode('processInput', processInputNode as any);
    graph.addNode('callModel', callModelNode as any);
    graph.addNode('executeTools', executeToolsNode as any);
    graph.addNode('generateResponse', generateResponseNode as any);

    // Add edges
    graph.addEdge(START as '__start__', 'processInput' as '__end__');
    graph.addEdge('processInput' as '__start__', 'callModel' as '__end__');

    // Conditional edge from callModel
    graph.addConditionalEdges('callModel' as any, (state: ReactAgentState) => {
      // Log the decision for debugging
      // this.logger.info('🔄 Graph Decision: callModel -> next node', {
      //   toolCallsCount: state.toolCalls.length,
      //   hasToolCalls: state.toolCalls.length > 0,
      //   iterations: state.iterations,
      //   maxIterations: state.maxIterations,
      //   messageCount: state.messages.length,
      //   lastMessageRole: state.messages[state.messages.length - 1]?.role,
      //   nextNode: state.toolCalls.length > 0 ? "executeTools" : "generateResponse"
      // });

      if (state.toolCalls.length > 0) {
        return 'executeTools';
      }
      return 'generateResponse';
    });

    // Edge from executeTools back to callModel or to response
    graph.addConditionalEdges('executeTools' as '__start__', (state: ReactAgentState) => {
      const shouldContinue = state.iterations < state.maxIterations && state.shouldContinue;

      // Log the decision for debugging
      this.logger.info('🔄 Graph Decision: executeTools -> next node', {
        iterations: state.iterations,
        maxIterations: state.maxIterations,
        shouldContinue: state.shouldContinue,
        willContinue: shouldContinue,
        messageCount: state.messages.length,
        lastMessageRole: state.messages[state.messages.length - 1]?.role,
        hasToolResults: Object.keys(state.toolResults).length > 0,
        nextNode: shouldContinue ? 'callModel' : 'generateResponse',
      });

      if (shouldContinue) {
        return 'callModel';
      }
      return 'generateResponse';
    });

    graph.addEdge('generateResponse' as '__start__', END as '__end__');

    // Compile the graph with SQLite checkpointer for memory persistence
    // Use in-memory SQLite database (no setup required)
    const checkpointer = SqliteSaver.fromConnString(':memory:');

    return graph.compile({ checkpointer });
  }

  /**
   * Create the initial state for the graph execution
   */
  createInitialState(
    messages: any[],
    additionalInputs?: {
      state?: any;
      context?: any[];
      tools?: any[];
      threadId?: string;
      runId?: string;
      modelId?: string;
    },
    streamingCallbacks?: any
  ): ReactAgentState {
    return {
      messages, // Use the messages directly from UI
      currentStep: 'processInput',
      toolCalls: [],
      toolResults: {},
      iterations: 0,
      maxIterations: REACT_MAX_ITERATIONS,
      shouldContinue: true,
      streamingCallbacks,
      // Add client inputs to initial state
      clientState: additionalInputs?.state,
      clientContext: additionalInputs?.context,
      clientTools: additionalInputs?.tools,
      threadId: additionalInputs?.threadId,
      runId: additionalInputs?.runId,
      modelId: additionalInputs?.modelId,
    };
  }

  /**
   * Create graph configuration for stateless operation
   */
  createGraphConfig(threadId?: string, runId?: string): any {
    return {
      configurable: {
        thread_id: `${threadId || 'session'}_${runId || Date.now()}`,
      },
    };
  }
}
