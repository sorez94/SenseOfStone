import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PreOrdersService } from './pre-orders.service';
import { AdminPreOrderQueryDto } from './dto/pre-order-query.dto';
import { UpdatePreOrderStatusDto } from './dto/update-pre-order-status.dto';
import { UpdatePreOrderNoteDto } from './dto/update-pre-order-note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('admin-pre-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/pre-orders')
export class AdminPreOrdersController {
  constructor(private readonly preOrdersService: PreOrdersService) {}

  @Get()
  list(@Query() query: AdminPreOrderQueryDto) {
    return this.preOrdersService.listAdmin(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.preOrdersService.getAdmin(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdatePreOrderStatusDto) {
    return this.preOrdersService.updateStatus(id, dto.status, dto.note);
  }

  @Patch(':id')
  updateNote(@Param('id') id: string, @Body() dto: UpdatePreOrderNoteDto) {
    return this.preOrdersService.updateNote(id, dto.adminNote);
  }
}
