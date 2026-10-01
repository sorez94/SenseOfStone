import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PreOrdersService } from './pre-orders.service';
import { CreatePreOrderDto } from './dto/create-pre-order.dto';
import { CancelPreOrderDto } from './dto/cancel-pre-order.dto';
import { PreOrderQueryDto } from './dto/pre-order-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';

@ApiTags('pre-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pre-orders')
export class PreOrdersController {
  constructor(private readonly preOrdersService: PreOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePreOrderDto) {
    return this.preOrdersService.create(user.id, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser, @Query() query: PreOrderQueryDto) {
    return this.preOrdersService.listMine(user.id, query);
  }

  @Get(':id')
  getMine(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.preOrdersService.getMine(user.id, id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelPreOrderDto,
  ) {
    return this.preOrdersService.cancelMine(user.id, id, dto.reason);
  }
}
