import { Body, Controller, Delete, HttpCode, HttpStatus, Patch, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ProfileService } from './profile.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { toUserDto, UserDto } from '../../common/mappers/user.mapper';
import { MAX_UPLOAD_SIZE_BYTES } from '../../common/constants/upload';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('me/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Put()
  async completeProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteProfileDto,
  ): Promise<UserDto> {
    const updated = await this.profileService.complete(user.id, dto);
    return toUserDto(updated);
  }

  @Patch()
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<UserDto> {
    const updated = await this.profileService.update(user.id, dto);
    return toUserDto(updated);
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<UserDto> {
    const updated = await this.profileService.setAvatar(user.id, file);
    return toUserDto(updated);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  async removeAvatar(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    const updated = await this.profileService.removeAvatar(user.id);
    return toUserDto(updated);
  }
}
