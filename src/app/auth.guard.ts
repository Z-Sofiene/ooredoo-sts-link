import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Get allowed roles from route data
    const allowedRoles: string[] = route.data['roles'] || [];

    if (allowedRoles.includes(role ?? '')) {
      return true;
    }
    this.router.navigate(['/DeniedAccess']);
    return false;
  }
}
