import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ensureDatabaseExists } from './common/database/database.init';

async function bootstrap() {
  await ensureDatabaseExists();
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos que no estén en el DTO
      forbidNonWhitelisted: true, // error si mandan campos extra
      transform: true, // convierte strings a number automáticamente
    }),
  );

  app.enableCors({
    origin: ['https://pedidos-app-alpha.vercel.app', "http://localhost:4200"],
    methods: ['GET', 'POST', 'PUT'],
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
