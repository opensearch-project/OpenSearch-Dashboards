/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback } from 'react';
import { EuiIcon, EuiLink } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';

const ASK_AI_NO_RESULTS_MESSAGE = `My query on this page returned no results. Please help me adjust it and run the corrected query on the page so I can see the data. Change only one thing at a time so it is clear which change helped, and stop as soon as results appear. Check the following in order: 1) Verify the fields I referenced actually exist. 2) Check whether the filter values are valid - a value I used may simply not exist in the data; try plausible alternative values or a broader condition. 3) Only if the fields and values both look correct, the time range is the likely cause - use a backend tool to find the most recent document matching the query, then widen the time range on page gradually rather than jumping straight to a very large window.`;

const ASK_AI_ERROR_MESSAGE =
  'My query on this page failed to run with the following error: "{error}". Please review my query, fix it, and run the corrected query on the page so I can see the results.';

interface AskErrorButtonProps {
  getError?: () => string | undefined;
  testSource: string;
}

export const AskErrorButton = ({ getError, testSource }: AskErrorButtonProps) => {
  const {
    services: { core },
  } = useOpenSearchDashboards<DiscoverViewServices>();

  const onAskAI = useCallback(() => {
    const error = getError?.();
    const message = error
      ? ASK_AI_ERROR_MESSAGE.replace('{error}', error)
      : ASK_AI_NO_RESULTS_MESSAGE;
    core.chat.sendMessageWithWindow(message, []).catch(() => {});
  }, [core, getError]);

  if (!(core?.chat?.isAvailable?.() ?? false)) {
    return null;
  }

  return (
    <EuiLink onClick={onAskAI} data-test-subj={testSource}>
      <EuiIcon type="generate" size="m" />{' '}
      {i18n.translate('discover.askErrorButton.askAI', {
        defaultMessage: 'Ask AI for help',
      })}
    </EuiLink>
  );
};
