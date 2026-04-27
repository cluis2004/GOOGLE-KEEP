import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Note } from "src/note/model/note.model";

@Entity('recordatorio')
export class Recordatorio {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp' })
    fecha: Date;

    @ManyToOne(() => Note, note => note.recordatorios, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'note_id' })
    note: Note;
}