import { RectAnnotationSpec, DEFAULT_GLOBAL_ID, AnnotationTypes } from '../utils/specs';
import { specComponentFactory, getConnect } from '../../../state/spec_factory';
import { DEFAULT_ANNOTATION_RECT_STYLE } from '../../../utils/themes/theme';
import { ChartTypes } from '../../index';
import { SpecTypes } from '../../../specs/settings';

const defaultProps = {
  chartType: ChartTypes.XYAxis,
  specType: SpecTypes.Annotation,
  groupId: DEFAULT_GLOBAL_ID,
  annotationType: AnnotationTypes.Rectangle,
  zIndex: -1,
  style: DEFAULT_ANNOTATION_RECT_STYLE,
};

type SpecRequiredProps = Pick<RectAnnotationSpec, 'id' | 'dataValues'>;
type SpecOptionalProps = Partial<
  Omit<
    RectAnnotationSpec,
    'chartType' | 'specType' | 'seriesType' | 'id' | 'dataValues' | 'domainType' | 'annotationType'
  >
>;
export const RectAnnotation: React.FunctionComponent<SpecRequiredProps & SpecOptionalProps> = getConnect()(
  specComponentFactory<RectAnnotationSpec, 'groupId' | 'annotationType' | 'zIndex' | 'style'>(defaultProps),
);
