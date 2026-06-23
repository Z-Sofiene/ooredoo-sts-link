import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {GestionService} from '../../gestion.service';

@Component({
  selector: 'app-activate-user',
  templateUrl: './activate-user.component.html',
  styleUrl: './activate-user.component.css'
})
export class ActivateUserComponent implements OnInit {

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
        });

        this.isLoading = false;
      },
      error: () => {
        this.router.navigate(['login']);
      }
    });
  }


  activateAccount(): void {
    if (this.form.invalid) return;

    const data = {
      token: this.token,
      password: this.form.value.password,
      confirm_password: this.form.value.confirmPassword,
    };

    this.loading = true;
    this.message = '';

    this.gestionService.confirmAccount(data).subscribe({
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
