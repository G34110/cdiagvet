import { Module } from '@nestjs/common';
import { FilieresService } from './filieres.service';
import { FilieresResolver } from './filieres.resolver';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FilieresService, FilieresResolver],
  exports: [FilieresService],
})
export class FilieresModule {}
