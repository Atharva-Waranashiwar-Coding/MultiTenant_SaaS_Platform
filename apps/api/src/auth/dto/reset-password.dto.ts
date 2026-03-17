import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token from email link' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;
}
