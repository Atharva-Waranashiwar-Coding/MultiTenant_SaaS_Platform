import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddDepartmentMemberDto {
  @ApiProperty({ description: 'User ID of the member to add' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ default: false, description: 'Set this user as department lead' })
  @IsOptional()
  @IsBoolean()
  isLead?: boolean;
}
