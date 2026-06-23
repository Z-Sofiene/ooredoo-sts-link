import { Component, Output, EventEmitter, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { GestionService, UserExistResponse } from '../../gestion.service';
import emailjs from '@emailjs/browser';

@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrls: ['./forget-password.component.css'] // ✅ FIXED
})
export class ForgetPasswordComponent {
  @Output() close = new EventEmitter<void>();

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  step = 1;
  email = '';

  generatedCode = '';
  attemptCount = 0;
  maxAttempts = 3;

  countdown = 120;
  countdownInterval: any;

  emailFailCount = 0;
  emailFailMax = 3;
  emailBlockedUntil: number = 0;
  emailBlockInterval: any;

  errorMessage: string = '';

  codeDigits: string[] = ['', '', '', '', '', ''];
  codeError: boolean = false;

  otpIndexes = [0, 1, 2, 3, 4, 5];

  constructor(private gest: GestionService) {}

  // -----------------------
  // Helpers
  // -----------------------
  resetForgotPassword() {
    this.step = 1;
    this.email = '';
    this.generatedCode = '';
    this.attemptCount = 0;
    this.countdown = 60;
    this.errorMessage = '';
    this.codeDigits = ['', '', '', '', '', ''];
    this.codeError = false;

    clearInterval(this.countdownInterval);
    clearInterval(this.emailBlockInterval);
  }

  get isEmailBlocked() {
    return this.emailBlockedUntil > Date.now() / 1000;
  }

  get remainingEmailBlock() {
    return Math.max(0, Math.floor(this.emailBlockedUntil - Date.now() / 1000));
  }

  get formattedEmailBlockTime(): string {
    const remaining = this.remainingEmailBlock;
    if (remaining <= 0) return '0s';

    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return parts.join(' ');
  }

  getCode(): string {
    return this.codeDigits.join('');
  }

  isCodeComplete(): boolean {
    return this.codeDigits.every(d => d !== '');
  }

  private focusIndex(index: number) {
    const el = this.otpInputs?.toArray()?.[index]?.nativeElement;
    if (el) {
      el.focus();
      el.select();
    }
  }

  focusFirstEmpty() {
    const idx = this.codeDigits.findIndex(d => !d);
    this.focusIndex(idx === -1 ? 5 : idx);
  }

  // -----------------------
  // Step 1: send email
  // -----------------------
  async submitEmail() {
    if (!this.email) return;

    if (this.isEmailBlocked) {
      this.errorMessage = `Trop de tentatives. Réessayez dans ${this.formattedEmailBlockTime}`;
      return;
    }

    this.gest.userExist(this.email).subscribe({
      next: async (res: UserExistResponse) => {
        if (!res.success) {
          // server blocked
          if (res.blockedUntil) {
            this.emailBlockedUntil = new Date(res.blockedUntil).getTime() / 1000;
            this.step = 99;
            this.errorMessage = `Trop de tentatives. Réessayez dans ${this.formattedEmailBlockTime}`;

            this.emailBlockInterval = setInterval(() => {
              if (!this.isEmailBlocked) {
                clearInterval(this.emailBlockInterval);
                this.emailFailCount = 0;
                this.errorMessage = '';
                this.step = 1;
              } else {
                this.errorMessage = `Trop de tentatives. Réessayez dans ${this.formattedEmailBlockTime}`;
              }
            }, 1000);

            return;
          }

          // client-side fail counter
          this.emailFailCount++;
          this.errorMessage = `Email incorrect. Tentative ${this.emailFailCount} sur ${this.emailFailMax}.`;

          if (this.emailFailCount >= this.emailFailMax) {
            this.step = 99;
            this.emailBlockedUntil = Math.floor(Date.now() / 1000) + 3600;

            this.emailBlockInterval = setInterval(() => {
              if (!this.isEmailBlocked) {
                clearInterval(this.emailBlockInterval);
                this.emailFailCount = 0;
                this.errorMessage = '';
                this.step = 1;
              } else {
                this.errorMessage = `Trop de tentatives. Réessayez dans ${this.formattedEmailBlockTime}`;
              }
            }, 1000);
          }

          return;
        }

        // email ok
        this.emailFailCount = 0;
        this.step = 2;

        // reset otp state
        this.attemptCount = 0;
        this.errorMessage = '';
        this.codeError = false;
        this.codeDigits = ['', '', '', '', '', ''];

        // generate code (⚠️ should be backend in real app)
        this.generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

        // focus first input
        setTimeout(() => this.focusIndex(0), 0);

        try {
          await emailjs.send(
            'service_sts_fibre',
            'forgot_password_code',
            { email: this.email, code: this.generatedCode },
            '7tbFuzzkjrzUgRG6l'
          );

          clearInterval(this.countdownInterval);
          this.countdown = 120;

          this.countdownInterval = setInterval(() => {
            this.countdown--;

            if (this.countdown <= 0) {
              clearInterval(this.countdownInterval);
              this.generatedCode = '';
              this.step = 1;
              this.errorMessage = 'Le code a expiré, veuillez réessayer.';
            }
          }, 1000);

        } catch (err) {
          this.errorMessage = 'Impossible d’envoyer le code. Réessayez plus tard.';
        }
      },
      error: () => {
        this.errorMessage = 'Erreur serveur. Réessayez plus tard.';
      }
    });
  }

