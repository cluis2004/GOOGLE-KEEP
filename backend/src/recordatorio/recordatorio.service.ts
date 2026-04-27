import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Recordatorio } from "./model/recordatorio.model";
import { Noteshare } from "src/noteshare/model/noteshare.model";

@Injectable()
export class RecordatorioService {
    constructor(
        @InjectRepository(Recordatorio)
        private readonly repository: Repository<Recordatorio>,
        @InjectRepository(Noteshare)
        private readonly noteshareRepository: Repository<Noteshare>
    ) {}


    async getByNote(noteId: number) {
        return this.repository.find({
            where: { note: { id: noteId } },
            order: { fecha: 'ASC' }
        });
    }

    async save(fecha: string, noteId: number, userId?: number) {
        if (userId) {
            const share = await this.noteshareRepository.findOne({
                where: { note: { id: noteId }, usuario: { id: userId } }
            });
            // Rol 3 = Lector (solo editores o propietarios pueden crear recordatorios)
            if (share && share.role === 3) {
                throw new UnauthorizedException('No tienes permiso para agregar recordatorios a esta nota.');
            }
        }

        const recordatorio = new Recordatorio();
        recordatorio.fecha = new Date(fecha);
        recordatorio.note = { id: noteId } as any;

        return await this.repository.save(recordatorio);
    }

    async delete(id: number, userId?: number) {
        const recordatorio = await this.repository.findOne({ where: { id }, relations: ['note'] });
        if (!recordatorio) throw new BadRequestException(`Recordatorio con id ${id} no encontrado`);

        if (userId && recordatorio.note?.id) {
            const share = await this.noteshareRepository.findOne({
                where: { note: { id: recordatorio.note.id }, usuario: { id: userId } }
            });
            if (share && share.role === 3) {
                throw new UnauthorizedException('No tienes permiso para eliminar recordatorios de esta nota.');
            }
        }

        return await this.repository.remove(recordatorio);
    }
}