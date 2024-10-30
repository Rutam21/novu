import { ActionStepEnum, actionStepSchemas, ChannelStepEnum, channelStepSchemas } from '@novu/framework/internal';
import { JSONSchema } from 'json-schema-to-ts';
import { UiSchema } from '@novu/shared';
import { EmailStepControlSchema, EmailStepUiSchema, inAppControlSchema, InAppUiSchema } from './schemas';

export const PERMISSIVE_EMPTY_SCHEMA = {
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: true,
} as const;

export const mapStepTypeToControlSchema: Record<
  ChannelStepEnum | ActionStepEnum,
  {
    dataSchema?: JSONSchema;
    uiSchema?: UiSchema;
  }
> = {
  [ChannelStepEnum.IN_APP]: {
    dataSchema: inAppControlSchema,
    uiSchema: InAppUiSchema,
  },
  [ChannelStepEnum.EMAIL]: {
    dataSchema: EmailStepControlSchema,
    uiSchema: EmailStepUiSchema,
  },
  [ChannelStepEnum.SMS]: {
    dataSchema: channelStepSchemas[ChannelStepEnum.SMS].output,
  },
  [ChannelStepEnum.PUSH]: {
    dataSchema: channelStepSchemas[ChannelStepEnum.PUSH].output,
  },
  [ChannelStepEnum.CHAT]: {
    dataSchema: channelStepSchemas[ChannelStepEnum.CHAT].output,
  },

  [ActionStepEnum.DELAY]: {
    dataSchema: actionStepSchemas[ActionStepEnum.DELAY].output,
  },
  [ActionStepEnum.DIGEST]: {
    dataSchema: actionStepSchemas[ActionStepEnum.DIGEST].output,
  },
  [ActionStepEnum.CUSTOM]: {
    dataSchema: PERMISSIVE_EMPTY_SCHEMA,
  },
};
