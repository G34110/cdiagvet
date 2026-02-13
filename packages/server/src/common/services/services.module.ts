import { Module, Global } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { EmailService } from './email.service';

@Global()
@Module({
  providers: [GeocodingService, EmailService],
  exports: [GeocodingService, EmailService],
})
export class ServicesModule {}
