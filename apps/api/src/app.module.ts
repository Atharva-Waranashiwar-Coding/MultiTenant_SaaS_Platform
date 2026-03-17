import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { MembersModule } from './members/members.module';
import { InvitationsModule } from './invitations/invitations.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    // Load .env file and make ConfigService available everywhere
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    MembersModule,
    InvitationsModule,
    AuditModule,
  ],
})
export class AppModule {}
