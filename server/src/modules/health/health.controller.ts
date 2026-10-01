import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

@ApiTags('health')
@Controller('health')
@SkipThrottle()
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      commit: process.env.GIT_SHA ?? 'unknown',
    };
  }
}
