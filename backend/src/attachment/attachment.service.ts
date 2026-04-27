import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Attachment } from "./model/attachment.model";
import { Note } from "src/note/model/note.model";
import { Noteshare } from "src/noteshare/model/noteshare.model";

@Injectable()
export class AttachmentService {
    constructor(
        @InjectRepository(Attachment)
        private readonly repository: Repository<Attachment>,
        @InjectRepository(Noteshare)
        private readonly noteshareRepository: Repository<Noteshare>
    ) {}

    getAll() {
        return this.repository.find();
    }

    async save(data: Express.Multer.File, entityId: number, userId?: number) {
        if (userId) {
            const share = await this.noteshareRepository.findOne({
                where: { note: { id: entityId }, usuario: { id: userId } }
            });
            if (share && share.role === 3) {
                throw new UnauthorizedException('No tienes permiso para subir archivos a esta nota.');
            }
        }

        if (!data)
            throw new BadRequestException('No se recibio ningun archivo');

        if (!data.buffer || data.buffer.length === 0)
            throw new BadRequestException('El archivo no contiene buffer. Verifica memoryStorage en el interceptor');

        var attachment = new Attachment();
        attachment.filename = data.originalname;
        attachment.filetype = data.mimetype;
        attachment.filesize = data.size;
        attachment.filedata = data.buffer;
        attachment.note = { id: entityId } as Note;
        return await this.repository.save(attachment);
    }

    async getById(id: number) {
        const attachment = await this.repository.findOne({ 
            where: { id },
            relations: ['note']
        });
        if (!attachment) throw new BadRequestException(`Attachment con id ${id} no encontrado`);
        return attachment;
    }

    async delete(id: number, userId?: number) {
        const attachment = await this.getById(id);
        
        if (userId && attachment.note?.id) {
            const share = await this.noteshareRepository.findOne({
                where: { note: { id: attachment.note.id }, usuario: { id: userId } }
            });
            if (share && share.role === 3) {
                throw new UnauthorizedException('No tienes permiso para eliminar archivos de esta nota.');
            }
        }

        return await this.repository.remove(attachment);
    }
}