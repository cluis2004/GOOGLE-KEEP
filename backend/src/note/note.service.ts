import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Note } from "./model/note.model";
import { NoteDto } from "./dto/note.dto";
import { Attachment } from "src/attachment/model/attachment.model";
import { Noteshare } from "src/noteshare/model/noteshare.model";

@Injectable()
export class NoteService {
    constructor(
        @InjectRepository(Note)
        private readonly repository: Repository<Note>,
        @InjectRepository(Attachment)
        private readonly attachmentRepository: Repository<Attachment>,
        @InjectRepository(Noteshare)
        private readonly noteshareRepository: Repository<Noteshare>
    ) {}

    getAll() {
        return this.repository.find({ 
            relations: ['attachments', 'recordatorios'],
            select: {
                id: true,
                title: true,
                content: true,
                activo: true,
                order: true,
                type: true,
                items: true,
                created_at: true,
                updated_at: true,
                attachments: {
                    id: true,
                    filename: true,
                    filetype: true
                },
                recordatorios: {
                    id: true,
                    fecha: true
                }
            },
            order: { order: 'ASC' } 
        });
    }

    /**
     * Devuelve únicamente las notas a las que el usuario tiene acceso:
     * - Las que creó (rol 1 = propietario)
     * - Las que le fueron compartidas (rol 2 o 3)
     */
    async getByUser(userId: number) {
        const shares = await this.noteshareRepository.find({
            where: { usuario: { id: userId } },
            relations: { note: { attachments: true, recordatorios: true } },
            select: {
                id: true,
                role: true,
                note: {
                    id: true,
                    title: true,
                    content: true,
                    activo: true,
                    order: true,
                    type: true,
                    items: true,
                    created_at: true,
                    updated_at: true,
                    attachments: { id: true, filename: true, filetype: true },
                    recordatorios: { id: true, fecha: true }
                }
            }
        });

        return shares
            .filter(s => s.note)
            .map(s => ({ ...s.note, userRole: s.role }))
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    getById(id: number) {
        return this.repository.findOne({ where: { id } });
    }

    async save(data: NoteDto & { usuario?: { id: number } }) {
        const isNew = !data.id || data.id === 0;

        if (!isNew) {
            const existing = await this.repository.findOneBy({ id: data.id });
            if (!existing) throw new Error(`Entidad con id ${data.id} no encontrado`);

            // Verificar permiso: solo propietario(1) o editor(2) pueden editar
            if (data.usuario?.id) {
                const share = await this.noteshareRepository.findOne({
                    where: { note: { id: data.id }, usuario: { id: data.usuario.id } }
                });

                if (!share) {
                    const shareCount = await this.noteshareRepository.count({
                        where: { note: { id: data.id } }
                    });

                    if (shareCount === 0) {
                        await this.noteshareRepository.save(
                            this.noteshareRepository.create({
                                role: 1,
                                note: { id: data.id },
                                usuario: { id: data.usuario.id }
                            })
                        );
                    } else {
                        throw new Error('No tienes permiso para editar esta nota.');
                    }
                } else if (share.role === 3) {
                    throw new Error('No tienes permiso para editar esta nota.');
                }
            }

            // Evitar sobreescribir campos de relación guardados en el dto
            const { usuario, ...updateData } = data as any;
            await this.repository.update({ id: data.id }, updateData);
            return 'Se actualizo correctamente!!!';
        } else {
            const { usuario, ...createData } = data;
            const entity = this.repository.create(createData as Partial<Note>);
            const saved = await this.repository.save(entity);

            // Crear automáticamente el registro de propietario en note_share
            if (data.usuario?.id) {
                const share = this.noteshareRepository.create({
                    role: 1, // Propietario
                    note: { id: saved.id },
                    usuario: { id: data.usuario.id }
                });
                await this.noteshareRepository.save(share);
            }

            return 'Se guardo correctamente!!!';
        }
    }

    async delete(id: number, userId?: number) {
        const data = await this.findById(id);
        if (!data) throw new Error(`Entidad con id ${id} no encontrado`);
        
        if (userId) {
            const share = await this.noteshareRepository.findOne({
                where: { note: { id }, usuario: { id: userId } }
            });
            if (!share || share.role !== 1) {
                throw new Error('No tienes permiso para eliminar esta nota. Solo el propietario puede hacerlo.');
            }
        }

        // 1. Eliminar registros de compartición (noteshare)
        await this.noteshareRepository.delete({ note: { id } });

        // 2. Eliminar adjuntos
        await this.attachmentRepository.delete({ note: { id } });
        
        // 3. Eliminar la nota
        await this.repository.delete({ id });
        return 'Se elimino correctamente!!!';
    }

    async findById(id: number) {
        const entity = await this.repository.findOne({ where: { id } });
        if (!entity) throw new Error(`Entidad con id ${id} no encontrado`);
        return entity;
    }

    async reorder(ids: number[]) {
        const updates = ids.map((id, index) =>
            this.repository.update({ id }, { order: index })
        );
        await Promise.all(updates);
        return 'Orden actualizado correctamente';
    }

    async duplicate(id: number, userId?: number) {
        const original = await this.findById(id);
        const copy = this.repository.create({
            title: original.title,
            content: original.content,
            activo: original.activo,
            order: original.order + 1,
            type: original.type,
            items: original.items ? JSON.parse(JSON.stringify(original.items)) : null,
        });
        const saved = await this.repository.save(copy);

        if (userId) {
            const share = this.noteshareRepository.create({
                role: 1,
                note: { id: saved.id },
                usuario: { id: userId }
            });
            await this.noteshareRepository.save(share);
        }

        return 'Copia creada correctamente';
    }
}
