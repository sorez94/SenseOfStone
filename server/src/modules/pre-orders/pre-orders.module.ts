import { Module } from '@nestjs/common';
import { PreOrdersController } from './pre-orders.controller';
import { AdminPreOrdersController } from './admin-pre-orders.controller';
import { PreOrdersService } from './pre-orders.service';
import { PreOrdersRepository } from './pre-orders.repository';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [PreOrdersController, AdminPreOrdersController],
  providers: [PreOrdersService, PreOrdersRepository],
})
export class PreOrdersModule {}
