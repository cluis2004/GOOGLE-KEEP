import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UsuarioDto {
    @IsOptional()
    @IsNumber()
    id?: number;

    @IsNotEmpty({message: 'El nombre es obligatorio'})
    @IsString()
    @MinLength(3, {message: 'El nombre debe tener al menos 3 caracteres'})
    @MaxLength(50, {message: 'El nombre no debe exceder los 50 caracteres'})
    name: string;

    @IsNotEmpty({message: 'El email es obligatorio'})
    @IsEmail({}, {message: 'El email no es válido'})
    @MaxLength(150)
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(6, {message: 'La contraseña debe tener al menos 6 caracteres'})
    @MaxLength(50, {message: 'La contraseña no debe exceder los 50 caracteres'})
    password: string;
}