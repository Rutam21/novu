import { IsArray, IsDefined, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { PreferencesResponseDto, StepResponseDto, WorkflowCommonsFields } from './workflow-commons-fields';
import { Slug, WorkflowOriginEnum } from '../../types';
import { WorkflowStatusEnum } from './workflow-status-enum';

export class WorkflowResponseDto extends WorkflowCommonsFields {
  @IsString()
  @IsDefined()
  _id: string;

  @IsString()
  @IsDefined()
  slug: Slug;

  @IsString()
  @IsDefined()
  updatedAt: string;

  @IsString()
  @IsDefined()
  createdAt: string;

  @IsArray()
  @IsDefined()
  steps: StepResponseDto[];

  @IsEnum(WorkflowOriginEnum)
  @IsDefined()
  origin: WorkflowOriginEnum;

  @IsObject()
  @IsDefined()
  preferences: PreferencesResponseDto;

  @IsEnum(WorkflowStatusEnum)
  @IsDefined()
  status: WorkflowStatusEnum;

  @IsObject()
  @IsOptional()
  issues?: Record<string, RuntimeIssue>;
}
export class RuntimeIssue {
  issueType: WorkflowIssueTypeEnum;
  variableName?: string;
  message: string;
}
export enum WorkflowIssueTypeEnum {
  MISSING_VARIABLE_IN_PAYLOAD = 'MISSING_VARIABLE_IN_PAYLOAD',
  VARIABLE_TYPE_MISMATCH = 'VARIABLE_TYPE_MISMATCH',
  MISSING_VALUE = 'MISSING_VALUE',
  WORKFLOW_ID_ALREADY_EXIST = 'WORKFLOW_ID_ALREADY_EXIST',
  STEP_ID_ALREADY_EXIST = 'WORKFLOW_ID_ALREADY_EXIST',
}
