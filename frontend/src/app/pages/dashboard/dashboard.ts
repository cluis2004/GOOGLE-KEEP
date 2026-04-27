import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal, computed, ElementRef, ViewChild, ViewChildren, QueryList, HostListener, afterNextRender } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BasicService } from '@/app/service/basic.service';
import { SearchService } from '@/app/service/search.service';
import { SessionService } from '@/app/service/session.service';
import { ChecklistComponent, ChecklistItem } from '@/app/components/checklist/checklist.component';
import { HistoryManager } from '@/app/service/history.manager';
import { ShareModalComponent } from '@/app/components/share-modal/share-modal.component';

type NoteModel = {
    id: number;
    title: string;
    content: string;
    activo: boolean;
    order: number;
    type?: string;
    items?: any[];
    attachments?: any[];
    userRole?: number;
    created_at: string | Date;
    updated_at: string | Date;
};

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, DatePipe, FormsModule, ChecklistComponent, ShareModalComponent],
    templateUrl: './dashboard.html',
})
export class Dashboard {
    @ViewChild('drawingCanvas') canvasRef?: ElementRef<HTMLCanvasElement>;
    @ViewChild('canvasContainer') containerRef?: ElementRef<HTMLDivElement>;
    @ViewChild('imageInput') imageInputRef?: ElementRef<HTMLInputElement>;
    @ViewChildren(ChecklistComponent) checklists!: QueryList<ChecklistComponent>;
    
    @ViewChild('newTitleInput') newTitleInput?: ElementRef<HTMLInputElement>;
    @ViewChild('newContentInput') newContentInput?: ElementRef<HTMLTextAreaElement>;
    @ViewChild('editTitleInput') editTitleInput?: ElementRef<HTMLInputElement>;
    @ViewChild('editContentInput') editContentInput?: ElementRef<HTMLTextAreaElement>;

    private readonly service = inject(BasicService);
    private readonly searchService = inject(SearchService);
    private readonly sessionService = inject(SessionService);

    get currentUser(): { id: number; name: string; email: string } | null {
        const raw = this.sessionService.get();
        return raw ? JSON.parse(raw) : null;
    }

    notes = signal<NoteModel[]>([]);

    filteredNotes = computed(() => {
        const query = this.searchService.searchQuery().toLowerCase();
        if (!query) return this.notes();
        return this.notes().filter(note =>
            (note.title && note.title.toLowerCase().includes(query)) ||
            (note.content && note.content.toLowerCase().includes(query))
        );
    });

    loading = signal<boolean>(false);
    error = signal<string>('');
    saving = signal<boolean>(false);
    composerOpen = signal<boolean>(false);
    composerError = signal<string>('');
    deleting = signal<boolean>(false);
    openMenuNoteId = signal<number | null>(null);
    draggedNoteId = signal<number | null>(null);

    editingNote = signal<NoteModel | null>(null);
    savingEdit = signal<boolean>(false);
    showEditMenu = signal<boolean>(false);
    editNoteTitle = '';
    editNoteContent = '';
    editNoteItems: ChecklistItem[] = [];
    editNoteActivo = true;

    newNoteTitle = '';
    newNoteContent = '';
    newNoteType = 'text';
    newNoteItems: ChecklistItem[] = [];

    // Drawing State
    drawingModalOpen = signal<boolean>(false);
    savingDrawing = signal<boolean>(false);
    drawingNoteId: number | null = null;
    isDrawing = false;
    ctx!: CanvasRenderingContext2D;
    drawingColor = '#000000';
    drawingLineWidth = 3;
    lastX = 0;
    lastY = 0;

    // Share modal
    shareModalNoteId = signal<number | null>(null);

    // Undo / Redo — historial de la nota que se está editando en este momento
    private history = new HistoryManager<{ title: string; content: string; items: ChecklistItem[] }>('keep_edit_history', 15);
    canUndo = this.history.canUndo;
    canRedo = this.history.canRedo;
    private editTimeout: any;

    constructor() {
        afterNextRender(() => {
            this.loadNotes();
        });
    }

