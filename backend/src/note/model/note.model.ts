import { IsBoolean } from "class-validator";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Attachment } from "src/attachment/model/attachment.model";
import { Recordatorio } from "src/recordatorio/model/recordatorio.model";

@Entity()
export class Note {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column()
    @IsBoolean()
    activo: boolean;

    @Column({ default: 0 })
    order: number;

    @Column({ default: 'text' })
    type: string;

    @Column({ type: 'json', nullable: true })
    items: any;

    @OneToMany(() => Attachment, attachment => attachment.note)
    attachments: Attachment[];

    @OneToMany(() => Recordatorio, recordatorio => recordatorio.note)
    recordatorios: Recordatorio[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}