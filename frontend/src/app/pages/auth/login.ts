import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BasicService } from '../../service/basic.service';
import { SessionService } from '../../service/session.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.html',
    styleUrl: './login.scss'
})
export class Login {
    email = '';
    password = '';
    loading = signal(false);
    error = signal('');

    constructor(
        private readonly service: BasicService,
        private readonly session: SessionService,
        private readonly router: Router
    ) {}

    login(): void {
        if (!this.email.trim() || !this.password.trim()) {
            this.error.set('Por favor completá todos los campos.');
            return;
        }

        this.loading.set(true);
        this.error.set('');

        this.service.basePost('usuariocontroller/login', {
            email: this.email.trim(),
            password: this.password
        }).subscribe({
            next: (user: { id: number; name: string; email: string }) => {
                this.session.save(JSON.stringify(user));
                this.router.navigate(['/']);
            },
            error: () => {
                this.error.set('Correo o contraseña incorrectos.');
                this.loading.set(false);
            }
        });
    }

    onKeyEnter(event: KeyboardEvent): void {
        if (event.key === 'Enter') this.login();
    }
}