    loadNotes(): void {
        this.loading.set(true);
        this.error.set('');

        const user = this.currentUser;
        if (!user) return;

        this.service.basePost(`notecontroller/getbyuser/${user.id}`, {}).subscribe({
            next: (response: NoteModel[]) => {
                this.notes.set(response ?? []);
                this.loading.set(false);
            },
            error: () => {
                this.error.set('No se pudieron cargar las notas.');
                this.loading.set(false);
            }
        });
    }

    /** Registra el estado actual del editor en el historial. */
    private pushEditHistory(): void {
        this.history.push([{
            title: this.editNoteTitle,
            content: this.editNoteContent,
            items: JSON.parse(JSON.stringify(this.editNoteItems))
        }]);
    }

    undo(): void {
        if (this.editTimeout) clearTimeout(this.editTimeout);
        const prev = this.history.undo();
        if (prev?.[0]) {
            this.editNoteTitle = prev[0].title;
            this.editNoteContent = prev[0].content;
            this.editNoteItems = JSON.parse(JSON.stringify(prev[0].items));
        }
    }

    redo(): void {
        if (this.editTimeout) clearTimeout(this.editTimeout);
        const next = this.history.redo();
        if (next?.[0]) {
            this.editNoteTitle = next[0].title;
            this.editNoteContent = next[0].content;
            this.editNoteItems = JSON.parse(JSON.stringify(next[0].items));
        }
    }

    /** Llamar desde (ngModelChange) en los inputs del modal. */
    onEditChange(immediate: boolean = false): void {
        if (this.editTimeout) {
            clearTimeout(this.editTimeout);
        }
        
        if (immediate) {
            this.pushEditHistory();
        } else {
            // Guarda el historial después de 300ms sin escribir (más rápido)
            this.editTimeout = setTimeout(() => {
                this.pushEditHistory();
            }, 300);
        }
    }

    openComposer(type: string = 'text'): void {
        this.newNoteType = type;
        this.composerOpen.set(true);
        this.composerError.set('');
        
        setTimeout(() => {
            if (this.newTitleInput) {
                this.newTitleInput.nativeElement.focus();
            }
        }, 50);
    }

    cancelComposer(): void {
        this.newNoteTitle = '';
        this.newNoteContent = '';
        this.newNoteType = 'text';
        this.newNoteItems = [];
        this.composerError.set('');
        this.composerOpen.set(false);
    }

