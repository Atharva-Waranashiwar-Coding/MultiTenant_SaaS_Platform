import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuditAction } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  // ── Signup ────────────────────────────────────────────────
  async signup(dto: SignupDto, ipAddress?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const emailVerifyToken = uuidv4();

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        emailVerifyToken,
      },
    });

    await this.auditService.log({
      action: AuditAction.USER_SIGNUP,
      userId: user.id,
      ipAddress,
    });

    // Phase 2: send email with emailVerifyToken
    console.log(`[DEV] Email verify token for ${user.email}: ${emailVerifyToken}`);

    const tokens = await this.generateTokens(user.id, user.email, undefined);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ── Login ─────────────────────────────────────────────────
  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Default to the user's first organization
    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
    });

    await this.auditService.log({
      action: AuditAction.USER_LOGIN,
      userId: user.id,
      organizationId: membership?.organizationId,
      ipAddress,
    });

    const tokens = await this.generateTokens(user.id, user.email, membership?.organizationId);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // ── Refresh ───────────────────────────────────────────────
  async refreshTokens(token: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token } });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id },
      orderBy: { joinedAt: 'asc' },
    });

    return this.generateTokens(user.id, user.email, membership?.organizationId);
  }

  // ── Switch Organization ───────────────────────────────────
  async switchOrganization(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of that organization');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.generateTokens(user.id, user.email, organizationId);
  }

  // ── Logout ────────────────────────────────────────────────
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, userId },
        data: { revoked: true },
      });
    }
    await this.auditService.log({ action: AuditAction.USER_LOGOUT, userId });
    return { message: 'Logged out successfully' };
  }

  // ── Forgot Password ───────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' };

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: token, resetPasswordTokenExpiresAt: expiresAt },
    });

    await this.auditService.log({ action: AuditAction.USER_PASSWORD_RESET_REQUEST, userId: user.id });

    // Phase 2: send email with reset link
    console.log(`[DEV] Password reset token for ${user.email}: ${token}`);

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // ── Reset Password ────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { resetPasswordToken: dto.token },
    });

    if (
      !user ||
      !user.resetPasswordTokenExpiresAt ||
      user.resetPasswordTokenExpiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetPasswordToken: null, resetPasswordTokenExpiresAt: null },
    });

    // Revoke all refresh tokens on password reset
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: { revoked: true },
    });

    await this.auditService.log({ action: AuditAction.USER_PASSWORD_RESET_COMPLETE, userId: user.id });

    return { message: 'Password reset successfully' };
  }

  // ── Verify Email ──────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({ where: { emailVerifyToken: token } });
    if (!user) throw new BadRequestException('Invalid verification token');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null },
    });

    await this.auditService.log({ action: AuditAction.USER_EMAIL_VERIFIED, userId: user.id });

    return { message: 'Email verified successfully' };
  }

  // ── Current User ──────────────────────────────────────────
  getCurrentUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
        memberships: {
          include: { organization: true },
        },
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, organizationId?: string) {
    const payload: JwtPayload = { sub: userId, email, organizationId };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshTokenValue = uuidv4();
    const refreshExpiresInDays = Number(this.configService.get('JWT_REFRESH_EXPIRES_IN_DAYS', 7));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresInDays);

    await this.prisma.refreshToken.create({
      data: { token: refreshTokenValue, userId, expiresAt },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private sanitizeUser(user: any) {
    const {
      passwordHash,
      emailVerifyToken,
      resetPasswordToken,
      resetPasswordTokenExpiresAt,
      ...safe
    } = user;
    return safe;
  }
}
