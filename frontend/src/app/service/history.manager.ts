import { signal, computed } from '@angular/core';

/**
 * HistoryManager<T>
 * Clase reutilizable para gestionar historial de estados con undo/redo.
 * Persiste los snapshots en localStorage (máximo `maxSize` entradas).
 *
 * Uso:
 *   const history = new HistoryManager<MiTipo>('mi_key_localStorage', 3);
 *   history.init(estadoInicial);
 *   history.push(estadoActual);      // antes de una mutación
 *   const anterior = history.undo(); // restaura el estado anterior
 *   const siguiente = history.redo();
 */
export class HistoryManager<T> {
    private readonly storageKey: string;
    private readonly maxSize: number;

    private _stack = signal<T[][]>([]);
    private _idx = signal<number>(-1);

    readonly canUndo = computed(() => this._idx() > 0);
    readonly canRedo = computed(() => this._idx() < this._stack().length - 1);

    constructor(storageKey: string, maxSize = 3) {
        this.storageKey = storageKey;
        this.maxSize = maxSize;
    }

    /** Inicializa el historial. Llama tras cargar los datos iniciales. */
    init(initial: T[]): void {
        const saved = this._load();
        if (saved.length > 0) {
            this._stack.set(saved);
            this._idx.set(saved.length - 1);
        } else {
            const first = [[...initial]];
            this._stack.set(first);
            this._idx.set(0);
            this._persist(first, 0);
        }
    }

    /**
     * Guarda el estado actual ANTES de una mutación.
     * Descarta los estados "futuros" (redo) que hubieran quedado.
     */
    push(currentState: T[]): void {
        const base = this._stack().slice(0, this._idx() + 1);
        base.push([...currentState]);
        const final = base.slice(-this.maxSize);
        this._stack.set(final);
        this._idx.set(final.length - 1);
        this._persist(final, final.length - 1);
    }

    /** Retrocede un paso. Retorna el estado anterior o null si no se puede. */
    undo(): T[] | null {
        const idx = this._idx();
        if (idx <= 0) return null;
        const newIdx = idx - 1;
        this._idx.set(newIdx);
        localStorage.setItem(`${this.storageKey}_idx`, String(newIdx));
        return [...this._stack()[newIdx]];
    }

    /** Avanza un paso (tras haber hecho undo). Retorna el estado siguiente o null. */
    redo(): T[] | null {
        const idx = this._idx();
        const stack = this._stack();
        if (idx >= stack.length - 1) return null;
        const newIdx = idx + 1;
        this._idx.set(newIdx);
        localStorage.setItem(`${this.storageKey}_idx`, String(newIdx));
        return [...stack[newIdx]];
    }

    /** Limpia el historial y localStorage. */
    clear(): void {
        this._stack.set([]);
        this._idx.set(-1);
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(`${this.storageKey}_idx`);
    }

    private _persist(stack: T[][], idx: number): void {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(stack));
            localStorage.setItem(`${this.storageKey}_idx`, String(idx));
        } catch {
            // localStorage puede fallar en modo privado o con cuota llena
        }
    }

    private _load(): T[][] {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) ?? '[]');
        } catch {
            return [];
        }
    }
}
