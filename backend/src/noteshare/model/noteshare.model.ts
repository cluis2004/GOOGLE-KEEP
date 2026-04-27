import { Note } from "src/note/model/note.model";
import { Usuario } from "src/usuario/model/usuario.model";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Noteshare {
    @PrimaryGeneratedColumn({name: 'noteshare_id'})
    id: number;

    @Column()
    role: number;

    @ManyToOne(() => Note, data => data.id)
    @JoinColumn({name: 'note_id'})   
    note: Note;

    @ManyToOne(() => Usuario, data => data.id)
    @JoinColumn({name: 'usuario_id'})
    usuario: Usuario;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}