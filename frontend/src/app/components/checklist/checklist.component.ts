import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type ChecklistItem = { text: string; checked: boolean };

@Component({
    selector: 'app-checklist',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <!-- Existing items -->
        <div class="flex flex-col gap-1.5">
            <div
                *ngFor="let item of items; let i = index"
                class="flex items-center gap-2 group rounded px-1 py-1"
                [class.cursor-pointer]="!editable"
                [class.opacity-50]="draggedIndex === i"
                [attr.draggable]="editable ? 'true' : 'false'"
                (dragstart)="onDragStart(i, $event)"
                (dragover)="onDragOver($event, i)"
                (drop)="onDrop($event, i)"
                (dragend)="onDragEnd()"
            >
                <!-- Drag Handle (6 dots) - Always visible -->
                <div *ngIf="editable" class="flex items-center text-surface-400 cursor-grab shrink-0" title="Arrastrar">
                    <i class="pi pi-ellipsis-v text-[0.6rem]" style="margin-right: -4px;"></i>
                    <i class="pi pi-ellipsis-v text-[0.6rem]"></i>
                </div>

                <button
                    *ngIf="editable"
                    type="button"
                    class="text-surface-400 hover:text-surface-600 shrink-0 flex items-center justify-center w-5 h-5"
                    (click)="$event.stopPropagation(); toggle(item)"
                >
                    <i class="pi text-[1.1rem]" [ngClass]="item.checked ? 'pi-check-square' : 'pi-stop'"></i>
                </button>
                <button
                    *ngIf="!editable"
                    type="button"
                    class="shrink-0 flex items-center justify-center hover:opacity-80 transition-opacity"
                    (click)="$event.stopPropagation(); toggle(item)"
                >
                    <i
                        class="pi text-base"
                        [ngClass]="item.checked ? 'pi-check-square text-surface-400' : 'pi-stop text-surface-400'"
                    ></i>
                </button>

                <input
                    #itemInput
                    *ngIf="editable"
                    type="text"
                    [(ngModel)]="item.text"
                    (ngModelChange)="itemsChange.emit(items)"
                    class="flex-1 bg-transparent border-none outline-none text-[0.9rem] text-surface-700 dark:text-surface-200"
                    [class.line-through]="item.checked"
                    [class.text-surface-400]="item.checked"
                />
                <span
                    *ngIf="!editable"
                    class="flex-1 text-[0.9rem]"
                    [ngClass]="item.checked ? 'line-through text-surface-400' : 'text-surface-700 dark:text-surface-200'"
                >{{ item.text }}</span>

                <button
                    *ngIf="editable"
                    type="button"
                    class="text-surface-300 hover:text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center justify-center w-6 h-6"
                    (click)="$event.stopPropagation(); remove(i)"
                >
                    <i class="pi pi-times text-sm"></i>
                </button>
            </div>
        </div>

        <!-- Add new item row (only when editable) -->
        <div *ngIf="editable" class="flex items-center gap-2 mt-2 px-1 py-1">
            <div class="shrink-0 w-[0.85rem]"></div> <!-- Spacer to align with drag handle -->
            <button type="button" class="text-surface-400 hover:text-surface-600 shrink-0 flex items-center justify-center w-5 h-5" (click)="add()">
                <i class="pi pi-plus text-[1.1rem]"></i>
            </button>
            <input
                #newItemInput
                type="text"
                [(ngModel)]="newItemText"
                (keyup.enter)="add()"
                (blur)="add()"
                placeholder="Elemento de la lista"
                class="flex-1 bg-transparent border-none outline-none text-[0.9rem] text-surface-700 dark:text-surface-200 placeholder:text-surface-500"
            />
        </div>
    `
})
export class ChecklistComponent {
    @Input() items: ChecklistItem[] = [];
    @Input() editable = false;
    @Output() itemsChange = new EventEmitter<ChecklistItem[]>();
    @Output() itemToggled = new EventEmitter<ChecklistItem>();
    @Output() structuralChange = new EventEmitter<void>();

    @ViewChildren('itemInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;
    @ViewChild('newItemInput') newItemInput!: ElementRef<HTMLInputElement>;

    newItemText = '';

    add(): void {
        if (this.newItemText.trim()) {
            this.items.push({ text: this.newItemText.trim(), checked: false });
            this.newItemText = '';
            this.itemsChange.emit(this.items);
            this.structuralChange.emit();
        }
    }

    /** Called by parent before saving to flush any pending typed text. */
    flushPending(): void {
        this.add();
    }

    remove(index: number): void {
        this.items.splice(index, 1);
        this.itemsChange.emit(this.items);
        this.structuralChange.emit();
    }

    toggle(item: ChecklistItem, event?: Event): void {
        event?.stopPropagation();
        item.checked = !item.checked;
        this.itemToggled.emit(item);
        this.itemsChange.emit(this.items);
        this.structuralChange.emit();
    }

    // --- Drag & Drop logic ---
    draggedIndex: number | null = null;

    onDragStart(index: number, event: DragEvent) {
        if (!this.editable) return;
        this.draggedIndex = index;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', index.toString()); // required for Firefox
        }
    }

    onDragOver(event: DragEvent, index: number) {
        if (!this.editable || this.draggedIndex === null) return;
        event.preventDefault(); // necessary to allow drop
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    }

    onDrop(event: DragEvent, index: number) {
        if (!this.editable || this.draggedIndex === null || this.draggedIndex === index) return;
        event.preventDefault();
        
        const movedItem = this.items.splice(this.draggedIndex, 1)[0];
        this.items.splice(index, 0, movedItem);
        
        this.draggedIndex = null;
        this.itemsChange.emit(this.items);
        this.structuralChange.emit();
    }

    onDragEnd() {
        this.draggedIndex = null;
    }

    focusFirstItem() {
        if (this.inputs && this.inputs.first) {
            this.inputs.first.nativeElement.focus();
        } else if (this.newItemInput) {
            this.newItemInput.nativeElement.focus();
        }
    }
}
