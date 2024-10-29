import { Injectable } from '@nestjs/common';
import {
  ChannelTypeEnum,
  ControlPreviewIssue,
  ControlPreviewIssueTypeEnum,
  ControlsSchema,
  GeneratePreviewResponseDto,
  JSONSchemaDto,
  StepTypeEnum,
  WorkflowOriginEnum,
} from '@novu/shared';
import { merge } from 'lodash/fp';
import _ = require('lodash');
import { GeneratePreviewCommand } from './generate-preview-command';
import { PreviewStep, PreviewStepCommand } from '../../../bridge/usecases/preview-step';
import { GetWorkflowUseCase } from '../get-workflow/get-workflow.usecase';
import { StepNotFoundException } from '../../exceptions/step-not-found-exception';
import { ExtractDefaultsUsecase } from '../get-default-values-from-schema/extract-defaults.usecase';
import { ConstructPayloadFromPlaceholdersWithDefaultsUseCase } from './construct-payload-from-placeholders-with-defaults-use-case.service';

@Injectable()
export class GeneratePreviewUsecase {
  constructor(
    private legacyPreviewStepUseCase: PreviewStep,
    private getWorkflowUseCase: GetWorkflowUseCase,
    private extractDefaultsUseCase: ExtractDefaultsUsecase,
    private constructPayloadUseCase: ConstructPayloadFromPlaceholdersWithDefaultsUseCase
  ) {}

  async execute(command: GeneratePreviewCommand): Promise<GeneratePreviewResponseDto> {
    const payloadHydrationInfo = this.buildPayloadIfMissing(command);
    const workflowInfo = await this.getWorkflowUserIdentifierFromWorkflowObject(command);
    const controlValuesResult = this.addMissingValuesToControlValues(command, workflowInfo.stepControlSchema);
    const executeOutput = await this.executePreview(workflowInfo, payloadHydrationInfo, controlValuesResult, command);

    return buildResponse(
      controlValuesResult.issuesMissingValues,
      payloadHydrationInfo.issues,
      executeOutput,
      workflowInfo.stepType
    );
  }

  private buildPayloadIfMissing(command: GeneratePreviewCommand) {
    const { controlValues, payloadValues } = command.generatePreviewRequestDto;

    return this.constructPayloadUseCase.execute(controlValues, payloadValues);
  }

  private async executePreview(
    workflowInfo: {
      stepControlSchema: ControlsSchema;
      stepType: StepTypeEnum;
      origin: WorkflowOriginEnum;
      stepId: string;
      workflowId: string;
    },
    payloadHydrationInfo: {
      augmentedPayload: Record<string, unknown>;
      issues: Record<string, ControlPreviewIssue[]>;
    },
    controlValuesResult: {
      augmentedControlValues: Record<string, unknown>;
      issuesMissingValues: Record<string, ControlPreviewIssue[]>;
    },
    command: GeneratePreviewCommand
  ) {
    return await this.executePreviewUsecase(
      workflowInfo.workflowId,
      workflowInfo.stepId,
      workflowInfo.origin,
      payloadHydrationInfo.augmentedPayload,
      controlValuesResult.augmentedControlValues,
      command
    );
  }

  private addMissingValuesToControlValues(command: GeneratePreviewCommand, stepControlSchema: ControlsSchema) {
    const defaultValues = this.extractDefaultsUseCase.execute({
      jsonSchemaDto: stepControlSchema.schema as JSONSchemaDto,
    });

    return {
      augmentedControlValues: merge(defaultValues, command.generatePreviewRequestDto.controlValues),
      issuesMissingValues: this.buildMissingControlValuesIssuesList(defaultValues, command),
    };
  }

  private buildMissingControlValuesIssuesList(defaultValues: Record<string, any>, command: GeneratePreviewCommand) {
    const missingRequiredControlValues = findMissingKeys(
      defaultValues,
      command.generatePreviewRequestDto.controlValues || {}
    );

    return this.buildControlPreviewIssues(missingRequiredControlValues);
  }

  private buildControlPreviewIssues(keys: string[]): Record<string, ControlPreviewIssue[]> {
    const record: Record<string, ControlPreviewIssue[]> = {};

    keys.forEach((key) => {
      record[key] = [
        {
          issueType: ControlPreviewIssueTypeEnum.MISSING_VALUE,
          message: `Value is missing on a required control`,
        },
      ];
    });

    return record;
  }

  private async executePreviewUsecase(
    workflowId: string,
    stepId: string,
    origin: WorkflowOriginEnum,
    hydratedPayload: Record<string, unknown>,
    updatedControlValues: Record<string, unknown>,
    command: GeneratePreviewCommand
  ) {
    return await this.legacyPreviewStepUseCase.execute(
      PreviewStepCommand.create({
        payload: hydratedPayload,
        controls: updatedControlValues || {},
        environmentId: command.user.environmentId,
        organizationId: command.user.organizationId,
        stepId,
        userId: command.user._id,
        workflowId,
        workflowOrigin: origin,
      })
    );
  }

  private async getWorkflowUserIdentifierFromWorkflowObject(command: GeneratePreviewCommand) {
    const workflowResponseDto = await this.getWorkflowUseCase.execute({
      identifierOrInternalId: command.workflowId,
      user: command.user,
    });
    const { workflowId, steps } = workflowResponseDto;
    const step = steps.find((stepDto) => stepDto._id === command.stepUuid);
    if (!step) {
      throw new StepNotFoundException(command.stepUuid);
    }

    return {
      workflowId,
      stepId: step.stepId,
      stepType: step.type,
      stepControlSchema: step.controls,
      origin: workflowResponseDto.origin,
    };
  }
}

function buildResponse(
  missingValuesIssue: Record<string, ControlPreviewIssue[]>,
  missingPayloadVariablesIssue: Record<string, ControlPreviewIssue[]>,
  executionOutput,
  stepType: StepTypeEnum
): GeneratePreviewResponseDto {
  return {
    issues: merge(missingValuesIssue, missingPayloadVariablesIssue),
    result: {
      preview: executionOutput.outputs as any,
      type: stepType as unknown as ChannelTypeEnum,
    },
  };
}

function findMissingKeys(requiredRecord: Record<string, unknown>, actualRecord: Record<string, unknown>): string[] {
  const requiredKeys = collectKeys(requiredRecord);
  const actualKeys = collectKeys(actualRecord);

  return _.difference(requiredKeys, actualKeys);
}

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  // Initialize result as an empty array of strings
  return _.reduce(
    obj,
    (result: string[], value, key) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (_.isObject(value) && !_.isArray(value)) {
        // Call collectKeys recursively and concatenate the results
        result.push(...collectKeys(value, newKey));
      } else {
        result.push(newKey);
      }

      return result;
    },
    [] // Pass an empty array as the initial value
  );
}
