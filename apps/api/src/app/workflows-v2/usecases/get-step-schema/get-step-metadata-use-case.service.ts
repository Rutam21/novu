import { BadRequestException, Injectable } from '@nestjs/common';
import { ControlValuesLevelEnum, StepMetadataDto, StepType, StepTypeEnum } from '@novu/shared';
import { JSONSchema } from 'json-schema-to-ts';
import { ControlValuesRepository, NotificationStepEntity, NotificationTemplateRepository } from '@novu/dal';
import { GetStepSchemaCommand } from './get-step-schema.command';
import { mapStepTypeToResult } from '../../shared';

@Injectable()
export class GetStepMetadataUseCase {
  constructor(
    private notificationTemplateRepository: NotificationTemplateRepository,
    private controlValuesRepository: ControlValuesRepository
  ) {}

  async execute(command: GetStepSchemaCommand): Promise<StepMetadataDto> {
    const { currentStep, previousSteps } = await this.findSteps(command);
    this.assertStepValidity(currentStep);

    return {
      controls: {
        dataSchema: currentStep.controls?.schema,
        uiSchema: currentStep.controls?.uiSchema,
        values: await this.getValues(command, currentStep),
      },
      variables: buildVariablesSchema(previousSteps),
    };
  }

  private async getValues(command: GetStepSchemaCommand, currentStep: NotificationStepEntity) {
    const controlValuesEntity = await this.controlValuesRepository.findFirst({
      _environmentId: command.environmentId,
      _organizationId: command.organizationId,
      _workflowId: command.workflowId,
      _stepId: currentStep._templateId,
      level: ControlValuesLevelEnum.STEP_CONTROLS,
    });

    return controlValuesEntity?.controls || {};
  }

  private assertStepValidity(currentStep: NotificationStepEntity) {
    if (!currentStep.template?.type) {
      throw new BadRequestException('No step type found');
    }

    if (!currentStep.template?.controls?.schema) {
      throw new BadRequestException('No controls schema found');
    }

    if (!isStepType(currentStep.template?.type)) {
      throw new BadRequestException({
        message: 'Invalid step type',
        stepType: currentStep.template?.type,
      });
    }
  }

  private async findSteps(command: GetStepSchemaCommand) {
    const workflow = await this.notificationTemplateRepository.findByIdQuery({
      id: command.workflowId,
      environmentId: command.environmentId,
    });

    if (!workflow) {
      throw new BadRequestException({
        message: 'No workflow found',
        workflowId: command.workflowId,
      });
    }

    const currentStep = workflow.steps.find((stepItem) => stepItem._id === command.stepId);

    if (!currentStep) {
      throw new BadRequestException({
        message: 'No step found',
        stepId: command.stepId,
        workflowId: command.workflowId,
      });
    }

    const previousSteps = workflow.steps.slice(
      0,
      workflow.steps.findIndex((stepItem) => stepItem._id === command.stepId)
    );

    return { currentStep, previousSteps };
  }
}

const buildSubscriberSchema = () =>
  ({
    type: 'object',
    description: 'Schema representing the subscriber entity',
    properties: {
      firstName: { type: 'string', description: "Subscriber's first name" },
      lastName: { type: 'string', description: "Subscriber's last name" },
      email: { type: 'string', description: "Subscriber's email address" },
      phone: { type: 'string', description: "Subscriber's phone number (optional)" },
      avatar: { type: 'string', description: "URL to the subscriber's avatar image (optional)" },
      locale: { type: 'string', description: 'Locale for the subscriber (optional)' },
      subscriberId: { type: 'string', description: 'Unique identifier for the subscriber' },
      isOnline: { type: 'boolean', description: 'Indicates if the subscriber is online (optional)' },
      lastOnlineAt: {
        type: 'string',
        format: 'date-time',
        description: 'The last time the subscriber was online (optional)',
      },
    },
    required: ['firstName', 'lastName', 'email', 'subscriberId'],
    additionalProperties: false,
  }) as const satisfies JSONSchema;

function buildVariablesSchema(previousSteps?: NotificationStepEntity[]): JSONSchema {
  return {
    type: 'object',
    properties: {
      subscriber: buildSubscriberSchema(),
      steps: buildPreviousStepsSchema(previousSteps),
    },
    additionalProperties: false,
  } as const satisfies JSONSchema;
}

function buildPreviousStepsSchema(previousSteps: NotificationStepEntity[] | undefined) {
  type StepUUID = string;
  let previousStepsProperties: Record<StepUUID, JSONSchema> = {};

  previousStepsProperties = (previousSteps || []).reduce(
    (acc, step) => {
      if (step.stepId && step.template?.type) {
        acc[step.stepId] = mapStepTypeToResult[step.template.type];
      }

      return acc;
    },
    {} as Record<StepUUID, JSONSchema>
  );

  return {
    type: 'object',
    properties: previousStepsProperties,
    required: [],
    additionalProperties: false,
    description: 'Previous Steps Results',
  } as const satisfies JSONSchema;
}

function isStepType(value: string): value is StepType {
  return Object.values(StepTypeEnum).includes(value as StepTypeEnum);
}
