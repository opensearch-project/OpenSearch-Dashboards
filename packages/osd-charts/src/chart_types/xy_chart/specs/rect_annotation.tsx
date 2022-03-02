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

import { ChartType } from '../..';
import { SpecType } from '../../../specs/constants';
import { specComponentFactory, getConnect } from '../../../state/spec_factory';
import { DEFAULT_ANNOTATION_RECT_STYLE } from '../../../utils/themes/merge_utils';
import { RectAnnotationSpec, DEFAULT_GLOBAL_ID, AnnotationType } from '../utils/specs';

const defaultProps = {
  chartType: ChartType.XYAxis,
  specType: SpecType.Annotation,
  groupId: DEFAULT_GLOBAL_ID,
  annotationType: AnnotationType.Rectangle,
  zIndex: -1,
  style: DEFAULT_ANNOTATION_RECT_STYLE,
  outside: false,
};

/** @public */
export const RectAnnotation: React.FunctionComponent<
  Pick<RectAnnotationSpec, 'id' | 'dataValues'> &
    Partial<
      Omit<
        RectAnnotationSpec,
        'chartType' | 'specType' | 'seriesType' | 'id' | 'dataValues' | 'domainType' | 'annotationType'
      >
    >
> = getConnect()(
  specComponentFactory<RectAnnotationSpec, 'groupId' | 'annotationType' | 'zIndex' | 'style'>(defaultProps),
);
