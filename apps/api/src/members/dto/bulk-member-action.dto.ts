import { IsArray, IsEnum, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BulkMemberAction {
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  REMOVE = 'remove',
}

export class BulkMemberActionDto {
  @ApiProperty({ type: [String], description: 'Array of user IDs' })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  userIds: string[];

  @ApiProperty({ enum: BulkMemberAction })
  @IsEnum(BulkMemberAction)
  action: BulkMemberAction;
}
