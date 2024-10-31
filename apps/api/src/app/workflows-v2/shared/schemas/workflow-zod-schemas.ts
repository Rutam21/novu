import { z } from 'zod';
import { StepTypeEnum, WorkflowCreationSourceEnum, WorkflowOriginEnum, WorkflowStatusEnum } from '@novu/shared';

export const stepDtoSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(StepTypeEnum),
});

export const stepResponseDtoSchema = stepDtoSchema.extend({
  _id: z.string().min(1),
  slug: z.string().min(1),
  stepId: z.string().min(1),
});

export const stepCreateDtoSchema = stepDtoSchema.extend({
  controlValues: z.record(z.unknown()),
});

export const stepUpdateDtoSchema = stepCreateDtoSchema.extend({
  _id: z.string().min(1),
});

export const preferencesResponseDtoSchema = z.object({
  user: z.union([z.lazy(() => z.object({})), z.null()]),
  default: z.object({}),
});

export const preferencesRequestDtoSchema = z.object({
  user: z.union([z.lazy(() => z.object({})), z.null()]),
  workflow: z.union([z.lazy(() => z.object({})), z.null()]).optional(),
});

export const workflowCommonsFieldsSchema = z.object({
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  name: z.string().min(1),
  workflowId: z.string().min(1),
  description: z.string().optional(),
});

export const workflowResponseDtoSchema = workflowCommonsFieldsSchema.extend({
  _id: z.string().min(1),
  slug: z.string().min(1),
  updatedAt: z.string().min(1),
  createdAt: z.string().min(1),
  steps: z.array(stepResponseDtoSchema).min(1),
  origin: z.nativeEnum(WorkflowOriginEnum),
  preferences: preferencesResponseDtoSchema,
  status: z.nativeEnum(WorkflowStatusEnum),
  issues: z.record(z.unknown()).optional(),
});

export const updateWorkflowDtoSchema = workflowCommonsFieldsSchema.extend({
  updatedAt: z.string().min(1),
  steps: z.array(z.union([stepCreateDtoSchema, stepUpdateDtoSchema])).min(1),
  preferences: preferencesRequestDtoSchema,
});

export const createWorkflowDtoSchema = workflowCommonsFieldsSchema.extend({
  steps: z.array(stepCreateDtoSchema).min(1),
  __source: z.nativeEnum(WorkflowCreationSourceEnum),
  preferences: preferencesRequestDtoSchema.optional(),
});
