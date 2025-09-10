/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Suggestions } from './suggestions';
import { SuggestionProps } from './suggestion';
import { AIContext } from '../../context';

const meta: Meta<typeof Suggestions> = {
  title: 'src/plugins/chat/public/components/suggestions',
  component: Suggestions,
  decorators: [
    (Story) => {
      const [isLoading, setIsLoading] = React.useState(false);
      return (
        <AIContext.Provider value={{ isLoading, setIsLoading }}>
          <div style={{ padding: '16px', backgroundColor: '#f5f5f5', maxWidth: '600px' }}>
            <Story />
          </div>
        </AIContext.Provider>
      );
    },
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Suggestions component displays a collection of clickable suggestion buttons for users to quickly send predefined queries or prompts.',
      },
    },
  },
  argTypes: {
    suggestions: { control: false },
    onSuggestionClick: { action: 'suggestion clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof Suggestions>;

// Mock suggestion data
const createSuggestionData = (
  title: string,
  message: string,
  partial?: boolean,
  className?: string
): SuggestionProps => ({
  title,
  message,
  partial,
  className,
  onClick: () => {}, // This will be overridden by the Suggestions component
});

export const Default: Story = {
  args: {
    suggestions: [
      createSuggestionData('What is OpenSearch Dashboards?', 'What is OpenSearch Dashboards?'),
      createSuggestionData('How do I create a visualization?', 'How do I create a visualization?'),
      createSuggestionData('Show me dashboard examples', 'Show me dashboard examples'),
    ],
    onSuggestionClick: (message) => console.log('Suggestion clicked:', message),
  },
};

export const EmptySuggestions: Story = {
  args: {
    suggestions: [],
    onSuggestionClick: (message) => console.log('Suggestion clicked:', message),
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty suggestions list (no suggestions to display).',
      },
    },
  },
};

export const SingleSuggestion: Story = {
  args: {
    suggestions: [
      createSuggestionData('Help me get started', 'Help me get started with OpenSearch Dashboards'),
    ],
    onSuggestionClick: (message) => console.log('Suggestion clicked:', message),
  },
  parameters: {
    docs: {
      description: {
        story: 'Single suggestion in the list.',
      },
    },
  },
};

export const ManySuggestions: Story = {
  args: {
    suggestions: [
      createSuggestionData('What is OpenSearch Dashboards?', 'What is OpenSearch Dashboards?'),
      createSuggestionData('How do I create a visualization?', 'How do I create a visualization?'),
      createSuggestionData('Show me dashboard examples', 'Show me dashboard examples'),
      createSuggestionData('Help with index patterns', 'Help with index patterns'),
      createSuggestionData('Query syntax guide', 'Query syntax guide'),
      createSuggestionData('Data source configuration', 'Data source configuration'),
      createSuggestionData('Alerting setup', 'Alerting setup'),
      createSuggestionData('Performance optimization', 'Performance optimization'),
    ],
    onSuggestionClick: (message) => console.log('Suggestion clicked:', message),
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple suggestions to test layout and wrapping.',
      },
    },
  },
};

export const MixedStates: Story = {
  args: {
    suggestions: [
      createSuggestionData('Normal suggestion', 'This is a normal suggestion'),
      createSuggestionData('Loading...', 'This suggestion is loading', true),
      createSuggestionData('Custom styled', 'Custom styled suggestion', false, 'custom-suggestion'),
      createSuggestionData('Another normal', 'Another normal suggestion'),
      createSuggestionData('Processing...', 'Processing suggestion', true),
    ],
    onSuggestionClick: (message) => console.log('Suggestion clicked:', message),
  },
  parameters: {
    docs: {
      description: {
        story: 'Mix of normal and loading suggestions to test different states.',
      },
    },
  },
};

export const LongTitles: Story = {
  args: {
    suggestions: [
      createSuggestionData(
        'How do I create a comprehensive dashboard with multiple visualizations?',
        'How do I create a comprehensive dashboard with multiple visualizations for monitoring application logs and performance metrics?'
      ),
      createSuggestionData(
        'What are the best practices for optimizing query performance?',
        'What are the best practices for optimizing query performance in OpenSearch Dashboards?'
      ),
      createSuggestionData(
        'Can you help me set up alerting for critical system events?',
        'Can you help me set up alerting for critical system events and configure notification channels?'
      ),
    ],
    onSuggestionClick: (message) => console.log('Suggestion clicked:', message),
  },
  parameters: {
    docs: {
      description: {
        story: 'Suggestions with long titles to test text wrapping and layout.',
      },
    },
  },
};

