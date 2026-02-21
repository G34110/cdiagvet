// Tout en haut du fichier, avant les imports
console.log('Current directory:', process.cwd());
console.log('__dirname:', __dirname);
console.log('Files in current dir:', require('fs').readdirSync('.'));
console.log('Files in dist:', require('fs').readdirSync('./dist').slice(0,5));

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT || process.env.SERVER_PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}/graphql`);
}

bootstrap();
