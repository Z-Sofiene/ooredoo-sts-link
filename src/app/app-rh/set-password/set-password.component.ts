import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {GestionService} from '../../gestion.service';

@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.css'
})
export class SetPasswordComponent implements OnInit {
  form!: FormGroup;
  errorMessage = '';
  isLoading = false;

  token!: string;

  message = '';
  success = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private gestionService: GestionService
  ) {}
  passwordsMatch(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { notMatching: true };
  }
  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.router.navigate(['login']);
      return;
    }

    this.isLoading = true;
    this.gestionService.confirmToken(this.token).subscribe({
      next: (isValid) => {

        if (!isValid) {
          this.router.navigate(['login']);
          return;
        }

        this.form = this.fb.group({
          password: ['', [Validators.required, Validators.minLength(6)]],
          confirmPassword: ['', Validators.required],
        }, { validators: this.passwordsMatch });

        this.isLoading = false;
      },
      error: (err) => {
        this.router.navigate(['login']);
      }
    });
  }


  resetPassword(): void {
    if (this.form.invalid) return;

    const data = {
      token: this.token,
      password: this.form.value.password,
      confirm_password: this.form.value.confirmPassword,
    };

    this.loading = true;
    this.message = '';

    this.gestionService.resetPassword(data).subscribe({
      next: (res) => {
        this.success = true;
        this.message = res;
        this.form.reset();
        this.loading = false;
      },
      error: (err) => {
        this.success = false;
        this.message = err.error || 'Activation failed';
        this.loading = false;
      },
    });
  }
}
