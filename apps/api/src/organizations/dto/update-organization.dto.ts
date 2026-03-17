import { IsString, MinLength, MaxLength, IsOptional, IsEnum, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Acme Corp Inc.' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Brand color as hex string' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'brandColor must be a valid hex color (e.g. #3B82F6)' })
  brandColor?: string;

  @ApiPropertyOptional({ example: 'America/New_York', description: 'IANA timezone string' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  timezone?: string;

  @ApiPropertyOptional({ enum: MemberRole, description: 'Default role for new invitations' })
  @IsOptional()
  @IsEnum(MemberRole)
  defaultInviteRole?: MemberRole;
}
