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
 * under the License. */

import { AnnotationType } from '../utils/specs';
import { AnnotationLineProps } from './line/types';
import { AnnotationRectProps } from './rect/types';
import { Position, Color } from '../../../utils/commons';

export type AnnotationTooltipFormatter = (details?: string) => JSX.Element | null;

/**
 * The header and description strings for an Annotation
 * @internal
 */
export interface AnnotationDetails {
  headerText?: string;
  detailsText?: string;
}

/**
 * The marker for an Annotation. Usually a JSX element
 * @internal
 */
export interface AnnotationMarker {
  icon: JSX.Element;
  position: {
    top: number;
    left: number;
  };
  dimension: {
    width: number;
    height: number;
  };
  color: Color;
}

/** @internal */
export type AnnotationTooltipState = AnnotationTooltipVisibleState | AnnotationTooltipHiddenState;

/** @internal */
export interface AnnotationTooltipVisibleState {
  isVisible: true;
  annotationType: AnnotationType;
  header?: string;
  details?: string;
  anchor: {
    position?: Position;
    top: number;
    left: number;
  };
  renderTooltip?: AnnotationTooltipFormatter;
}

/** @internal */
export interface AnnotationTooltipHiddenState {
  isVisible: false;
}

/** @internal */
export type AnnotationDimensions = AnnotationLineProps[] | AnnotationRectProps[];

/** @internal */
export type Bounds = {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
};
