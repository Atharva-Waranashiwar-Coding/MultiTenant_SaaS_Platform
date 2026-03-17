import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PassportModule,
    AuditModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_ACCESS_EXPIRES_IN', '15m') },
      }),
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    // Apply JwtAuthGuard globally — use @Public() to opt out
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
