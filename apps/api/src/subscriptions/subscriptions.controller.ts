import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { TenantGuard } from '../common/guards/tenant.guard';

class ChangePlanDto {
  @ApiProperty({ enum: SubscriptionPlan })
  @IsEnum(SubscriptionPlan)
  plan: SubscriptionPlan;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  billingEmail?: string;
}

class UpdateBillingEmailDto {
  @ApiProperty()
  @IsEmail()
  billingEmail: string;
}

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@UseGuards(TenantGuard)
@Controller('organizations/:orgId/subscription')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // GET /organizations/:orgId/subscription
  @Get()
  @ApiOperation({ summary: 'Get current subscription for this org' })
  get(@Param('orgId') orgId: string) {
    return this.subscriptionsService.findOrCreate(orgId);
  }

  // GET /organizations/:orgId/subscription/plans
  @Get('plans')
  @ApiOperation({ summary: 'List all available plans and their features' })
  getPlans() {
    return this.subscriptionsService.getPlanFeatures();
  }

  // GET /organizations/:orgId/subscription/seats
  @Get('seats')
  @ApiOperation({ summary: 'Check seat availability' })
  checkSeats(@Param('orgId') orgId: string) {
    return this.subscriptionsService.checkSeatAvailability(orgId);
  }

  // PATCH /organizations/:orgId/subscription/plan
  @Patch('plan')
  @ApiOperation({ summary: 'Change subscription plan (OWNER only, no real billing)' })
  changePlan(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionsService.changePlan(user.sub, orgId, dto);
  }

  // PATCH /organizations/:orgId/subscription/billing-email
  @Patch('billing-email')
  @ApiOperation({ summary: 'Update billing contact email (OWNER/ADMIN)' })
  updateBillingEmail(
    @CurrentUser() user: JwtPayload,
    @Param('orgId') orgId: string,
    @Body() dto: UpdateBillingEmailDto,
  ) {
    return this.subscriptionsService.updateBillingEmail(user.sub, orgId, dto.billingEmail);
  }
}
