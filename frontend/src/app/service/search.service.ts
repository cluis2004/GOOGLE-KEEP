import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchService {
    searchQuery = signal<string>('');

    setQuery(query: string) {
        this.searchQuery.set(query);
    }
}
