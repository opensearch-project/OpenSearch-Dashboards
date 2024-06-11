/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';

import {
  EuiButton,
  EuiCallOut,
  EuiSpacer,
  EuiText,
  EuiFieldText,
  EuiModalBody,
} from '@elastic/eui';

import { TriggerContextExample } from './trigger_context_example';
import { ContextMenuExamples } from './context_menu_examples';
import { UiActionsExplorerServices } from './types';
import { HELLO_WORLD_TRIGGER_ID, ACTION_HELLO_WORLD } from '../../ui_action_examples/public';
import {
  toMountPoint,
  useOpenSearchDashboards,
} from '../../../src/plugins/opensearch_dashboards_react/public';
import { createAction } from '../../../src/plugins/ui_actions/public';

export const BasicTab = () => {
  const [name, setName] = useState('Waldo');
  const [confirmationText, setConfirmationText] = useState('');
  const {
    services: {
      uiActions,
      overlays: { openModal },
    },
  } = useOpenSearchDashboards<UiActionsExplorerServices>();

  return (
    <>
      <EuiSpacer />
      <EuiText>
        <p>
          By default there is a single action attached to the `HELLO_WORLD_TRIGGER`. Clicking this
          button will cause it to be executed immediately.
        </p>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiButton
        data-test-subj="emitHelloWorldTrigger"
        onClick={() => uiActions.executeTriggerActions(HELLO_WORLD_TRIGGER_ID, {})}
      >
        Say hello world!
      </EuiButton>

      <EuiSpacer />
      <EuiText>
        <p>
          Lets dynamically add new actions to this trigger. After you click this button, click the
          above button again. This time it should offer you multiple options to choose from. Using
          the UI Action and Trigger API makes your plugin extensible by other plugins. Any actions
          attached to the `HELLO_WORLD_TRIGGER_ID` will show up here!
        </p>
        <EuiFieldText prepend="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <EuiSpacer size="s" />

        <EuiButton
          data-test-subj="addDynamicAction"
          onClick={() => {
            const dynamicAction = createAction<typeof ACTION_HELLO_WORLD>({
              id: `${ACTION_HELLO_WORLD}-${name}`,
              type: ACTION_HELLO_WORLD,
              getDisplayName: () => `Say hello to ${name}`,
              execute: async () => {
                const overlay = openModal(
                  toMountPoint(
                    <EuiModalBody>
                      <EuiText data-test-subj="dynamicHelloWorldActionText">
                        {`Hello ${name}`}
                      </EuiText>{' '}
                      <EuiButton data-test-subj="closeModal" onClick={() => overlay.close()}>
                        Close
                      </EuiButton>
                    </EuiModalBody>
                  )
                );
              },
            });
            uiActions.addTriggerAction(HELLO_WORLD_TRIGGER_ID, dynamicAction);
            setConfirmationText(
              `You've successfully added a new action: ${dynamicAction.getDisplayName({
                trigger: uiActions.getTrigger(HELLO_WORLD_TRIGGER_ID),
              })}. Refresh the page to reset state.  It's up to the user of the system to persist state like this.`
            );
          }}
        >
          Say hello to me!
        </EuiButton>
        {confirmationText !== '' ? <EuiCallOut>{confirmationText}</EuiCallOut> : undefined}
      </EuiText>

      <EuiSpacer />

      <TriggerContextExample />

      <EuiSpacer />

      <ContextMenuExamples />
    </>
  );
};
