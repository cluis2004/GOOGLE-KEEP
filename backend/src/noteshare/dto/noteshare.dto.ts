import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { NoteDto } from "src/note/dto/note.dto";
import { UsuarioDto } from "src/usuario/dto/usuario.dto";

export class NoteshareDto {
    @IsNumber()
    @IsOptional()
    id?: number;

    @IsNumber()
    @IsNotEmpty()
    role: number;
    
    @IsNotEmpty()
    note: NoteDto;

    @IsNotEmpty()
    usuario: UsuarioDto;
    
}