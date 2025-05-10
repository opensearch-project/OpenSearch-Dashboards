/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiButtonEmpty, EuiPopover, EuiText } from '@elastic/eui';

interface RecentQuery {
  id: string;
  query: string;
}

export const RecentQueries: React.FC = () => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Mock list of recent queries
  const recentQueries: RecentQuery[] = [
    { id: '1', query: 'SELECT * FROM orders' },
    { id: '2', query: 'SELECT name, age FROM users' },
    { id: '3', query: 'SELECT COUNT(*) FROM logs' },
  ];

  const onButtonClick = () => setIsPopoverOpen(!isPopoverOpen);
  const closePopover = () => setIsPopoverOpen(false);

  return (
    <div>
      <EuiPopover
        button={
          <EuiButtonEmpty
            onClick={onButtonClick}
            iconType="clock"
            data-test-subj="recentQueriesButton"
          >
            Recent Queries
          </EuiButtonEmpty>
        }
        isOpen={isPopoverOpen}
        closePopover={closePopover}
        anchorPosition="downCenter"
      >
        <div data-test-subj="recentQueriesPopover">
          {recentQueries.length > 0 ? (
            recentQueries.map((query) => (
              <EuiButtonEmpty
                key={query.id}
                size="s"
                onClick={() => {}}
                data-test-subj={`recentQuery-${query.id}`}
              >
                {query.query}
              </EuiButtonEmpty>
            ))
          ) : (
            <EuiText size="s">
              <p>No recent queries available.</p>
            </EuiText>
          )}
        </div>
      </EuiPopover>
    </div>
  );
};
