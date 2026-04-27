import { Controller, Param, ParseIntPipe, Post, Get, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import { AttachmentService } from "./attachment.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Response } from "express";

@Controller('attachment')
// @UseGuards(AuthGuard('jwt'))
export class AttachmentController {
    constructor(
        private readonly service: AttachmentService
    ) {}

    @Post('getall')
    getAll() {
        return this.service.getAll();
    }

    @Post('upload/:id')
    @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
    async saveFile(
        @UploadedFile() file: Express.Multer.File,
        @Param('id', ParseIntPipe) id: number) {
        return await this.service.save(file, id);
    }

    @Get('view/:id')
    async viewFile(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
        const attachment = await this.service.getById(id);
        res.set({
            'Content-Type': attachment.filetype,
            'Content-Disposition': `inline; filename="${attachment.filename}"`,
        });
        res.send(attachment.filedata);
    }

    @Post('delete/:id')
    async deleteFile(@Param('id', ParseIntPipe) id: number) {
        return await this.service.delete(id);
    }
}