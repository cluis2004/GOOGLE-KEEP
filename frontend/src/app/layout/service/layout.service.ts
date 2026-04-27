import { isPlatformBrowser } from '@angular/common';
import { Injectable, effect, signal, computed, inject, PLATFORM_ID } from '@angular/core';

export interface LayoutConfig {
    preset: string;
    primary: string;
    surface: string | undefined | null;
    darkTheme: boolean;
    menuMode: string;
    menuDesktopInactive: boolean;
}

interface LayoutState {
    staticMenuDesktopInactive: boolean;
    overlayMenuActive: boolean;
    configSidebarVisible: boolean;
    mobileMenuActive: boolean;
    menuHoverActive: boolean;
    activePath: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    private readonly storageKey = 'google-keep-layout-config';
    private readonly platformId = inject(PLATFORM_ID);
    private readonly isBrowser = isPlatformBrowser(this.platformId);

    layoutConfig = signal<LayoutConfig>({
        preset: 'Aura',
        primary: 'emerald',
        surface: null,
        darkTheme: false,
        menuMode: 'static',
        menuDesktopInactive: false
    });

    layoutState = signal<LayoutState>({
        staticMenuDesktopInactive: false,
        overlayMenuActive: false,
        configSidebarVisible: false,
        mobileMenuActive: false,
        menuHoverActive: false,
        activePath: null
    });

    theme = computed(() => (this.layoutConfig().darkTheme ? 'dark' : 'light'));

    isSidebarActive = computed(() => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive);

    isDarkTheme = computed(() => this.layoutConfig().darkTheme);

    getPrimary = computed(() => this.layoutConfig().primary);

    getSurface = computed(() => this.layoutConfig().surface);

    isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

    transitionComplete = signal<boolean>(false);

    private initialized = false;

    constructor() {
        const storedConfig = this.readStoredConfig();

        if (storedConfig) {
            this.layoutConfig.update((current) => ({
                ...current,
                ...storedConfig
            }));

            // Sync initial state from config
            if (storedConfig.menuDesktopInactive !== undefined) {
                this.layoutState.update((prev) => ({
                    ...prev,
                    staticMenuDesktopInactive: storedConfig.menuDesktopInactive ?? false
                }));
            }
        }

        if (this.isBrowser) {
            this.persistConfig(this.layoutConfig());
            this.toggleDarkMode(this.layoutConfig());
        }

        effect(() => {
            const config = this.layoutConfig();

            if (!this.initialized || !config) {
                this.initialized = true;
                return;
            }

            this.persistConfig(config);
            this.handleDarkModeTransition(config);
        });
    }

    private readStoredConfig(): Partial<LayoutConfig> | null {
        if (!this.isBrowser) {
            return null;
        }

        const storedConfig = localStorage.getItem(this.storageKey);

        if (!storedConfig) {
            return null;
        }

        try {
            return JSON.parse(storedConfig) as Partial<LayoutConfig>;
        } catch {
            return null;
        }
    }

    private persistConfig(config: LayoutConfig): void {
        if (!this.isBrowser) {
            return;
        }

        localStorage.setItem(this.storageKey, JSON.stringify(config));
    }

    private handleDarkModeTransition(config: LayoutConfig): void {
        if (!this.isBrowser) {
            return;
        }

        const supportsViewTransition = 'startViewTransition' in document;

        if (supportsViewTransition) {
            this.startViewTransition(config);
        } else {
            this.toggleDarkMode(config);
        }
    }

    private startViewTransition(config: LayoutConfig): void {
        document.startViewTransition(() => {
            this.toggleDarkMode(config);
        });
    }

    toggleDarkMode(config?: LayoutConfig): void {
        if (!this.isBrowser) {
            return;
        }

        const _config = config || this.layoutConfig();
        if (_config.darkTheme) {
            document.documentElement.classList.add('app-dark');
        } else {
            document.documentElement.classList.remove('app-dark');
        }
    }

    onMenuToggle() {
        if (this.isOverlay()) {
            this.layoutState.update((prev) => ({ ...prev, overlayMenuActive: !this.layoutState().overlayMenuActive }));
        }

        if (this.isDesktop()) {
            const newState = !this.layoutState().staticMenuDesktopInactive;
            this.layoutState.update((prev) => ({ ...prev, staticMenuDesktopInactive: newState }));
            
            // Persist the preference in config
            this.layoutConfig.update((prev) => ({ ...prev, menuDesktopInactive: newState }));
        } else {
            this.layoutState.update((prev) => ({ ...prev, mobileMenuActive: !this.layoutState().mobileMenuActive }));
        }
    }

    showConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: true }));
    }

    hideConfigSidebar() {
        this.layoutState.update((prev) => ({ ...prev, configSidebarVisible: false }));
    }

    isDesktop() {
        return window.innerWidth > 991;
    }

    isMobile() {
        return !this.isDesktop();
    }
}