export const CategorizedSuggestions: Story = {
  render: function CategorizedSuggestionsRender() {
    const categories = {
      'Getting Started': [
        createSuggestionData('What is OpenSearch Dashboards?', 'What is OpenSearch Dashboards?'),
        createSuggestionData(
          'How do I get started?',
          'How do I get started with OpenSearch Dashboards?'
        ),
        createSuggestionData(
          'Show me the main features',
          'Show me the main features of OpenSearch Dashboards'
        ),
      ],
      Visualizations: [
        createSuggestionData('Create a bar chart', 'How do I create a bar chart visualization?'),
        createSuggestionData(
          'Build a line chart',
          'How do I build a line chart for time series data?'
        ),
        createSuggestionData('Make a pie chart', 'How do I make a pie chart visualization?'),
      ],
      Dashboards: [
        createSuggestionData('Create a dashboard', 'How do I create a new dashboard?'),
        createSuggestionData('Add visualizations', 'How do I add visualizations to my dashboard?'),
        createSuggestionData('Share dashboard', 'How do I share my dashboard with others?'),
      ],
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {Object.entries(categories).map(([category, suggestions]) => (
          <div key={category}>
            <h4
              style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold', color: '#333' }}
            >
              {category}
            </h4>
            <Suggestions
              suggestions={suggestions}
              onSuggestionClick={(message) => console.log(`${category} suggestion:`, message)}
            />
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Suggestions organized by categories for a realistic chat interface.',
      },
    },
  },
};

export const Interactive: Story = {
  render: function InteractiveRender() {
    const [selectedMessage, setSelectedMessage] = React.useState<string | null>(null);
    const [loadingSuggestion, setLoadingSuggestion] = React.useState<string | null>(null);

    const baseSuggestions = [
      'Getting started guide',
      'Create first dashboard',
      'Data visualization tips',
      'Query optimization help',
      'Index pattern setup',
      'Alerting configuration',
    ];

    const suggestions = baseSuggestions.map((title) =>
      createSuggestionData(title, `Please help me with: ${title}`, loadingSuggestion === title)
    );

    const handleSuggestionClick = (message: string) => {
      const title = message.replace('Please help me with: ', '');
      setLoadingSuggestion(title);
      setSelectedMessage(message);

      // Simulate processing
      setTimeout(() => {
        setLoadingSuggestion(null);
      }, 2000);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
            Interactive Suggestions
          </h4>
          <Suggestions suggestions={suggestions} onSuggestionClick={handleSuggestionClick} />
        </div>
        {selectedMessage && (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#e7f3ff',
              border: '1px solid #0073e6',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <strong>Selected:</strong> {selectedMessage}
            {loadingSuggestion && (
              <div style={{ marginTop: '8px', color: '#666' }}>Processing suggestion...</div>
            )}
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive suggestions with click handling and loading states.',
      },
    },
  },
};

export const WithLoadingContext: Story = {
  render: function WithLoadingContextRender() {
    const [isLoading, setIsLoading] = React.useState(false);

    const suggestions = [
      createSuggestionData('Help with dashboards', 'Help me create dashboards'),
      createSuggestionData('Visualization guide', 'Show me visualization guide'),
      createSuggestionData('Query examples', 'Give me query examples'),
      createSuggestionData('Data analysis tips', 'Share data analysis tips'),
    ];

    const handleToggleLoading = () => {
      setIsLoading(!isLoading);
    };

    return (
      <AIContext.Provider value={{ isLoading, setIsLoading }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <button
              onClick={handleToggleLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: isLoading ? '#dc3545' : '#0073e6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {isLoading ? 'Stop Loading' : 'Start Loading'}
            </button>
          </div>
          <div>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
              Suggestions (disabled when loading)
            </h4>
            <Suggestions
              suggestions={suggestions}
              onSuggestionClick={(message) => console.log('Clicked:', message)}
            />
          </div>
          {isLoading && (
            <div
              style={{
                padding: '8px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#856404',
              }}
            >
              ⚠️ All suggestions are disabled while AI is processing
            </div>
          )}
        </div>
      </AIContext.Provider>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Suggestions with AI loading context showing how all suggestions are disabled during processing.',
      },
    },
  },
};

export const RealWorldExample: Story = {
  render: function RealWorldExampleRender() {
    const [conversationStage, setConversationStage] = React.useState<
      'initial' | 'followup' | 'advanced'
    >('initial');

    const suggestionSets = {
      initial: [
        createSuggestionData(
          'What is OpenSearch Dashboards?',
          'What is OpenSearch Dashboards and what can it do?'
        ),
        createSuggestionData('Getting started guide', 'Show me a getting started guide'),
        createSuggestionData('Sample dashboards', 'Show me some sample dashboards'),
        createSuggestionData('Import sample data', 'How do I import sample data?'),
      ],
      followup: [
        createSuggestionData('Create visualization', 'How do I create my first visualization?'),
        createSuggestionData('Dashboard setup', 'Help me set up a dashboard'),
        createSuggestionData('Index patterns', 'What are index patterns and how do I use them?'),
        createSuggestionData('Query examples', 'Show me some query examples'),
      ],
      advanced: [
        createSuggestionData('Performance tuning', 'How do I optimize performance?'),
        createSuggestionData('Advanced queries', 'Show me advanced query techniques'),
        createSuggestionData('Custom plugins', 'How do I create custom plugins?'),
        createSuggestionData('API integration', 'How do I integrate with the API?'),
      ],
    };

    const handleSuggestionClick = (message: string) => {
      console.log('Selected:', message);

      // Simulate conversation progression
      if (conversationStage === 'initial') {
        setTimeout(() => setConversationStage('followup'), 1000);
      } else if (conversationStage === 'followup') {
        setTimeout(() => setConversationStage('advanced'), 1000);
      }
    };

    const stageLabels = {
      initial: 'Getting Started',
      followup: 'Next Steps',
      advanced: 'Advanced Topics',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          {Object.keys(suggestionSets).map((stage) => (
            <button
              key={stage}
              onClick={() => setConversationStage(stage as any)}
              style={{
                padding: '4px 12px',
                backgroundColor: conversationStage === stage ? '#0073e6' : '#f0f0f0',
                color: conversationStage === stage ? 'white' : '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              {stageLabels[stage as keyof typeof stageLabels]}
            </button>
          ))}
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 'bold' }}>
            {stageLabels[conversationStage]} Suggestions
          </h4>
          <Suggestions
            suggestions={suggestionSets[conversationStage]}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
        <div
          style={{
            padding: '8px',
            backgroundColor: '#e7f3ff',
            border: '1px solid #0073e6',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#333',
          }}
        >
          💡 This simulates how suggestions might change based on conversation context
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Real-world example showing how suggestions might change based on conversation context.',
      },
    },
  },
};

export const AllStates: Story = {
  render: function AllStatesRender() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Empty List</h4>
          <Suggestions
            suggestions={[]}
            onSuggestionClick={(message) => console.log('Empty clicked:', message)}
          />
          <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
            (No suggestions to display)
          </p>
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Single Suggestion</h4>
          <Suggestions
            suggestions={[createSuggestionData('Single suggestion', 'This is a single suggestion')]}
            onSuggestionClick={(message) => console.log('Single clicked:', message)}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Multiple Suggestions</h4>
          <Suggestions
            suggestions={[
              createSuggestionData('First suggestion', 'This is the first suggestion'),
              createSuggestionData('Second suggestion', 'This is the second suggestion'),
              createSuggestionData('Third suggestion', 'This is the third suggestion'),
            ]}
            onSuggestionClick={(message) => console.log('Multiple clicked:', message)}
          />
        </div>
        <div>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Mixed States</h4>
          <Suggestions
            suggestions={[
              createSuggestionData('Normal', 'Normal suggestion'),
              createSuggestionData('Loading...', 'Loading suggestion', true),
              createSuggestionData('Custom', 'Custom suggestion', false, 'custom-class'),
            ]}
            onSuggestionClick={(message) => console.log('Mixed clicked:', message)}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all suggestions component states and variations.',
      },
    },
  },
};
