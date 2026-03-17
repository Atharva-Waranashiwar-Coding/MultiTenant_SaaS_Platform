import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true, logoUrl: true },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        updatedAt: true,
      },
    });
  }
}
