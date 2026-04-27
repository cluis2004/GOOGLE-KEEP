import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class NoteDto {

    @IsOptional()
    id?: number;

    @IsNotEmpty()
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    content: string;
    
    @IsBoolean()
    activo: boolean;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    items?: any;
}