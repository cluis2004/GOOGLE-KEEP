import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Noteshare } from "./model/noteshare.model";
import { NoteshareDto } from "./dto/noteshare.dto";

@Injectable()
export class NoteShareService {
    constructor(
        @InjectRepository(Noteshare)
        private readonly repository: Repository<Noteshare>
    ) {}

    async getAll() {
        return await this.repository.find({
            relations: { note: true, usuario: true},
            // relations: ['note', 'usuario'],
            select: {
                id: true,
                role: true,
                note: {
                    id: true,
                    title: true
                },
                usuario: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        });
    }

    async getByNoteId(noteId: number) {
        return await this.repository.find({
            where: { note: { id: noteId } },
            relations: { note: true, usuario: true },
            select: {
                id: true,
                role: true,
                note: { id: true, title: true },
                usuario: { id: true, name: true, email: true }
            }
        });
    }

    async getById(id: number) {
        // return await this.repository.findOne({
        //     where: { id }
        // });
        return await this.findById(id);
    }

    async save(data: NoteshareDto) {
        if(data.id != undefined && data.id != null && data.id != 0) {
            // const usuario = await this.repository.findOneBy({id: data.id});
            const usuario = await this.findById(data.id);
            if(!usuario) throw new Error(`Entidad con id ${data.id} no encontrado`);

            await this.repository.update({id: data.id}, data);
            return 'Se actualizo correctamente!!!';
        } else {
            const entity = await this.repository.create(data);
            await this.repository.save(entity);
            return 'Se guardo correctamente!!!';
        }
    }

    async delete(id: number) {
        var data = await this.findById(id); // Verifica si el usuario existe antes de eliminarlo
        if (!data) throw new Error(`Entidad con id ${id} no encontrado`);
        await this.repository.delete({id: id});
        return 'Se elimino correctamente!!!';
    }

    async findById(id: number) {
        var data = await this.repository.findOne({
            where: { id },
            relations: { note: true, usuario: true},
            select: {
                id: true,
                role: true,
                note: {
                    id: true,
                    title: true
                },
                usuario: {
                    id: true,
                    name: true
                }
            }
        })

        return data;
    }
}