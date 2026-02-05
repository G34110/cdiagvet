import { Module } from '@nestjs/common';
import { LotsService } from './lots.service';
import { LotsResolver } from './lots.resolver';
import { GS1DecoderService } from './gs1-decoder.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [LotsService, LotsResolver, GS1DecoderService],
  exports: [LotsService, GS1DecoderService],
})
export class LotsModule {}
