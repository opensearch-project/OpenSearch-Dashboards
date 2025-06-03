/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure, mount, shallow } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { waitFor } from '@testing-library/react';
import {
  IntegrationConnectionInputs,
  IntegrationDetailsInputs,
  IntegrationQueryInputs,
  IntegrationWorkflowsInputs,
  SetupIntegrationFormInputs,
} from './setup_integration_inputs';
import { TEST_INTEGRATION_CONFIG, TEST_INTEGRATION_SETUP_INPUTS } from '../../../mocks';

describe('Integration Setup Inputs', () => {
  configure({ adapter: new Adapter() });

  it('Renders the index form as expected', async () => {
    const wrapper = shallow(
      <SetupIntegrationFormInputs
        config={TEST_INTEGRATION_SETUP_INPUTS}
        updateConfig={() => {}}
        integration={TEST_INTEGRATION_CONFIG}
        setupCallout={{ show: false }}
      />
    );

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('Renders the S3 connector form as expected', async () => {
    const wrapper = shallow(
      <SetupIntegrationFormInputs
        config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3' }}
        updateConfig={() => {}}
        integration={TEST_INTEGRATION_CONFIG}
        setupCallout={{ show: false }}
      />
    );

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('Renders the S3 connector form without workflows', async () => {
    const wrapper = shallow(
      <SetupIntegrationFormInputs
        config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3' }}
        updateConfig={() => {}}
        integration={TEST_INTEGRATION_CONFIG}
        setupCallout={{ show: false }}
      />
    );

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('Renders the details inputs', async () => {
    const wrapper = mount(
      <IntegrationDetailsInputs
        config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3' }}
        updateConfig={() => {}}
        integration={TEST_INTEGRATION_CONFIG}
      />
    );

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('Renders the connection inputs', async () => {
    const wrapper = mount(
      <IntegrationConnectionInputs
        config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3' }}
        updateConfig={() => {}}
        integration={TEST_INTEGRATION_CONFIG}
      />
    );

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('Renders the connection inputs with a locked connection type', async () => {
    const wrapper = mount(
      <IntegrationConnectionInputs
        config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3' }}
        updateConfig={() => {}}
        integration={TEST_INTEGRATION_CONFIG}
        lockConnectionType={true}
      />
    );

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('Renders the query inputs', async () => {
    const wrapper = mount(
      <IntegrationQueryInputs
        config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3' }}
        updateConfig={() => {}}
        integration={TEST_INTEGRATION_CONFIG}
      />
    );

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });

  it('Renders the workflows inputs', async () => {
    const wrapper = mount(
      <IntegrationWorkflowsInputs updateConfig={() => {}} integration={TEST_INTEGRATION_CONFIG} />
    );

    await waitFor(() => {
      expect(wrapper).toMatchSnapshot();
    });
  });
});
