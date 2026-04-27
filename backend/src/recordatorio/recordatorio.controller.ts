import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from "@nestjs/common";
import { RecordatorioService } from "./recordatorio.service";

@Controller('recordatorio')
export class RecordatorioController {
    constructor(
        private readonly service: RecordatorioService
    ) {}

    @Get('note/:noteId')
    async getByNote(@Param('noteId', ParseIntPipe) noteId: number) {
        return await this.service.getByNote(noteId);
    }

    @Post('save/:noteId')
    async save(
        @Param('noteId', ParseIntPipe) noteId: number,
        @Body() body: { fecha: string },
        @Query('userId') userId?: string
    ) {
        const uId = userId ? parseInt(userId, 10) : undefined;
        return await this.service.save(body.fecha, noteId, uId);
    }

    @Post('delete/:id')
    async delete(
        @Param('id', ParseIntPipe) id: number,
        @Query('userId') userId?: string
    ) {
        const uId = userId ? parseInt(userId, 10) : undefined;
        return await this.service.delete(id, uId);
    }
}