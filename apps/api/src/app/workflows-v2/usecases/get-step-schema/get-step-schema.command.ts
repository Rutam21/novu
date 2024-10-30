import { EnvironmentWithUserCommand } from '@novu/application-generic';
import { IsNotEmpty, IsString } from 'class-validator';

export class GetStepSchemaCommand extends EnvironmentWithUserCommand {
  @IsString()
  @IsNotEmpty()
  workflowId: string;

  @IsString()
  @IsNotEmpty()
  stepId: string;
}
