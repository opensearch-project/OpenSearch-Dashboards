/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';

import { ChartTypes } from '../..';
import { SpecTypes } from '../../../specs/constants';
import { getConnect, specComponentFactory } from '../../../state/spec_factory';
import { DEFAULT_ANNOTATION_LINE_STYLE } from '../../../utils/themes/theme';
import { LineAnnotationSpec, DEFAULT_GLOBAL_ID, AnnotationTypes } from '../utils/specs';

const defaultProps = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Annotation,
  groupId: DEFAULT_GLOBAL_ID,
  annotationType: AnnotationTypes.Line,
  style: DEFAULT_ANNOTATION_LINE_STYLE,
  hideLines: false,
  hideTooltips: false,
  hideLinesTooltips: true,
  zIndex: 1,
};

type SpecRequiredProps = Pick<LineAnnotationSpec, 'id' | 'dataValues' | 'domainType'>;
type SpecOptionalProps = Partial<
  Omit<
    LineAnnotationSpec,
    'chartType' | 'specType' | 'seriesType' | 'id' | 'dataValues' | 'domainType' | 'annotationType'
  >
>;

export const LineAnnotation: React.FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<LineAnnotationSpec, 'groupId' | 'annotationType' | 'zIndex' | 'style'>(defaultProps),
);
