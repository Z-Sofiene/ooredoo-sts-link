import { Component } from '@angular/core';
import { GestionService } from '../gestion.service';
import { Router } from '@angular/router';
import { GestionChefTechService } from '../chef-tech/gestion-chef-tech.service';
import {HttpErrorResponse} from '@angular/common/http';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  username = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  isConnected = false;
  isChefTechMode = false;

  constructor(
    private gestChefTech: GestionChefTechService,
    private gest: GestionService,
    private router: Router
  ) {}

  /* ================= LOGIN LOGIC ================= */

  onToggleChange() {
    this.errorMessage = '';
  }
  private navigate(path: string) {
    this.router.navigateByUrl(path).then(success => {
      if (!success) console.warn(`Navigation to ${path} failed`);
    }).catch(err => console.error(err));
  }
  login(request: any) {
    if (!request.username || !request.password) {
      this.errorMessage = 'Veuillez saisir votre nom d\'utilisateur et mot de passe';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.gest.connexion(request).subscribe({
      next: (data: any) => {
        const token = data.body.token;
        this.gest.savetoken(token);
        const roleUser = this.gest.getRoleFromToken();
        this.isLoading = false;
        this.onLoginSuccess();

        if (roleUser === 'ADMIN') {
          this.navigate('/dashboard/admin');
        } else if (roleUser === 'RESPONSABLE' || roleUser === 'CHEFPROJET') {
          this.navigate('/dashboard');
        } else if (roleUser === 'RH') {
          this.navigate('/users');
        } else if (roleUser === 'OOREDOO') {
          this.navigate('/raccordements');
        } else {
          this.gest.logout();
          this.navigate('/login');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;

        if (err.status === 403) {
          this.navigate('/DeniedAccess');
        } else if (err.status === 401) {
          this.errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
        } else {
          this.errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        }
      }

    });
  }

  loginChefTechnicien(request: any) {
    if (!request.username || !request.password) {
      this.errorMessage = 'Veuillez saisir votre nom d\'utilisateur et mot de passe';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.gestChefTech.connexion(request).subscribe({
      next: (data: any) => {
        const token = data.body.token;
        this.gestChefTech.savetoken(token);
        const roleUser = this.gestChefTech.getRoleFromToken();
        this.isLoading = false;
        this.onLoginSuccess();

        if (roleUser === 'CHEF' || roleUser === 'TECHNICIEN') {
          this.navigate('/dashboard/chef-tech');
        } else {
          this.gestChefTech.logout();
          this.navigate('/login');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;

        if (err.status === 403) {
          this.navigate('/DeniedAccess');
        } else if (err.status === 401) {
          this.errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
        } else {
          this.errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        }
      }

    });
  }

  onLoginSuccess() {
    this.isConnected = true;
    setTimeout(() => this.isConnected = false, 3000);
  }

  /* ================= FEEDBACK DIALOG ================= */

  showFeedbackDialog = false;
  feedback = { type: 'message', subject: '', message: '' };

  openFeedbackDialog() {
    this.showFeedbackDialog = true;
  }

  closeFeedbackDialog() {
    this.showFeedbackDialog = false;
    this.feedback = { type: 'message', subject: '', message: '' };
  }

  /* ================= FORGOT PASSWORD ================= */
  showForgotPasswordDialog = false;

  toggleForgotPasswordDialog() {
    this.showForgotPasswordDialog = !this.showForgotPasswordDialog;
  }


}
