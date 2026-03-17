import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/v1/auth/signup
  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created, returns tokens' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  signup(@Body() dto: SignupDto, @Req() req: Request) {
    return this.authService.signup(dto, req.ip);
  }

  // POST /api/v1/auth/login
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns access + refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  // POST /api/v1/auth/refresh
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  // POST /api/v1/auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  logout(@CurrentUser() user: JwtPayload, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(user.sub, dto.refreshToken);
  }

  // GET /api/v1/auth/me
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current authenticated user with memberships' })
  me(@CurrentUser() user: JwtPayload) {
    return this.authService.getCurrentUser(user.sub);
  }

  // POST /api/v1/auth/forgot-password
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // POST /api/v1/auth/reset-password
  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // GET /api/v1/auth/verify-email?token=...
  @Public()
  @Get('verify-email')
  @ApiOperation({ summary: 'Verify email address using token from email' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // POST /api/v1/auth/switch-org
  @Post('switch-org')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Switch active organization — returns new tokens' })
  switchOrg(
    @CurrentUser() user: JwtPayload,
    @Body('organizationId') organizationId: string,
  ) {
    return this.authService.switchOrganization(user.sub, organizationId);
  }
}
