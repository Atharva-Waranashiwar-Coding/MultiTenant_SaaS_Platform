import { IsArray, IsEnum, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BulkProjectAction {
  ARCHIVE = 'archive',
  UNARCHIVE = 'unarchive',
}

export class BulkProjectActionDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  projectIds: string[];

  @ApiProperty({ enum: BulkProjectAction })
  @IsEnum(BulkProjectAction)
  action: BulkProjectAction;
}
