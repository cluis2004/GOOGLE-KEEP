import { Body, Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { NoteShareService } from "./noteshare.service";
import { NoteshareDto } from "./dto/noteshare.dto";

@Controller("notesharecontroller")
export class NoteShareController {
    constructor(
        private readonly service: NoteShareService
    ) {}

    @Post('getall')
    async getAll() {
        return await this.service.getAll();
    }

    @Post('getbyid/:id')
    async get(@Param('id', ParseIntPipe) id: number) {
        return await this.service.getById(id);
    }

    @Post('getbynote/:noteId')
    async getByNote(@Param('noteId', ParseIntPipe) noteId: number) {
        return await this.service.getByNoteId(noteId);
    }

    @Post('save')
    async save(@Body() data: NoteshareDto) {
        return await this.service.save(data);
    }

    @Post('deletebyid/:id')
    async delete(@Param('id', ParseIntPipe) id: number) {
        return await this.service.delete(id);
    }
}