import { IsBoolean, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';

export class UpsertOverrideDto {
  @ApiProperty({ enum: MemberRole })
  @IsEnum(MemberRole)
  role: MemberRole;

  @ApiProperty({ example: 'projects.create' })
  @IsString()
  @IsNotEmpty()
  permission: string;

  @ApiProperty()
  @IsBoolean()
  granted: boolean;
}
