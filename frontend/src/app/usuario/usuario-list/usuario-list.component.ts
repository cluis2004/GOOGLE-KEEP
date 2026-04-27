import { CommonModule } from "@angular/common";
import { Component, afterNextRender, inject, OnInit, signal, viewChild, ViewChild} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DatePickerModule } from "primeng/datepicker";
import { TableModule } from "primeng/table";
import { UsuarioModel } from "../shared/usuario.model";
import { ButtonModule } from "primeng/button";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { ConfirmationService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { BasicService } from "@/app/service/basic.service";
import { UsuarioComponent } from "../usuario/usuario.component";

@Component({
    selector: 'app-usuario-list',
    standalone: true,
    imports: [
        CommonModule,
        DatePickerModule,
        FormsModule,
        TableModule,
        ButtonModule,
        ConfirmDialogModule,
        UsuarioComponent,
        // ToastModule
        // UsuarioComponent
    ],
    providers: [
        ConfirmationService, 
        BasicService
    ],
    templateUrl: './usuario-list.component.html',
})
export class UsuarioListComponent implements OnInit {

     @ViewChild(UsuarioComponent) usuarioComponent!: UsuarioComponent;
    date: Date = new Date();
    dataUsuarios = signal<UsuarioModel[]>([]);

    // Services
    private confirmationService = inject(ConfirmationService);
    service = inject(BasicService);

    constructor() {
        afterNextRender(() => {
            this.loadUsuarios();
        });
    }

    ngOnInit(): void {
    }

    loadUsuarios(): void {
        this.service.basePost(`usuariocontroller/getall`, {}).subscribe(
            (response: UsuarioModel[]) => {
                console.warn('Usuarios', response);
                this.dataUsuarios.set(response);
            },
            error => console.error(error)
        );
    }

    createUsuario() {
         this.usuarioComponent.load(0);
    }

    updateUsuario(data: UsuarioModel) {
        this.usuarioComponent.load(data.id);
    }

    deleteUsuario(data: UsuarioModel, event: Event) {
        console.log('Delete usuario', data);
        this.confirmationService.confirm({
            target: event.target as EventTarget,
            message: `Esta seguro de eliminar este registro? ${data.name}`,
            header: 'Eliminar Usuario!',
            icon: 'pi pi-info-circle',
            rejectLabel: 'Cancel',
            rejectButtonProps: {
                label: 'Cancel',
                severity: 'secondary',
                outlined: true
            },
            acceptButtonProps: {
                label: 'Delete',
                severity: 'danger'
            },
        
            accept: () => {
                this.service.basePost(`usuariocontroller/delete/${data.id}`, {}).subscribe(
                    () => this.loadUsuarios(),
                    error => console.error('Error deleting entity', error)
                );
            },
            reject: () => {
                // this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected' });
            }
        });
    }
}