import { CommonModule } from "@angular/common";
import { Component, EventEmitter, inject, Output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePickerModule } from "primeng/datepicker";
import { TableModule } from "primeng/table";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { BasicService } from "@/app/service/basic.service";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { UsuarioModel } from "../shared/usuario.model";

@Component({
    selector: 'app-usuario',
    standalone: true,
    imports: [
        CommonModule,
        DatePickerModule,
        FormsModule,
        TableModule,
        ButtonModule,
        ConfirmDialogModule,
        // ToastModule
        DialogModule,
        InputTextModule
    ],
    providers: [
        BasicService
    ],
    templateUrl: './usuario.component.html',
})
export class UsuarioComponent {
    http = inject(BasicService);
    visible = signal<boolean>(false);
    entity = signal<UsuarioModel>(new UsuarioModel());
    @Output() messageEvent = new EventEmitter<boolean>();

    constructor() {
    }
      
    load(entityId: number) {
        if (entityId > 0) {
            this.http.basePost(`usuariocontroller/getbyid/${entityId}`, {}).subscribe(
                (response: UsuarioModel) => {
                    this.entity.set({
                        id: response.id,
                        name: response.name,
                        email: response.email,
                        password: ''
                    } as UsuarioModel);
                    this.onDialogVisibleChange(true);
                },
                error => console.error('Error loading entity', error)
            );
            return;
        }

        this.entity.set(new UsuarioModel());
        this.onDialogVisibleChange(true);
    }

    saveMethod() {
        const entity = this.entity();
        const payload: Partial<UsuarioModel> = {
            id: entity.id,
            name: entity.name,
            email: entity.email,
            password: entity.password
        };

        if (payload.id && !payload.password?.trim()) {
            delete payload.password;
        }

        this.http.basePost(`usuariocontroller/save`, payload).subscribe(
            () => {
                this.closeDialog();
                this.messageEvent.emit(true);
            },
            error => console.error('Error saving entity', error)
        );
    }

    saveChanges() {
        // save entity or update entity
    }

    onDialogVisibleChange(value: boolean): void {
        this.visible.set(value);
    }

    closeDialog(): void {
        this.entity.set(new UsuarioModel());
        this.visible.set(false);
    }

  
}