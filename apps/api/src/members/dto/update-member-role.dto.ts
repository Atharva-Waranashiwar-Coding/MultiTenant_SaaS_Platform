import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: MemberRole, example: MemberRole.MANAGER })
  @IsEnum(MemberRole)
  role: MemberRole;
}
