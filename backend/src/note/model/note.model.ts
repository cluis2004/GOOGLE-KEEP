import { IsBoolean } from "class-validator";
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Attachment } from "src/attachment/model/attachment.model";

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

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}