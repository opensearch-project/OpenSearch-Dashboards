/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';

export interface AIContextParams {
  // // function-calling
  // actions: Record<string, FrontendAction<any>>;
  // setAction: (id: string, action: FrontendAction<any>) => void;
  // removeAction: (id: string) => void;
  //
  // // coagent actions
  // coAgentStateRenders: Record<string, CoAgentStateRender<any>>;
  // setCoAgentStateRender: (id: string, stateRender: CoAgentStateRender<any>) => void;
  // removeCoAgentStateRender: (id: string) => void;
  //
  // chatComponentsCache: React.RefObject<ChatComponentsCache>;
  //
  // getFunctionCallHandler: (
  //   customEntryPoints?: Record<string, FrontendAction<any>>,
  // ) => FunctionCallHandler;
  //
  // // text context
  // addContext: (context: string, parentId?: string, categories?: string[]) => TreeNodeId;
  // removeContext: (id: TreeNodeId) => void;
  // getAllContext: () => Tree;
  // getContextString: (documents: DocumentPointer[], categories: string[]) => string;
  //
  // // document context
  // addDocumentContext: (documentPointer: DocumentPointer, categories?: string[]) => TreeNodeId;
  // removeDocumentContext: (documentId: string) => void;
  // getDocumentsContext: (categories: string[]) => DocumentPointer[];

  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // chatSuggestionConfiguration: { [key: string]: CopilotChatSuggestionConfiguration };
  // addChatSuggestionConfiguration: (
  //   id: string,
  //   suggestion: CopilotChatSuggestionConfiguration,
  // ) => void;
  // removeChatSuggestionConfiguration: (id: string) => void;
  //
  // chatInstructions: string;
  setChatInstructions: React.Dispatch<React.SetStateAction<string>>;
  //
  additionalInstructions?: string[];
  // setAdditionalInstructions: React.Dispatch<React.SetStateAction<string[]>>;
  //
  // // api endpoints
  // copilotApiConfig: CopilotApiConfig;
  //
  // showDevConsole: boolean;
  //
  // // agents
  // coagentStates: Record<string, CoagentState>;
  // setCoagentStates: React.Dispatch<React.SetStateAction<Record<string, CoagentState>>>;
  // coagentStatesRef: React.RefObject<Record<string, CoagentState>>;
  // setCoagentStatesWithRef: (
  //   value:
  //     | Record<string, CoagentState>
  //     | ((prev: Record<string, CoagentState>) => Record<string, CoagentState>),
  // ) => void;
  //
  // agentSession: AgentSession | null;
  // setAgentSession: React.Dispatch<React.SetStateAction<AgentSession | null>>;
  //
  // agentLock: string | null;
  //
  // threadId: string;
  // setThreadId: React.Dispatch<React.SetStateAction<string>>;
  //
  // runId: string | null;
  // setRunId: React.Dispatch<React.SetStateAction<string | null>>;
  //
  // // The chat abort controller can be used to stop generation globally,
  // // i.e. when using `stop()` from `useChat`
  // chatAbortControllerRef: React.MutableRefObject<AbortController | null>;
  //
  // // runtime
  // runtimeClient: CopilotRuntimeClient;
  //
  // /**
  //  * The forwarded parameters to use for the task.
  //  */
  // forwardedParameters?: Partial<Pick<ForwardedParametersInput, "temperature">>;
  // availableAgents: Agent[];
  //
  // /**
  //  * The auth states for the CopilotKit.
  //  */
  // authStates_c?: Record<ActionName, AuthState>;
  // setAuthStates_c?: React.Dispatch<React.SetStateAction<Record<ActionName, AuthState>>>;
  //
  // /**
  //  * The auth config for the CopilotKit.
  //  */
  // authConfig_c?: {
  //   SignInComponent: React.ComponentType<{
  //     onSignInComplete: (authState: AuthState) => void;
  //   }>;
  // };
  //
  // extensions: ExtensionsInput;
  // setExtensions: React.Dispatch<React.SetStateAction<ExtensionsInput>>;
  // langGraphInterruptAction: LangGraphInterruptAction | null;
  // setLangGraphInterruptAction: LangGraphInterruptActionSetter;
  // removeLangGraphInterruptAction: () => void;
  //
  // /**
  //  * Optional trace handler for comprehensive debugging and observability.
  //  */
  // onError?: CopilotErrorHandler;
  //
  // // banner error state
  // bannerError: CopilotKitError | null;
  // TODO: Update Error type
  setBannerError: React.Dispatch<React.SetStateAction<Error | null>>;
}

const emptyAIContext: AIContextParams = {
  // actions: {},
  // setAction: () => {},
  // removeAction: () => {},
  //
  // coAgentStateRenders: {},
  // setCoAgentStateRender: () => {},
  // removeCoAgentStateRender: () => {},
  //
  // chatComponentsCache: { current: { actions: {}, coAgentStateRenders: {} } },
  // getContextString: (documents: DocumentPointer[], categories: string[]) =>
  //   returnAndThrowInDebug(""),
  // addContext: () => "",
  // removeContext: () => {},
  // getAllContext: () => [],
  //
  // getFunctionCallHandler: () => returnAndThrowInDebug(async () => {}),

  isLoading: false,
  setIsLoading: () => returnAndThrowInDebug(false),

  // chatInstructions: "",
  setChatInstructions: () => returnAndThrowInDebug(''),
  //
  // additionalInstructions: [],
  // setAdditionalInstructions: () => returnAndThrowInDebug([]),
  //
  // getDocumentsContext: (categories: string[]) => returnAndThrowInDebug([]),
  // addDocumentContext: () => returnAndThrowInDebug(""),
  // removeDocumentContext: () => {},
  // runtimeClient: {} as any,
  //
  // copilotApiConfig: new (class implements CopilotApiConfig {
  //   get chatApiEndpoint(): string {
  //     throw new Error("Remember to wrap your app in a `<CopilotKit> {...} </CopilotKit>` !!!");
  //   }
  //
  //   get headers(): Record<string, string> {
  //     return {};
  //   }
  //   get body(): Record<string, any> {
  //     return {};
  //   }
  // })(),
  //
  // chatSuggestionConfiguration: {},
  // addChatSuggestionConfiguration: () => {},
  // removeChatSuggestionConfiguration: () => {},
  // showDevConsole: false,
  // coagentStates: {},
  // setCoagentStates: () => {},
  // coagentStatesRef: { current: {} },
  // setCoagentStatesWithRef: () => {},
  // agentSession: null,
  // setAgentSession: () => {},
  // forwardedParameters: {},
  // agentLock: null,
  // threadId: "",
  // setThreadId: () => {},
  // runId: null,
  // setRunId: () => {},
  // chatAbortControllerRef: { current: null },
  // availableAgents: [],
  // extensions: {},
  // setExtensions: () => {},
  // langGraphInterruptAction: null,
  // setLangGraphInterruptAction: () => null,
  // removeLangGraphInterruptAction: () => null,
  // onError: undefined,
  // bannerError: null,
  setBannerError: () => {},
};

export const AIContext = React.createContext<AIContextParams>(emptyAIContext);

export function useAIContext(): AIContextParams {
  const context = React.useContext(AIContext);
  if (context === emptyAIContext) {
    throw new Error('Remember to wrap your app in a `<AIContext> {...} </AIContext>` !!!');
  }
  return context;
}

function returnAndThrowInDebug<T>(_value: T): T {
  throw new Error('Remember to wrap your app in a `<AIContext> {...} </AIContext>` !!!');
}
