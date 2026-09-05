import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  mostrarPassword = false;
  shake = false;
  cargando = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.username.trim() || !this.password.trim()) {
      this.error = 'Por favor ingresa usuario y contraseña';
      this.triggerShake();
      return;
    }
    this.cargando = true;
    this.error = '';
    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        this.error = err.error?.message || 'Usuario o contraseña incorrectos';
        this.triggerShake();
      }
    });
  }

  triggerShake() {
    this.shake = true;
    setTimeout(() => this.shake = false, 600);
  }

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }
}

