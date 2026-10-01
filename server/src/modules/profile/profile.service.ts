import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async complete(userId: string, dto: CompleteProfileDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        addressCity: dto.address.city,
        addressLine: dto.address.line,
        addressPostalCode: dto.address.postalCode ?? null,
      },
    });
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        addressCity: dto.address?.city,
        addressLine: dto.address?.line,
        addressPostalCode: dto.address?.postalCode,
      },
    });
  }

  async setAvatar(userId: string, file: Express.Multer.File | undefined): Promise<User> {
    const { url } = await this.uploadsService.uploadImage(file);
    return this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } });
  }

  async removeAvatar(userId: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });
  }
}