    createNote(): void {
        // Flush any text typed but not yet confirmed with Enter
        this.checklists.forEach(c => c.flushPending && c.flushPending());

        const title = this.newNoteTitle.trim();
        const content = this.newNoteContent.trim();

        if (this.newNoteType === 'text' && !content) {
            this.composerError.set('Escribe contenido para guardar la nota.');
            return;
        }

        if (this.newNoteType === 'list' && this.newNoteItems.length === 0) {
            this.composerError.set('Añade al menos un elemento a la lista.');
            return;
        }

        this.saving.set(true);
        this.composerError.set('');

        const payload: any = {
            title: title || 'Sin titulo',
            activo: true,
            type: this.newNoteType,
            usuario: this.currentUser ? { id: this.currentUser.id } : undefined
        };

        if (this.newNoteType === 'text') {
            payload.content = content;
        } else {
            payload.content = '';
            payload.items = this.newNoteItems;
        }

        this.service
            .basePost('notecontroller/save', payload)
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.cancelComposer();
                    this.loadNotes();
                },
                error: () => {
                    this.saving.set(false);
                    this.composerError.set('No se pudo guardar la nota.');
                }
            });
    }

    openEditModal(note: NoteModel): void {
        this.editingNote.set(note);
        this.editNoteTitle = note.title !== 'Sin titulo' ? note.title : '';
        this.editNoteContent = note.content || '';
        this.editNoteItems = note.items ? JSON.parse(JSON.stringify(note.items)) : [];
        this.editNoteActivo = note.activo;
        this.openMenuNoteId.set(null);
        this.showEditMenu.set(false);
        document.body.style.overflow = 'hidden';

        // Iniciar historial limpio para esta sesión de edición
        this.history.clear();
        this.history.init([{ 
            title: this.editNoteTitle, 
            content: this.editNoteContent,
            items: JSON.parse(JSON.stringify(this.editNoteItems))
        }]);

        setTimeout(() => {
            if (this.editTitleInput) {
                this.editTitleInput.nativeElement.focus();
            }
        }, 50);
    }

    closeEditModal(): void {
        if (this.editTimeout) clearTimeout(this.editTimeout);
        this.editingNote.set(null);
        this.showEditMenu.set(false);
        document.body.style.overflow = '';
        // Limpiar historial al cerrar — ya no se puede deshacer fuera del editor
        this.history.clear();
    }

    toggleEditMenu(event: Event): void {
        event.stopPropagation();
        this.showEditMenu.set(!this.showEditMenu());
    }

    onTitleEnter(event: Event, isNew: boolean): void {
        event.preventDefault();
        if (isNew) {
            if (this.newNoteType === 'text') {
                this.newContentInput?.nativeElement.focus();
            } else {
                this.checklists.first?.focusFirstItem();
            }
        } else {
            const note = this.editingNote();
            if (!note) return;
            if (note.type === 'text' || !note.type) {
                this.editContentInput?.nativeElement.focus();
            } else {
                const checklist = this.checklists.find(c => c.items === this.editNoteItems) || this.checklists.last;
                checklist?.focusFirstItem();
            }
        }
    }

    deleteEditingNote(event: Event): void {
        event.stopPropagation();
        const note = this.editingNote();
        if (note) {
            this.deleteNote(note, event);
            this.closeEditModal();
        }
    }

    updateNote(): void {
        const currentNote = this.editingNote();
        if (!currentNote) return;

        const title = this.editNoteTitle.trim();
        const content = this.editNoteContent.trim();

        const isEmptyText = currentNote.type === 'text' && !content;
        const isEmptyList = currentNote.type === 'list' && this.editNoteItems.length === 0;

        // Lector (role=3) solo puede cerrar, no guardar cambios
        if (currentNote.userRole === 3) {
            this.closeEditModal();
            return;
        }

        if (!title && (isEmptyText || isEmptyList)) {
            this.closeEditModal();
            return;
        }

        this.savingEdit.set(true);

        const payload: any = {
            id: currentNote.id,
            title: title || 'Sin titulo',
            activo: this.editNoteActivo,
            type: currentNote.type,
            usuario: this.currentUser ? { id: this.currentUser.id } : undefined
        };

        if (currentNote.type === 'list') {
            payload.content = '';
            payload.items = this.editNoteItems;
        } else {
            payload.content = content;
        }

        this.service
            .basePost('notecontroller/save', payload)
            .subscribe({
                next: () => {
                    this.savingEdit.set(false);
                    this.closeEditModal();
                    this.loadNotes();
                },
                error: () => {
                    this.savingEdit.set(false);
                    alert('No se pudo actualizar la nota.');
                }
            });
    }

    toggleCardMenu(noteId: number, event: Event): void {
        event.stopPropagation();
        this.openMenuNoteId.update((current) => (current === noteId ? null : noteId));
    }

    deleteNote(note: NoteModel, event: Event): void {
        event.stopPropagation();

        if (this.deleting()) {
            return;
        }

        const userId = this.currentUser?.id;
        if (!userId) return;

        this.deleting.set(true);

        this.service.basePost(`notecontroller/delete/${note.id}?userId=${userId}`, {}).subscribe({
            next: () => {
                this.deleting.set(false);
                this.openMenuNoteId.set(null);
                this.notes.update((current) => current.filter((n) => n.id !== note.id));
            },
            error: () => {
                this.deleting.set(false);
                this.error.set('No se pudo eliminar la nota.');
                this.openMenuNoteId.set(null);
            }
        });
    }

    duplicateNote(note: NoteModel, event: Event): void {
        event.stopPropagation();

        this.openMenuNoteId.set(null);

        this.service.basePost(`notecontroller/duplicate/${note.id}`, {
            usuario: this.currentUser ? { id: this.currentUser.id } : undefined
        }).subscribe({
            next: () => {
                this.loadNotes(); // Recargar las notas para ver la copia
            },
            error: () => {
                this.error.set('No se pudo duplicar la nota.');
            }
        });
    }

    toggleItemChecked(note: NoteModel, item: any): void {
        if (note.userRole === 3) return;

        item.checked = !item.checked;

        const payload = {
            id: note.id,
            title: note.title,
            content: note.content || '',
            activo: note.activo,
            type: note.type,
            items: note.items,
            usuario: this.currentUser ? { id: this.currentUser.id } : undefined
        };

        // Save to backend immediately
        this.service.basePost('notecontroller/save', payload).subscribe({
            next: () => {
                // silent success
            },
            error: () => {
                item.checked = !item.checked;
                this.error.set('Error al guardar el estado de la tarea.');
            }
        });
    }

    onDragStart(note: NoteModel): void {
        this.draggedNoteId.set(note.id);
        this.openMenuNoteId.set(null);
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
    }

    onDrop(targetNote: NoteModel): void {
        const sourceId = this.draggedNoteId();

        if (sourceId == null || sourceId === targetNote.id) {
            this.draggedNoteId.set(null);
            return;
        }

        this.notes.update((current) => {
            const sourceIndex = current.findIndex((n) => n.id === sourceId);
            const targetIndex = current.findIndex((n) => n.id === targetNote.id);

            if (sourceIndex === -1 || targetIndex === -1) {
                return current;
            }

            const reordered = [...current];
            const [moved] = reordered.splice(sourceIndex, 1);
            reordered.splice(targetIndex, 0, moved);
            return reordered;
        });

        this.draggedNoteId.set(null);

        // Persistir el nuevo orden en el backend
        const newOrder = this.notes().map((n) => n.id);
        this.service.basePost('notecontroller/reorder', { ids: newOrder }).subscribe();
    }

    onDragEnd(): void {
        this.draggedNoteId.set(null);
    }

    @HostListener('document:click')
    closeMenus(): void {
        this.openMenuNoteId.set(null);
        this.showEditMenu.set(false);
    }

    // --- DRAWING LOGIC ---
    openDrawingModal(noteId: number | null = null): void {
        this.drawingNoteId = noteId;
        this.drawingModalOpen.set(true);
        setTimeout(() => this.initCanvas(), 50);
    }

    closeDrawingModal(): void {
        this.drawingModalOpen.set(false);
    }

    initCanvas(): void {
        if (!this.canvasRef || !this.containerRef) return;
        const canvas = this.canvasRef.nativeElement;
        const container = this.containerRef.nativeElement;
        
        // Ajustar tamaño del canvas al contenedor
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height); // Fondo blanco por defecto
            this.ctx = context;
            this.updateCanvasContext();
        }
    }

    updateCanvasContext(): void {
        if (!this.ctx) return;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.lineWidth = this.drawingLineWidth;
        this.ctx.strokeStyle = this.drawingColor;
    }

    clearCanvas(): void {
        if (!this.ctx || !this.canvasRef) return;
        const canvas = this.canvasRef.nativeElement;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    startDrawing(e: MouseEvent): void {
        this.isDrawing = true;
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
    }

    draw(e: MouseEvent): void {
        if (!this.isDrawing || !this.ctx) return;
        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(e.offsetX, e.offsetY);
        this.ctx.stroke();
        this.lastX = e.offsetX;
        this.lastY = e.offsetY;
    }

    stopDrawing(): void {
        this.isDrawing = false;
    }

    saveDrawing(): void {
        if (!this.canvasRef) return;
        this.savingDrawing.set(true);
        
        const canvas = this.canvasRef.nativeElement;
        canvas.toBlob((blob) => {
            if (!blob) {
                this.savingDrawing.set(false);
                return;
            }

            const formData = new FormData();
            formData.append('file', blob, `drawing_${Date.now()}.png`);

            // Si es una nota existente, adjuntarlo. Si no, crear nota vacía primero.
            if (this.drawingNoteId) {
                this.uploadAttachment(this.drawingNoteId, formData);
            } else {
                const user = this.currentUser;
                if (!user) {
                    this.savingDrawing.set(false);
                    return;
                }

                this.service.basePost('notecontroller/save', {
                    title: 'Dibujo',
                    content: '',
                    activo: true,
                    usuario: { id: user.id }
                }).subscribe({
                    next: () => {
                        // Recargar notas para obtener la nueva nota que fue la última creada
                        this.service.basePost(`notecontroller/getbyuser/${user.id}`, {}).subscribe((notes: NoteModel[]) => {
                            if (notes && notes.length > 0) {
                                // Buscar la nota más reciente del usuario actual.
                                const newNote = notes.reduce((prev, current) => (prev.id > current.id) ? prev : current);
                                this.uploadAttachment(newNote.id, formData);
                            }
                        });
                    },
                    error: () => this.savingDrawing.set(false)
                });
            }
        }, 'image/png');
    }

    uploadAttachment(noteId: number, formData: FormData): void {
        const userId = this.currentUser?.id;
        if (!userId) return;

        this.service.basePost(`attachment/upload/${noteId}?userId=${userId}`, formData).subscribe({
            next: () => {
                this.savingDrawing.set(false);
                this.closeDrawingModal();
                this.loadNotes();
                
                // Si estamos editando esta nota, actualizar sus adjuntos en la vista
                if (this.editingNote()?.id === noteId) {
                    this.service.basePost('notecontroller/getall', {}).subscribe((notes: NoteModel[]) => {
                        const updated = notes.find(n => n.id === noteId);
                        if (updated) {
                            this.editingNote.set(updated);
                        }
                    });
                }
            },
            error: () => {
                this.savingDrawing.set(false);
                alert('Error al guardar el adjunto');
            }
        });
    }

    // --- IMAGE UPLOAD LOGIC ---
    triggerImageUpload(noteId: number | null = null): void {
        this.drawingNoteId = noteId; // Reutilizamos esta variable para rastrear la nota destino
        if (this.imageInputRef) {
            this.imageInputRef.nativeElement.click();
        }
    }

    onImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            const formData = new FormData();
            formData.append('file', file);

            this.savingDrawing.set(true); // Reusamos el estado de carga

            if (this.drawingNoteId) {
                this.uploadAttachment(this.drawingNoteId, formData);
            } else {
                const user = this.currentUser;
                if (!user) {
                    this.savingDrawing.set(false);
                    return;
                }

                // Crear nota vacía primero para adjuntar la imagen
                this.service.basePost('notecontroller/save', {
                    title: 'Imagen adjunta',
                    content: '',
                    activo: true,
                    usuario: { id: user.id }
                }).subscribe({
                    next: () => {
                        this.service.basePost(`notecontroller/getbyuser/${user.id}`, {}).subscribe((notes: NoteModel[]) => {
                            if (notes && notes.length > 0) {
                                const newNote = notes.reduce((prev, current) => (prev.id > current.id) ? prev : current);
                                this.uploadAttachment(newNote.id, formData);
                            }
                        });
                    },
                    error: () => this.savingDrawing.set(false)
                });
            }
            // Limpiar input
            input.value = '';
        }
    }

    deleteAttachment(attachmentId: number, noteId: number, event?: Event): void {
        event?.stopPropagation();
        const userId = this.currentUser?.id;
        if (!userId) return;

        this.service.basePost(`attachment/delete/${attachmentId}?userId=${userId}`, {}).subscribe({
            next: () => {
                this.loadNotes();
                
                // Actualizar la vista del modal si estamos editando
                if (this.editingNote()?.id === noteId) {
                    const currentEditing = this.editingNote();
                    if (currentEditing && currentEditing.attachments) {
                        const updatedAttachments = currentEditing.attachments.filter(a => a.id !== attachmentId);
                        this.editingNote.set({ ...currentEditing, attachments: updatedAttachments });
                    }
                }
            },
            error: () => {
                alert('No se pudo eliminar la imagen');
            }
        });
    }
}
