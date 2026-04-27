import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Usuario } from "./model/usuario.model";
import { InjectRepository } from "@nestjs/typeorm";
import { UsuarioDto } from "./dto/usuario.dto";
// import { bcrypt } from 'bcrypt';
const bcrypt = require('bcrypt');

@Injectable()
export class UsuarioService {
    constructor(
        @InjectRepository(Usuario)
        private readonly repository: Repository<Usuario>
    ) {}

    getAll() {
        return this.repository.find({
            select: ['id', 'name', 'email', 'created_at', 'updated_at'] // Excluye el campo password
        });
    }

    getById(id: number) {
        var data = this.repository.findOne({
            where: { id },
            select: ['id', 'name', 'email', 'created_at', 'updated_at']
        });
        return data;
    }

    async getByEmail(email: string) {
        const user = await this.repository.findOne({
            where: { email },
            select: ['id', 'name', 'email']
        });
        if (!user) throw new NotFoundException(`No se encontró ningún usuario con el email ${email}`);
        return user;
    }

    async login(email: string, plainPassword: string) {
        // Obtener hash sin exponerlo al frontend
        const user = await this.repository.findOne({
            where: { email },
            select: ['id', 'name', 'email', 'password']
        });
        if (!user) throw new NotFoundException('Credenciales incorrectas.');

        const valid = await bcrypt.compareSync(plainPassword, user.password);
        if (!valid) throw new NotFoundException('Credenciales incorrectas.');

        return { id: user.id, name: user.name, email: user.email };
    }

    async save(data: UsuarioDto) {
        if(data.id != undefined && data.id != null && data.id != 0) {
            const usuario = await this.repository.findOneBy({id: data.id});
            if(!usuario) throw new Error(`Usuario con id ${data.id} no encontrado`);

            if(data.password) {
                data.password = await this.createHashedPassword(data.password);
            }

            await this.repository.update({id: data.id}, data);
            return 'Se actualizo correctamente!!!';
        } else {
            const email = await this.repository.findOne({ where: { email: data.email } });
            if(email) throw new Error(`El email ${data.email} ya está registrado`);

            if(!data.password || !data.password.trim()) {
                throw new Error('La contraseña es obligatoria');
            }

            const hashedPassword = await this.createHashedPassword(data.password);
            data.password = hashedPassword;

            await this.repository.save(data);
            return 'Se guardo correctamente!!!';
        }
    }

    async delete(id: number) {
        var data = await this.findById(id); // Verifica si el usuario existe antes de eliminarlo
        if (!data) throw new NotFoundException(`Usuario con id ${id} no encontrado`);
        await this.repository.delete({id});
        return 'Se elimino correctamente!!!';
    }

    async findById(id: number) {
        const usuario = await this.repository.findOne({
            where: { id },
            select: ['id', 'name', 'email', 'created_at', 'updated_at'] // Excluye el campo password
        });

        if(!usuario) throw new NotFoundException(`Usuario con id ${id} no encontrado`);

        return usuario;
    }

    async generateJWT(data: UsuarioDto) {
        if(!data.password || !data.password.trim()) {
            throw new Error('La contraseña es obligatoria');
        }

        return await this.createHashedPassword(data.password);
    }

    // Metodo para crear una contraseña hasheada
    async createHashedPassword(password: string): Promise<string> {
        var SALT_ROUNDS = 12;
        return await bcrypt.hashSync(password, SALT_ROUNDS);
    }
    // Método para verificar la contraseña
    async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compareSync(plainPassword, hashedPassword);
    }
}