/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart } from '../../../core/public';
import { AIChatbotStartDependencies } from './types';
import { Chatbot } from './components/chatbot';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
  EuiFieldText,
  EuiButton,
  EuiFormRow,
  EuiCallOut,
  EuiText,
} from '@elastic/eui';

interface AppProps {
  core: CoreStart;
  plugins: AIChatbotStartDependencies;
}

function App({ core, plugins }: AppProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);

  const handleSetApiKey = () => {
    if (apiKey.trim()) {
      setIsApiKeySet(true);
      // Store in session storage for this session only
      sessionStorage.setItem('claude-api-key', apiKey);
    }
  };

  // Try to get API key from session storage
  React.useEffect(() => {
    const storedKey = sessionStorage.getItem('claude-api-key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsApiKeySet(true);
    }
  }, []);

  if (!isApiKeySet) {
    return (
      <EuiPage>
        <EuiPageBody>
          <EuiPageContent>
            <EuiPageContentBody>
              <EuiPanel paddingSize="l">
                <EuiTitle>
                  <h1>🤖 OpenSearch Dashboards AI Assistant</h1>
                </EuiTitle>
                <EuiSpacer />
                
                <EuiCallOut
                  title="Welcome to the AI Assistant!"
                  color="primary"
                  iconType="iInCircle"
                >
                  <p>
                    This AI assistant can help you understand your dashboards and interact with your data.
                    It integrates with our Context Provider to understand what you're currently viewing.
                  </p>
                </EuiCallOut>
                
                <EuiSpacer />
                
                <EuiText>
                  <h3>Features:</h3>
                  <ul>
                    <li>🔍 Understands your current dashboard context</li>
                    <li>🎛️ Can add filters to your views</li>
                    <li>📊 Can expand dashboard panels</li>
                    <li>📄 Can expand documents in explore views</li>
                    <li>💬 Natural language interaction</li>
                  </ul>
                </EuiText>
                
                <EuiSpacer />
                
                <EuiFormRow
                  label="Claude API Key"
                  helpText="Enter your Claude API key to start using the AI assistant. This will be stored only for this session."
                >
                  <EuiFieldText
                    placeholder="sk-ant-api03-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    type="password"
                  />
                </EuiFormRow>
                
                <EuiSpacer />
                
                <EuiButton
                  fill
                  onClick={handleSetApiKey}
                  disabled={!apiKey.trim()}
                >
                  Start AI Assistant
                </EuiButton>
                
                <EuiSpacer />
                
                <EuiCallOut
                  title="Context Provider Integration"
                  color={plugins.contextProvider ? "success" : "warning"}
                  iconType={plugins.contextProvider ? "check" : "alert"}
                  size="s"
                >
                  <p>
                    Context Provider: {plugins.contextProvider ? "✅ Available" : "❌ Not Available"}
                    <br />
                    UI Actions: {plugins.uiActions ? "✅ Available" : "❌ Not Available"}
                  </p>
                </EuiCallOut>
              </EuiPanel>
            </EuiPageContentBody>
          </EuiPageContent>
        </EuiPageBody>
      </EuiPage>
    );
  }

  return <Chatbot apiKey={apiKey} />;
}

export function renderApp(
  { element }: AppMountParameters,
  core: CoreStart,
  plugins: AIChatbotStartDependencies
) {
  ReactDOM.render(<App core={core} plugins={plugins} />, element);

  return () => {
    ReactDOM.unmountComponentAtNode(element);
  };
}