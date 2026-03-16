/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure, mount, shallow } from 'enzyme';
import Adapter from '@cfaester/enzyme-adapter-react-18';
import React from 'react';
import { waitFor } from '@testing-library/react';
import moment from 'moment';
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

  beforeEach(() => {
    // Mock Date to have consistent snapshot results for date picker
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-22T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Renders the index form as expected', async () => {
    const wrapper = shallow(
      // @ts-expect-error TS2741 TODO(ts-error): fixme
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
      // @ts-expect-error TS2741 TODO(ts-error): fixme
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
      // @ts-expect-error TS2741 TODO(ts-error): fixme
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
      // @ts-expect-error TS2741 TODO(ts-error): fixme
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
      // @ts-expect-error TS2741 TODO(ts-error): fixme
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

  describe('Initial Data Range functionality', () => {
    it('should toggle no limit switch and call updateConfig with refreshRangeDays 0', async () => {
      const mockUpdateConfig = jest.fn();
      const wrapper = mount(
        <IntegrationQueryInputs
          config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3', refreshRangeDays: 7 }}
          updateConfig={mockUpdateConfig}
          integration={TEST_INTEGRATION_CONFIG}
        />
      );

      // Find and trigger the switch onChange to enable "no limit"
      const switchComponent = wrapper.find('EuiSwitch');
      expect(switchComponent.exists()).toBe(true);
      const onChangeHandler = (switchComponent.prop('onChange') as unknown) as (e: {
        target: { checked: boolean };
      }) => void;
      onChangeHandler({ target: { checked: true } });

      await waitFor(() => {
        expect(mockUpdateConfig).toHaveBeenCalledWith({ refreshRangeDays: 0 });
      });
    });

    it('should toggle no limit switch off and call updateConfig with refreshRangeDays 7', async () => {
      const mockUpdateConfig = jest.fn();
      const wrapper = mount(
        <IntegrationQueryInputs
          config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3', refreshRangeDays: 0 }}
          updateConfig={mockUpdateConfig}
          integration={TEST_INTEGRATION_CONFIG}
        />
      );

      // Find and trigger the switch onChange to disable "no limit"
      const switchComponent = wrapper.find('EuiSwitch');
      expect(switchComponent.exists()).toBe(true);
      const onChangeHandler = (switchComponent.prop('onChange') as unknown) as (e: {
        target: { checked: boolean };
      }) => void;
      onChangeHandler({ target: { checked: false } });

      await waitFor(() => {
        expect(mockUpdateConfig).toHaveBeenCalledWith({ refreshRangeDays: 7 });
      });
    });

    it('should not render date picker when refreshRangeDays is 0', async () => {
      const wrapper = mount(
        <IntegrationQueryInputs
          config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3', refreshRangeDays: 0 }}
          updateConfig={() => {}}
          integration={TEST_INTEGRATION_CONFIG}
        />
      );

      await waitFor(() => {
        expect(wrapper.find('EuiDatePicker').exists()).toBe(false);
      });
    });

    it('should render date picker when refreshRangeDays is greater than 0', async () => {
      const wrapper = mount(
        <IntegrationQueryInputs
          config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3', refreshRangeDays: 7 }}
          updateConfig={() => {}}
          integration={TEST_INTEGRATION_CONFIG}
        />
      );

      await waitFor(() => {
        expect(wrapper.find('EuiDatePicker').exists()).toBe(true);
      });
    });

    it('should call updateConfig when date is changed', async () => {
      const mockUpdateConfig = jest.fn();
      const wrapper = mount(
        <IntegrationQueryInputs
          config={{ ...TEST_INTEGRATION_SETUP_INPUTS, connectionType: 's3', refreshRangeDays: 7 }}
          updateConfig={mockUpdateConfig}
          integration={TEST_INTEGRATION_CONFIG}
        />
      );

      // Find the date picker and simulate a date change
      const datePicker = wrapper.find('EuiDatePicker');
      expect(datePicker.exists()).toBe(true);

      // Simulate selecting a date 14 days ago by calling the onChange prop directly
      const selectedDate = moment().subtract(14, 'days');
      const onChangeHandler = (datePicker.prop('onChange') as unknown) as (
        date: moment.Moment | null
      ) => void;
      onChangeHandler(selectedDate);

      await waitFor(() => {
        expect(mockUpdateConfig).toHaveBeenCalledWith({ refreshRangeDays: 14 });
      });
    });
  });
});
