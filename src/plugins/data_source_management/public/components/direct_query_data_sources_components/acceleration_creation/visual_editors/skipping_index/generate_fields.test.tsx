/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { waitFor } from '@testing-library/dom';
import { configure, mount } from 'enzyme';
// @ts-expect-error TS7016 TODO(ts-error): fixme
import Adapter from 'enzyme-adapter-react-16';
import toJson from 'enzyme-to-json';
import React from 'react';
import { createAccelerationEmptyDataMock } from '../../../../../mocks';
import { GenerateFields } from './generate_fields';

describe('Generate fields in skipping index', () => {
  configure({ adapter: new Adapter() });

  it('Generate fields in skipping index with default options', async () => {
    const accelerationFormData = createAccelerationEmptyDataMock;
    const setAccelerationFormData = jest.fn();
    const wrapper = mount(
      // @ts-expect-error TS2739 TODO(ts-error): fixme
      <GenerateFields
        accelerationFormData={accelerationFormData}
        setAccelerationFormData={setAccelerationFormData}
        isSkippingtableLoading={false}
        setIsSkippingtableLoading={jest.fn()}
      />
    );
    wrapper.update();
    await waitFor(() => {
      expect(
        toJson(wrapper, {
          noKey: false,
          mode: 'deep',
        })
      ).toMatchSnapshot();
    });
  });
});
