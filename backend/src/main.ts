import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*', // Reemplaza con la URL de tu frontend
    methods: '*', // Métodos HTTP permitidos
    // allowedHeaders: 'Content-Type, Authorization', // Encabezados permitidos
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            //Elimina propiedades que no están definidas en el DTO
    forbidNonWhitelisted: true, //Lanza un error si se envían propiedades no definidas en el DTO
    transform: true,            //Transforma los datos de entrada al tipo definido en el DTO
  }));

  var port = 3000;
  await app.listen(port);
}
bootstrap();
