/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { CreateButton } from './create_button';
import { scopedHistoryMock } from '../../../../../core/public/mocks';
import { ScopedHistory } from 'opensearch-dashboards/public';

const createButtonIdentifier = `[data-test-subj="createDataSourceButton"]`;

describe('CreateButton', () => {
  const history = (scopedHistoryMock.create() as unknown) as ScopedHistory;
  const dataTestSubj = 'createDataSourceButton';
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;

  beforeEach(() => {
    component = shallow(<CreateButton history={history} dataTestSubj={dataTestSubj} />);
  });

  it('should render normally', () => {
    expect(component).toMatchSnapshot();
  });

  it('should click event normally', () => {
    component.find(createButtonIdentifier).first().simulate('click');

    expect(history.push).toBeCalledWith('/create');
  });
});
