import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BasicService } from '@/app/service/basic.service';

export type ShareRole = 1 | 2 | 3; // 1=propietario, 2=editor, 3=lector

export interface Collaborator {
    id: number;
    role: ShareRole;
    usuario: { id: number; name: string; email: string };
    note: { id: number; title: string };
}

@Component({
    selector: 'app-share-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './share-modal.component.html',
    styleUrl: './share-modal.component.scss'
})
export class ShareModalComponent implements OnInit {
    @Input() noteId!: number;
    @Output() close = new EventEmitter<void>();

    collaborators = signal<Collaborator[]>([]);
    loading = signal(false);
    adding = signal(false);
    addError = signal('');

    emailInput = '';
    selectedRole: ShareRole = 2;

    private readonly AVATAR_COLORS = [
        '#4285f4', '#ea4335', '#34a853', '#fbbc04',
        '#ff6d00', '#46bdc6', '#7c4dff', '#f06292'
    ];

    constructor(private readonly service: BasicService) {}

    ngOnInit(): void {
        this.loadCollaborators();
    }

    loadCollaborators(): void {
        this.loading.set(true);
        this.service.basePost(`notesharecontroller/getbynote/${this.noteId}`, {}).subscribe({
            next: (data: Collaborator[]) => {
                this.collaborators.set(data ?? []);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });
    }

    addCollaborator(): void {
        const email = this.emailInput.trim();
        if (!email) return;

        this.adding.set(true);
        this.addError.set('');

        // 1. Buscar el usuario por email
        this.service.basePost('usuariocontroller/getbyemail', { email }).subscribe({
            next: (user: { id: number; name: string; email: string }) => {
                // 2. Verificar si ya es colaborador
                const exists = this.collaborators().some(c => c.usuario.id === user.id);
                if (exists) {
                    this.addError.set('Este usuario ya es colaborador de esta nota.');
                    this.adding.set(false);
                    return;
                }

                // 3. Crear la colaboración
                const payload = {
                    role: Number(this.selectedRole),
                    note: { id: this.noteId },
                    usuario: { id: user.id }
                };
                this.service.basePost('notesharecontroller/save', payload).subscribe({
                    next: () => {
                        this.emailInput = '';
                        this.adding.set(false);
                        this.loadCollaborators();
                    },
                    error: () => {
                        this.addError.set('No se pudo agregar el colaborador.');
                        this.adding.set(false);
                    }
                });
            },
            error: () => {
                this.addError.set(`No se encontró ningún usuario con el email "${email}".`);
                this.adding.set(false);
            }
        });
    }

    updateRole(collaborator: Collaborator): void {
        const payload = {
            id: collaborator.id,
            role: Number(collaborator.role),
            note: { id: collaborator.note.id },
            usuario: { id: collaborator.usuario.id }
        };
        this.service.basePost('notesharecontroller/save', payload).subscribe();
    }

    removeCollaborator(collaborator: Collaborator): void {
        this.service.basePost(`notesharecontroller/deletebyid/${collaborator.id}`, {}).subscribe({
            next: () => {
                this.collaborators.update(list => list.filter(c => c.id !== collaborator.id));
            }
        });
    }

    avatarColor(name: string): string {
        if (!name) return this.AVATAR_COLORS[0];
        const idx = name.charCodeAt(0) % this.AVATAR_COLORS.length;
        return this.AVATAR_COLORS[idx];
    }
}
