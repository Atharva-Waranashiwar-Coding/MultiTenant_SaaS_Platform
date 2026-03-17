import { IsString, IsOptional, MinLength, MaxLength, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Alice' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Smith' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
