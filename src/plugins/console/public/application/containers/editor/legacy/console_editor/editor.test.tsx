/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import './editor.test.mock';

import React from 'react';
import { mount } from 'enzyme';
import { I18nProvider } from '@osd/i18n/react';
import { act } from 'react-dom/test-utils';
import * as sinon from 'sinon';

import { serviceContextMock } from '../../../../contexts/services_context.mock';

import { nextTick } from 'test_utils/enzyme_helpers';
import {
  ServicesContextProvider,
  EditorContextProvider,
  RequestContextProvider,
  ContextValue,
} from '../../../../contexts';

// Mocked functions
import { sendRequestToOpenSearch } from '../../../../hooks/use_send_current_request_to_opensearch/send_request_to_opensearch';
import { getEndpointFromPosition } from '../../../../../lib/autocomplete/get_endpoint_from_position';

import * as consoleMenuActions from '../console_menu_actions';
import { Editor } from './editor';

describe('Legacy (Ace) Console Editor Component Smoke Test with dataSourceId', () => {
  let mockedAppContextValue: ContextValue;
  const sandbox = sinon.createSandbox();

  const doMount = () =>
    mount(
      <I18nProvider>
        <ServicesContextProvider value={mockedAppContextValue}>
          <RequestContextProvider>
            <EditorContextProvider settings={{} as any}>
              <Editor initialTextValue="" dataSourceId="Some dataSource Id" />
            </EditorContextProvider>
          </RequestContextProvider>
        </ServicesContextProvider>
      </I18nProvider>
    );

  beforeEach(() => {
    document.queryCommandSupported = sinon.fake(() => true);
    mockedAppContextValue = serviceContextMock.create();
  });

  afterEach(() => {
    jest.clearAllMocks();
    sandbox.restore();
  });

  it('calls send current request to OpenSearch', async () => {
    (getEndpointFromPosition as jest.Mock).mockReturnValue({ patterns: [] });
    (sendRequestToOpenSearch as jest.Mock).mockRejectedValue({});
    const editor = doMount();
    act(() => {
      editor.find('[data-test-subj~="sendRequestButton"]').simulate('click');
    });
    await nextTick();
    expect(sendRequestToOpenSearch).toBeCalledTimes(1);
  });

  it('opens docs', () => {
    const stub = sandbox.stub(consoleMenuActions, 'getDocumentation');
    const editor = doMount();
    const consoleMenuToggle = editor.find('[data-test-subj~="toggleConsoleMenu"]').last();
    consoleMenuToggle.simulate('click');

    const docsButton = editor.find('[data-test-subj~="consoleMenuOpenDocs"]').last();
    docsButton.simulate('click');

    expect(stub.callCount).toBe(1);
  });

  it('prompts auto-indent', () => {
    const stub = sandbox.stub(consoleMenuActions, 'autoIndent');
    const editor = doMount();
    const consoleMenuToggle = editor.find('[data-test-subj~="toggleConsoleMenu"]').last();
    consoleMenuToggle.simulate('click');

    const autoIndentButton = editor.find('[data-test-subj~="consoleMenuAutoIndent"]').last();
    autoIndentButton.simulate('click');

    expect(stub.callCount).toBe(1);
  });
});

