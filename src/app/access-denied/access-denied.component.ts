import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrl: './access-denied.component.css'
})
export class AccessDeniedComponent implements OnInit {
  errorCode: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    // Generate a unique error code
    this.generateErrorCode();

    // Log the access attempt (in a real app, you'd send this to your backend)
    this.logAccessAttempt();
  }

  generateErrorCode(): void {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.errorCode = `ERR-403-${timestamp}-${random}`;
  }

  logAccessAttempt(): void {
    const logData = {
      timestamp: new Date().toISOString(),
      errorCode: this.errorCode,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      ip: 'Unknown'
    };

    console.warn('Access denied attempt:', logData);
    // In production, send this to your logging service
  }

  // Helper function for HTML
  generateCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  goBack(): void {
    window.history.back();
  }
}
