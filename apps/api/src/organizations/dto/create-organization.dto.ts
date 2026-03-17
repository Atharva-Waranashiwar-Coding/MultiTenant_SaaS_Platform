import { IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'acme-corp', description: 'URL-friendly slug (letters, numbers, hyphens)' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must contain only lowercase letters, numbers, and hyphens' })
  slug: string;

  @ApiPropertyOptional({ example: 'The main Acme workspace' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
