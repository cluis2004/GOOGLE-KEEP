import { Body, Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { NoteService } from "./note.service";
import { NoteDto } from "./dto/note.dto";
import { ReorderDto } from "./dto/reorder.dto";

@Controller("notecontroller")
export class NoteController {
    constructor(
        private readonly service: NoteService
    ) {}

    @Post('getall')
    getAll() {
        return this.service.getAll();
    }

    @Post('getbyuser/:userId')
    getByUser(@Param('userId', ParseIntPipe) userId: number) {
        return this.service.getByUser(userId);
    }

    @Post('getbyid/:id')
    getPerson(@Param('id', ParseIntPipe) id: number) {
        return this.service.getById(id);
    }

    @Post('save')
    async save(@Body() data: NoteDto & { usuario?: { id: number } }) {
        return await this.service.save(data);
    }

    @Post('delete/:id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return await this.service.delete(id);
    }

    @Post('duplicate/:id')
    async duplicate(@Param('id', ParseIntPipe) id: number, @Body() body: { usuario?: { id: number } }) {
        return await this.service.duplicate(id, body.usuario?.id);
    }

    @Post('reorder')
    async reorder(@Body() data: ReorderDto) {
        return await this.service.reorder(data.ids);
    }
}