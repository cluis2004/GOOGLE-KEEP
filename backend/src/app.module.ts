import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { UsuarioController } from './usuario/usuario.controller';
import ormConfig from './config/orm.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './attachment/model/attachment.model';
import { AttachmentController } from './attachment/attachment.controller';
import { AttachmentService } from './attachment/attachment.service';
import { Usuario } from './usuario/model/usuario.model';
import { ConfigModule } from '@nestjs/config';
import { UsuarioService } from './usuario/usuario.service';
import { Noteshare } from './noteshare/model/noteshare.model';
import { Note } from './note/model/note.model';
import { NoteShareController } from './noteshare/noteshare.controller';
import { NoteShareService } from './noteshare/noteshare.service';
import { NoteController } from './note/note.controller';
import { NoteService } from './note/note.service';
import { Recordatorio } from './recordatorio/model/recordatorio.model';
import { RecordatorioController } from './recordatorio/recordatorio.controller';
import { RecordatorioService } from './recordatorio/recordatorio.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [ormConfig],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: ormConfig
    }),
    TypeOrmModule.forFeature([Usuario, Note, Noteshare, Attachment, Recordatorio])
  ],
  controllers: [
    AppController, 
    UsuarioController,
    NoteShareController,
    NoteController,
    AttachmentController,
    RecordatorioController
  ],
  providers: [
    // AppService
    UsuarioService,
    NoteShareService,
    NoteService,
    AttachmentService,
    RecordatorioService
  ],
})
export class AppModule {}
