import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

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
}
