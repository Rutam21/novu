import {
  CreateWorkflowDto,
  GeneratePreviewRequestDto,
  GeneratePreviewResponseDto,
  GetListQueryParams,
  ListWorkflowResponse,
  PromoteWorkflowDto,
  StepMetadataDto,
  UpdateWorkflowDto,
  WorkflowResponseDto,
  WorkflowTestDataResponseDto,
} from '@novu/shared';
import { createNovuBaseClient, HttpError, NovuRestResult } from './novu-base-client';

// Define the WorkflowClient as a function that utilizes the base client
export const createWorkflowClient = (baseUrl: string, headers: HeadersInit = {}) => {
  const baseClient = createNovuBaseClient(baseUrl, headers);

  const createWorkflow = async (
    createWorkflowDto: CreateWorkflowDto
  ): Promise<NovuRestResult<WorkflowResponseDto, HttpError>> => {
    return await baseClient.safePost<WorkflowResponseDto>('/v2/workflows', createWorkflowDto);
  };

  const updateWorkflow = async (
    workflowId: string,
    updateWorkflowDto: UpdateWorkflowDto
  ): Promise<NovuRestResult<WorkflowResponseDto, HttpError>> => {
    return await baseClient.safePut<WorkflowResponseDto>(`/v2/workflows/${workflowId}`, updateWorkflowDto);
  };

  const promoteWorkflow = async (
    workflowId: string,
    promoteWorkflowDto: PromoteWorkflowDto
  ): Promise<NovuRestResult<WorkflowResponseDto, HttpError>> => {
    return await baseClient.safePut<WorkflowResponseDto>(`/v2/workflows/${workflowId}/promote`, promoteWorkflowDto);
  };

  const getWorkflow = async (workflowId: string): Promise<NovuRestResult<WorkflowResponseDto, HttpError>> => {
    return await baseClient.safeGet<WorkflowResponseDto>(`/v2/workflows/${workflowId}`);
  };
  const getWorkflowStepMetadata = async (
    workflowId: string,
    stepId: string
  ): Promise<NovuRestResult<StepMetadataDto, HttpError>> => {
    return await baseClient.safeGet<StepMetadataDto>(`/v2/workflows/${workflowId}/step/${stepId}/metadata`);
  };
  const deleteWorkflow = async (workflowId: string): Promise<NovuRestResult<void, HttpError>> => {
    return await baseClient.safeDelete(`/v2/workflows/${workflowId}`);
  };

  const searchWorkflows = async (
    queryParams: GetListQueryParams
  ): Promise<NovuRestResult<ListWorkflowResponse, HttpError>> => {
    const query = new URLSearchParams();
    query.append('offset', queryParams.offset?.toString() || '0');
    query.append('limit', queryParams.limit?.toString() || '50');
    if (queryParams.orderDirection) {
      query.append('orderDirection', queryParams.orderDirection);
    }
    if (queryParams.orderByField) {
      query.append('orderByField', queryParams.orderByField);
    }
    if (queryParams.query) {
      query.append('query', queryParams.query);
    }

    return await baseClient.safeGet<ListWorkflowResponse>(`/v2/workflows?${query.toString()}`);
  };

  const generatePreview = async (
    workflowId: string,
    stepUuid: string,
    generatePreviewDto: GeneratePreviewRequestDto
  ): Promise<NovuRestResult<GeneratePreviewResponseDto, HttpError>> => {
    return await baseClient.safePost<GeneratePreviewResponseDto>(
      `/v2/workflows/${workflowId}/step/${stepUuid}/preview`,
      generatePreviewDto
    );
  };

  const getWorkflowTestData = async (
    workflowId: string
  ): Promise<NovuRestResult<WorkflowTestDataResponseDto, HttpError>> => {
    return await baseClient.safeGet<WorkflowTestDataResponseDto>(`/v2/workflows/${workflowId}/test-data`);
  };

  // Return the methods as an object
  return {
    generatePreview,
    createWorkflow,
    updateWorkflow,
    promoteWorkflow,
    getWorkflow,
    deleteWorkflow,
    searchWorkflows,
    getWorkflowTestData,
    getWorkflowStepMetadata,
  };
};