  // -----------------------
  // Step 2: verify code
  // -----------------------
  verifyCode() {
    if (!this.isCodeComplete()) return;

    const entered = this.getCode();

    if (entered === this.generatedCode) {
      this.gest.requestPasswordReset(this.email).subscribe({
        next: () => {
          alert('Lien de réinitialisation envoyé à votre email.');
          this.resetForgotPassword();
          this.closeForgotPasswordDialog();
        },
        error: () => {
          this.errorMessage = 'Erreur serveur. Réessayez plus tard.';
        }
      });
      return;
    }

    this.attemptCount++;
    this.codeError = true;

    if (this.attemptCount >= this.maxAttempts) {
      this.step = 99;
      this.errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
      clearInterval(this.countdownInterval);
      return;
    }

    this.errorMessage = `Code incorrect. Tentative ${this.attemptCount} sur ${this.maxAttempts}.`;
  }

  closeForgotPasswordDialog() {
    this.resetForgotPassword();
    this.close.emit();
  }

  // -----------------------
  // OTP Inputs behavior
  // -----------------------
  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    const key = event.key;

    // allow tab
    if (key === 'Tab') return;

    // backspace behavior
    if (key === 'Backspace') {
      event.preventDefault();

      if (this.codeDigits[index]) {
        this.codeDigits[index] = '';
        return;
      }

      if (index > 0) {
        this.codeDigits[index - 1] = '';
        this.focusIndex(index - 1);
      }
      return;
    }

    // allow arrows
    if (key === 'ArrowLeft') {
      event.preventDefault();
      if (index > 0) this.focusIndex(index - 1);
      return;
    }

    if (key === 'ArrowRight') {
      event.preventDefault();
      if (index < 5) this.focusIndex(index + 1);
      return;
    }

    // allow ctrl shortcuts
    if (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(key.toLowerCase())) return;

    // allow only numbers
    if (!/^[0-9]$/.test(key)) {
      event.preventDefault();
      return;
    }
  }

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // keep only last digit
    const digit = value.replace(/\D/g, '').slice(-1);

    if (!digit) {
      this.codeDigits[index] = '';
      input.value = '';
      return;
    }

    this.codeDigits[index] = digit;
    input.value = digit;
    this.codeError = false;

    // auto next
    if (index < 5) {
      this.focusIndex(index + 1);
    }
  }

  onOtpFocus(index: number): void {
    // If previous is empty, jump to first empty to avoid skipping
    const firstEmpty = this.codeDigits.findIndex(d => !d);
    if (firstEmpty !== -1 && index > firstEmpty) {
      setTimeout(() => this.focusIndex(firstEmpty), 0);
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();

    const pasted = event.clipboardData?.getData('text') ?? '';
    const cleaned = pasted.replace(/\D/g, '').slice(0, 6);

    if (cleaned.length !== 6) return;

    this.codeDigits = cleaned.split('');
    this.codeError = false;

    // focus last
    setTimeout(() => this.focusIndex(5), 0);
  }
}
