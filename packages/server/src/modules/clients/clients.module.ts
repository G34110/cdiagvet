import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsResolver } from './clients.resolver';
import { ClientsController } from './clients.controller';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService, ClientsResolver],
  exports: [ClientsService],
})
export class ClientsModule {}
