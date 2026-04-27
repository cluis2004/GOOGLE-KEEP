import { IsArray, IsInt } from "class-validator";

export class ReorderDto {
    @IsArray()
    @IsInt({ each: true })
    ids: number[]; // IDs en el nuevo orden (posición 0 = order 0, posición 1 = order 1, ...)
}
