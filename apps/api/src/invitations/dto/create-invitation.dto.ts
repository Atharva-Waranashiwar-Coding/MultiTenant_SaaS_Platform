import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';

export class CreateInvitationDto {
  @ApiProperty({ example: 'newmember@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ enum: MemberRole, default: MemberRole.MEMBER })
  @IsOptional()
  @IsEnum(MemberRole)
  role?: MemberRole = MemberRole.MEMBER;
}
