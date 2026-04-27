import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { UsuarioDto } from './dto/usuario.dto';
import { UsuarioService } from './usuario.service';

@Controller('usuariocontroller')
// @UseGuards(AuthGuard('jwt'))
export class UsuarioController {
  constructor(
    private readonly service: UsuarioService
  ) {}

  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Post('getall')
  getAllUser() {
    return this.service.getAll();
  }

  @Post('getbyemail')
  async getByEmail(@Body() body: { email: string }) {
    return this.service.getByEmail(body.email);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.service.login(body.email, body.password);
  }

  @Post('getbyid/:id')
  getPerson(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id);
  }

  @Post('save')
  async save(@Body() data: UsuarioDto) {
    return await this.service.save(data);
  }

  @Post('delete/:id')
  async deletePerson(@Param('id', ParseIntPipe) id: number) {
    return await this.service.delete(id);
  }

  @Post('jwt')
  async generateJWT(@Body() data: UsuarioDto) {
    return await this.service.generateJWT(data);
  }
  @Post('verifypassword')
  async verifyPassword(@Body() { plainPassword, hashedPassword }: { plainPassword: string; hashedPassword: string }) {
    // plainPassword - 'abc123'
    // hashedPassword - '$2b$12$KIXQj8q1Z5s9e7uXy3GzOe5v1n9s8f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'
    return await this.service.verifyPassword(plainPassword, hashedPassword);
  }
}