describe('Legacy (Ace) Console Editor Component Smoke Test with empty dataSourceId (Local Cluster)', () => {
  let mockedAppContextValue: ContextValue;
  const sandbox = sinon.createSandbox();

  const doMount = () =>
    mount(
      <I18nProvider>
        <ServicesContextProvider value={mockedAppContextValue}>
          <RequestContextProvider>
            <EditorContextProvider settings={{} as any}>
              <Editor initialTextValue="" dataSourceId="" />
            </EditorContextProvider>
          </RequestContextProvider>
        </ServicesContextProvider>
      </I18nProvider>
    );

  beforeEach(() => {
    document.queryCommandSupported = sinon.fake(() => true);
    mockedAppContextValue = serviceContextMock.create();
  });

  afterEach(() => {
    jest.clearAllMocks();
    sandbox.restore();
  });

  it('calls send current request to OpenSearch', async () => {
    (getEndpointFromPosition as jest.Mock).mockReturnValue({ patterns: [] });
    (sendRequestToOpenSearch as jest.Mock).mockRejectedValue({});
    const editor = doMount();
    act(() => {
      editor.find('[data-test-subj~="sendRequestButton"]').simulate('click');
    });
    await nextTick();
    expect(sendRequestToOpenSearch).toBeCalledTimes(1);
  });

  it('opens docs', () => {
    const stub = sandbox.stub(consoleMenuActions, 'getDocumentation');
    const editor = doMount();
    const consoleMenuToggle = editor.find('[data-test-subj~="toggleConsoleMenu"]').last();
    consoleMenuToggle.simulate('click');

    const docsButton = editor.find('[data-test-subj~="consoleMenuOpenDocs"]').last();
    docsButton.simulate('click');

    expect(stub.callCount).toBe(1);
  });

  it('prompts auto-indent', () => {
    const stub = sandbox.stub(consoleMenuActions, 'autoIndent');
    const editor = doMount();
    const consoleMenuToggle = editor.find('[data-test-subj~="toggleConsoleMenu"]').last();
    consoleMenuToggle.simulate('click');

    const autoIndentButton = editor.find('[data-test-subj~="consoleMenuAutoIndent"]').last();
    autoIndentButton.simulate('click');

    expect(stub.callCount).toBe(1);
  });
});

describe('Legacy (Ace) Console Editor Component Smoke Test with dataSouceId undefined', () => {
  let mockedAppContextValue: ContextValue;
  const sandbox = sinon.createSandbox();

  const doMount = () =>
    mount(
      <I18nProvider>
        <ServicesContextProvider value={mockedAppContextValue}>
          <RequestContextProvider>
            <EditorContextProvider settings={{} as any}>
              <Editor initialTextValue="" />
            </EditorContextProvider>
          </RequestContextProvider>
        </ServicesContextProvider>
      </I18nProvider>
    );

  beforeEach(() => {
    document.queryCommandSupported = sinon.fake(() => true);
    mockedAppContextValue = serviceContextMock.create();
  });

  afterEach(() => {
    jest.clearAllMocks();
    sandbox.restore();
  });

  it('diasbles send request button', async () => {
    (getEndpointFromPosition as jest.Mock).mockReturnValue({ patterns: [] });
    (sendRequestToOpenSearch as jest.Mock).mockRejectedValue({});
    const editor = doMount();
    expect(editor.find('[data-test-subj~="sendRequestButton"]').get(0).props.disabled);
  });

  it('not able to send current request to OpenSearch', async () => {
    (getEndpointFromPosition as jest.Mock).mockReturnValue({ patterns: [] });
    (sendRequestToOpenSearch as jest.Mock).mockRejectedValue({});
    const editor = doMount();
    act(() => {
      editor.find('[data-test-subj~="sendRequestButton"]').simulate('click');
    });
    await nextTick();
    expect(sendRequestToOpenSearch).toBeCalledTimes(0);
  });

  it('opens docs', () => {
    const stub = sandbox.stub(consoleMenuActions, 'getDocumentation');
    const editor = doMount();
    const consoleMenuToggle = editor.find('[data-test-subj~="toggleConsoleMenu"]').last();
    consoleMenuToggle.simulate('click');

    const docsButton = editor.find('[data-test-subj~="consoleMenuOpenDocs"]').last();
    docsButton.simulate('click');

    expect(stub.callCount).toBe(1);
  });

  it('prompts auto-indent', () => {
    const stub = sandbox.stub(consoleMenuActions, 'autoIndent');
    const editor = doMount();
    const consoleMenuToggle = editor.find('[data-test-subj~="toggleConsoleMenu"]').last();
    consoleMenuToggle.simulate('click');

    const autoIndentButton = editor.find('[data-test-subj~="consoleMenuAutoIndent"]').last();
    autoIndentButton.simulate('click');

    expect(stub.callCount).toBe(1);
  });
});
