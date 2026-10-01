import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(ContactService.name) private readonly logger: PinoLogger,
  ) {}

  async send(dto: CreateContactMessageDto): Promise<{ id: string; createdAt: string }> {
    const message = await this.prisma.contactMessage.create({
      data: { name: dto.name, email: dto.email, message: dto.message },
    });

    // docs/API.md §4.8: "notify the team (email/SMS)" - log-only stub for now; swap for a real
    // mailer/SMS provider call here once credentials are available.
    this.logger.info(
      { contactMessageId: message.id, email: message.email },
      'New contact message received (notification not sent: email/SMS not configured)',
    );

    return { id: message.id, createdAt: message.createdAt.toISOString() };
  }
}
