import { Module } from '@nestjs/common';
import { PhotosService } from './photos.service';
import { PhotosResolver } from './photos.resolver';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PhotosService, PhotosResolver],
  exports: [PhotosService],
})
export class PhotosModule {}
