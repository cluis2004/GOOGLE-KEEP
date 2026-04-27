import { Component, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StyleClassModule } from 'primeng/styleclass';
import { LayoutService } from '@/app/layout/service/layout.service';
import { SessionService } from '@/app/service/session.service';
import { SearchService } from '@/app/service/search.service';

@Component({
    selector: 'app-topbar',
    standalone: true,
    imports: [RouterModule, CommonModule, StyleClassModule],
    template: ` <div class="layout-topbar">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" (click)="layoutService.onMenuToggle()">
                <i class="pi pi-bars"></i>
            </button>
            <a class="layout-topbar-logo flex items-center gap-1 md:gap-2" routerLink="/">
                <img src="demo/images/google-keep-icon.webp" alt="logo" class="w-10 h-10 object-contain" />
                <span class="text-[1.4rem] md:text-[1.6rem] font-medium text-surface-600 dark:text-surface-200 hidden sm:block" style="letter-spacing: -0.3px; font-family: 'Inter', sans-serif;">Keep</span>
            </a>
        </div>

        <!-- Buscador global estilo Google Keep -->
        <div class="layout-topbar-search flex-1 px-1 md:px-4 flex ml-0 mr-2 md:mr-4" style="max-width: 48rem;">
            <div class="relative w-full">
                <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-surface-700 dark:text-surface-200 z-10 text-xl font-bold"></i>
                <input 
                    type="text" 
                    placeholder="Buscar" 
                    (input)="onSearch($event)"
                    class="w-full bg-surface-100 dark:bg-surface-800 border-none rounded-2xl pl-10 md:pl-12 pr-4 text-base text-surface-900 dark:text-surface-0 placeholder:text-surface-700 dark:placeholder:text-surface-200 placeholder:font-medium focus:bg-surface-0 dark:focus:bg-surface-900 focus:ring-1 focus:ring-surface-300 dark:focus:ring-surface-700 focus:shadow-sm transition-all outline-none h-10 md:h-[46px]"
                    style="font-size: 1rem;"
                />
            </div>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu">
                <button type="button" class="layout-topbar-action" (click)="toggleDarkMode()">
                    <i [ngClass]="{ 'pi ': true, 'pi-moon': layoutService.isDarkTheme(), 'pi-sun': !layoutService.isDarkTheme() }"></i>
                </button>
            </div>

            <button class="layout-topbar-menu-button layout-topbar-action" pStyleClass="@next" enterFromClass="hidden" enterActiveClass="animate-scalein" leaveToClass="hidden" leaveActiveClass="animate-fadeout" [hideOnOutsideClick]="true">
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:block">
                <div class="layout-topbar-menu-content">
                    <div class="relative">
                        <button
                            type="button"
                            class="layout-topbar-action"
                            pStyleClass="@next"
                            enterFromClass="hidden"
                            enterActiveClass="animate-scalein"
                            leaveToClass="hidden"
                            leaveActiveClass="animate-fadeout"
                            [hideOnOutsideClick]="true"
                        >
                            <i class="pi pi-user"></i>
                            <span>Perfil</span>
                        </button>

                        <div class="hidden absolute right-0 top-full mt-2 min-w-44 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-lg p-2 z-50">
                            <a routerLink="/usuario" class="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-100 flex items-center gap-2">
                                <i class="pi pi-user"></i>
                                <span>Mi cuenta</span>
                            </a>
                            <button type="button" class="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-100 flex items-center gap-2" (click)="logout()">
                                <i class="pi pi-sign-out"></i>
                                <span>Cerrar sesión</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`
})
export class AppTopbar {
    items!: MenuItem[];

    layoutService = inject(LayoutService);
    sessionService = inject(SessionService);
    router = inject(Router);
    searchService = inject(SearchService);

    toggleDarkMode() {
        this.layoutService.layoutConfig.update((state) => ({
            ...state,
            darkTheme: !state.darkTheme
        }));
    }

    logout() {
        this.sessionService.delete();
        this.router.navigate(['/auth/login']);
    }

    onSearch(event: Event) {
        const input = event.target as HTMLInputElement;
        this.searchService.setQuery(input.value);
    }
}
