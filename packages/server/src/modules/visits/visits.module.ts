import { Module } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { VisitsResolver } from './visits.resolver';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VisitsService, VisitsResolver],
  exports: [VisitsService],
})
export class VisitsModule {}
