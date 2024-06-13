import { Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import {
  ChatProviderIdEnum,
  DelayTypeEnum,
  DigestUnitEnum,
} from '@novu/shared';

import { PlatformException } from './exceptions';

export const requireInject = (inject: RequireInject, moduleRef?: ModuleRef) => {
  if (inject === RequireInjectEnum.RESONATE) {
    return initiateResonateProvider(moduleRef);
  }
};

const initiateResonateProvider = (moduleRef: ModuleRef) => {
  try {
    if (
      process.env.NOVU_ENTERPRISE === 'true' ||
      process.env.CI_EE_TEST === 'true'
    ) {
      if (!require('@novu/ee-echo-worker')?.Resonate) {
        throw new PlatformException('Resonate provider is not loaded');
      }

      return moduleRef.get(require('@novu/ee-echo-worker')?.Resonate, {
        strict: false,
      });
    } else {
      return {
        execute: () => {
          return null;
        },
      };
    }
  } catch (e) {
    Logger.error(
      e,
      `Unexpected error while importing enterprise modules`,
      'Resonate'
    );
    throw e;
  }
};

type RequireInject = `${RequireInjectEnum}`;

enum RequireInjectEnum {
  RESONATE = 'resonate',
}

export interface IDigestResponse {
  amount: number;
  unit: DigestUnitEnum;
  type: 'regular';
  backoff: boolean;
  digestKey: string;
}

interface IDelay {
  type: DelayTypeEnum;
}

export interface IScheduledDelay extends IDelay {
  date: string;
}

export interface IRegularDelay extends IDelay {
  amount: number;
  unit: DigestUnitEnum;
}

export type IDelayOutput = IRegularDelay | IScheduledDelay;

export interface IChimeraInAppResponse {
  body: string;
}

export interface IChimeraChatResponse {
  body: string;
}

export interface IChimeraEmailResponse {
  subject: string;
  body: string;
}

export interface IChimeraPushResponse {
  subject: string;
  body: string;
}

export interface IChimeraSmsResponse {
  body: string;
}

export type IChimeraChannelResponse =
  | IChimeraInAppResponse
  | IChimeraChatResponse
  | IChimeraEmailResponse
  | IChimeraPushResponse
  | IChimeraSmsResponse;

export type IChimeraActionResponse = IDelayOutput | IDigestResponse;

export type IChimeraStepResponse =
  | IChimeraChannelResponse
  | IChimeraActionResponse;

export interface IUseCaseInterface<TInput, TResponse> {
  execute: (arg0: TInput) => TResponse;
}

export interface IUseCaseInterfaceInline {
  execute: <TInput, TResponse>(arg0: TInput) => Promise<TResponse>;
}

export type ExecuteOutputMetadata = {
  status: string;
  error: boolean;
  /**
   * The duration of the step in milliseconds
   */
  duration: number;
};

enum BlocksTypeEnum {
  SECTION = 'section',
  SECTION1 = 'header',
}

enum TextTypeEnum {
  MARKDOWN = 'mrkdwn',
}

export interface IProviderOverride {
  webhookUrl: string;
  text: string;
  blocks: IBlock[];
}

export interface IBlock {
  type: `${BlocksTypeEnum}`;
  text: {
    type: `${TextTypeEnum}`;
    text: string;
  };
}

export type IProvidersOverride = Record<ChatProviderIdEnum, IProviderOverride>;

export type ExecuteOutput<OutputResult> = {
  outputs: OutputResult;
  metadata: ExecuteOutputMetadata;
  providers?: IProvidersOverride;
};
