import { ContainerInput } from '../../../../embeddable/public';
import { CardExplicitInput } from './card_list';

export type CardContainerInput = ContainerInput<CardExplicitInput> & { columns?: number };
