import { IsArray, IsEnum, IsUUID, ArrayMinSize, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

export enum BulkTaskAction {
  DELETE = 'delete',
  RESTORE = 'restore',
  SET_STATUS = 'set_status',
}

export class BulkTaskActionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  taskIds: string[];

  @ApiProperty({ enum: BulkTaskAction })
  @IsEnum(BulkTaskAction)
  action: BulkTaskAction;

  @ApiPropertyOptional({ enum: TaskStatus, description: 'Required when action = set_status' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
