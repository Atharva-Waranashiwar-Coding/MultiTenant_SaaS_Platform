import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadAttachmentDto {
  @ApiPropertyOptional({ description: 'Associate with a project' })
  @IsOptional()
  @IsUUID()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Associate with a task' })
  @IsOptional()
  @IsUUID()
  taskId?: string;
}
