import { IsEmpty, IsOptional } from "class-validator";

export class AttachmentDto {
    @IsOptional()
    id?: number;
    @IsEmpty()
    filename: string;
    @IsEmpty()
    filetype: string;
    @IsEmpty()
    filesize: number;
    @IsEmpty()
    filedata: Buffer;
}