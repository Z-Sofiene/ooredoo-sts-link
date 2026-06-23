import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import {catchError, map, Observable, throwError} from 'rxjs';
import {environment} from '../../environments/environment';


const downloadDir = 'https://vps-a5d9e339.vps.ovh.net/download/apk/';
const stsgroupe_api = environment.apiUrl;
//const stsgroupe_api = 'https://vps-a5d9e339.vps.ovh.net/sts-dev-backend/';
//const stsgroupe_api = 'http://127.0.0.1:12000/';
@Injectable({
  providedIn: 'root'
})
export class GestionChefTechService {
  username: any = '';
  token: any = '';
  role: any = '';
  name: any = '';

  constructor(private http: HttpClient) {
  }

  savetoken(token: string) {
    const hp = new JwtHelperService();
    this.token = token;
    this.username = hp.decodeToken(token).sub;
    this.role = hp.decodeToken(token).role;
    this.name = hp.decodeToken(token).name;
    localStorage.setItem('token', token);
    localStorage.setItem('username', this.username);
    localStorage.setItem('name', this.name);
    localStorage.setItem('role', this.role);
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');
    const name = localStorage.getItem('name');
    if (!token) {
      localStorage.clear();
      return false;
    }
    return !!token && !!role && !!username && !!name;
  }

  tokenizer() {
    if (this.isLoggedIn()) {
      const token: any = localStorage.getItem('token');
      return new HttpHeaders({Authorization: `Bearer ${token}`});
    }
    return new HttpHeaders();
  }

  // --- Auth ---
  connexion(request: any) {
    return this.http.post(stsgroupe_api + 'auth/login_chef_technicien', request, {observe: 'response'});
  }

  getRoleFromToken() {
    const hp = new JwtHelperService();
    const token: any = localStorage.getItem('token') || null;
    return hp.decodeToken(token).role;
  }

  getNameFromToken() {
    const hp = new JwtHelperService();
    const token: any = localStorage.getItem('token') || null;
    return hp.decodeToken(token).name;
  }

  getEmailFromToken() {
    const hp = new JwtHelperService();
    const token: any = localStorage.getItem('token') || null;
    return hp.decodeToken(token).sub;
  }


  downloadLink(apk: string) {
    if (!this.isLoggedIn()) {
      return null;
    }
    return downloadDir + apk;
  }

  logout() {
    localStorage.clear();
  }

  /* ===================== CORE HTTP ===================== */

  private get<T>(url: string): Observable<T> {
    return this.http.get(stsgroupe_api + url, {
      headers: this.tokenizer(),
      responseType: 'text'
    }).pipe(
      map(res => this.parseToJson<T>(res)),
      catchError(this.handleError(url))
    );
  }


  /* ===================== JSON FIX ===================== */

  private parseToJson<T>(res: string): T {
    const txt = res.trim();

    // Pure JSON
    if (txt.startsWith('{') || txt.startsWith('[')) {
      return JSON.parse(txt);
    }

    // HTML + JSON (ngrok warning page)
    const match = txt.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      return JSON.parse(match[0]);
    }

    throw new Error('No JSON payload found (ngrok HTML response)');
  }
  private handleError(operation = 'operation') {
    return (error: any): Observable<any> => {
      console.error(`${operation} failed: ${error.message}`);
      return throwError(() => new Error(`${operation} failed: ${error.message}`));
    };
  }

  requestPasswordReset(email: string) {
    return;
  }
}
