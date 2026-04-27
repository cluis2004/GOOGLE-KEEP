import { Note } from "src/note/model/note.model";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Attachment {
    @PrimaryGeneratedColumn()
    id: number;
    @Column({ name: 'file_name' })
    filename: string;
    @Column({ name: 'file_type' })
    filetype: string;
    @Column({ name: 'file_size', nullable: true })
    filesize: number;
    @Column({ name: 'file_data', type: 'bytea' })
    filedata: Buffer;

    @ManyToOne(() => Note, note => note.id, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'note_id' })
    note: Note;
}