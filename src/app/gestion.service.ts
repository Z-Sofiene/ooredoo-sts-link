import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {catchError, map, Observable, of, throwError} from 'rxjs';
import { JwtHelperService } from '@auth0/angular-jwt';
import {environment} from '../environments/environment';


export interface UserExistResponse {
  success: boolean;
  message: string;
  blockedUntil?: string; // optional, only when IP is blocked
}

const downloadDir = 'https://vps-a5d9e339.vps.ovh.net/download/apk/';
const stsgroupe_api = environment.apiUrl;
@Injectable({
  providedIn: 'root'
})
export class GestionService {
  username: any = '';
  token: any = '';
  role: any = '';
  name: any = '';

  constructor(private http: HttpClient) {}

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
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
    return new HttpHeaders();
  }

  // --- Auth ---
  connexion(request: any) {
    return this.http.post(stsgroupe_api + 'auth/login', request, { observe: 'response' });
  }

  getRoleFromToken() {
    const hp = new JwtHelperService();
    const token: any = localStorage.getItem('token') || null;
    return hp.decodeToken(token).role;
  }

  downloadLink(apk: string){
    if (!this.isLoggedIn()){
      return null;
    }
    return downloadDir + apk;
  }

  addChefProjet(formData: FormData): Observable<any> {
    return this.http.post(stsgroupe_api + 'rh/chef_projet/add', formData, { headers: this.tokenizer() });
  }

  addResponsable(formData: FormData): Observable<any> {
    return this.http.post(stsgroupe_api + 'rh/responsable/add', formData, { headers: this.tokenizer() });
  }

  addTech(formData: FormData): Observable<any> {
    return this.http.post(stsgroupe_api + 'rh/technicien/add', formData, { headers: this.tokenizer() });
  }

  addChef(formData: FormData): Observable<any> {
    return this.http.post(stsgroupe_api + 'rh/chef_equipe/add', formData, { headers: this.tokenizer() });
  }

  addAdmin(formData: FormData): Observable<any> {
    return this.http.post(stsgroupe_api + 'admin/add', formData, { headers: this.tokenizer() });
  }

  deleteUser(userId: string): Observable<any> {
    return this.http.post(stsgroupe_api + `rh/user/delete/${userId}`, { headers: this.tokenizer() });
  }

  // --- Global Data ---


  createProjet(projet: any): Observable<any> {
    return this.http.post(stsgroupe_api + 'responsable/projet/add', projet, { headers: this.tokenizer() });
  }

  createSoutraitance(soutraitance: any): Observable<any> {
    return this.http.post(stsgroupe_api + 'rh/soutraitance/add', soutraitance, { headers: this.tokenizer() });
  }
  createOperateur(operateur: any): Observable<any> {
    return this.http.post(stsgroupe_api + 'responsable/operateur/add', operateur, { headers: this.tokenizer() });
  }

  deleteProjet(id: string): Observable<any> {
    return this.http.delete(stsgroupe_api + `responsable/projet/${id}`, { headers: this.tokenizer(), responseType: 'text'})
      .pipe(
        catchError(this.handleError('deleteProjet'))
      );
  }

  addClient(newClient: any): Observable<any> {
    // Remove responseType: 'text' — let Angular infer JSON
    return this.http.post<any>(stsgroupe_api + 'responsable/client/add', newClient, {
      headers: this.tokenizer()
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  addTypeRaccordement(newType: any): Observable<any> {
    return this.http.post(
      stsgroupe_api + 'responsable/type_raccordement/add',
      newType,
      {
        headers: this.tokenizer(),
        observe: 'response'  // so we can get status code
      }
    ).pipe(
      catchError((err) => {
        // Instead of throwing, return the error object as observable
        return of(err); // wrap error into an observable
      })
    );
  }
  deleteTypeRaccordement(id: string) {
    return this.http.delete(stsgroupe_api + `responsable/type_raccordement/${id}`, { headers: this.tokenizer(), responseType: 'text' })
      .pipe(
        catchError(this.handleError('deleteTypeRaccordement'))
      );
  }
  addRaccordement(newRaccordement: any): Observable<any> {
    const payload = JSON.stringify(newRaccordement); // <-- stringify the object
    return this.http.post(
      stsgroupe_api + 'responsable/raccordement/add',
      payload,
      { headers: this.tokenizer() }
    ).pipe(catchError(this.handleError('addRaccordement')));
  }


  private handleError(operation = 'operation') {
    return (error: any): Observable<any> => {
      console.error(`${operation} failed: ${error.message}`);
      return throwError(() => new Error(`${operation} failed: ${error.message}`));
    };
  }

  logout() {
    localStorage.clear();
  }


  /* ===================== USERS ===================== */

  getAllUsers(): Observable<any[]> {
    return this.get<any[]>('rh/users');
  }

  getUserById(id: string): Observable<any> {
    return this.get<any>(`rh/user/${id}`);
  }
  /* ===================== GLOBAL ===================== */

  getGlobalData(): Observable<{
    chefs_equipes: any[],
    projets: any[],
    raccordements: any[],
    taches: any[],
    etatsRaccordement: any[],
    typesRaccordement: any[],
    clients: any[]
  }> {
    return this.get<any>('responsable/globaldata');
  }
  getRaccordementsGlobalData(): Observable<{
    chefs_equipes: any[],
    etatsRaccordement: any[],
    typesRaccordement: any[]
  }> {
    return this.get<any>('responsable/globaldata/ooredoo');
  }
  /* ===================== PROJETS ===================== */

  getAllProjets(): Observable<any[]> {
    return this.get<any[]>('responsable/projet/list');
  }

  /* ===================== Soutraitance ===================== */

  getAllSoutraitances(): Observable<any[]> {
    return this.get<any[]>('rh/soutraitance/list');
  }
  /* ===================== OPERATEURS ===================== */

  getAllOperateurs(): Observable<any[]> {
    return this.get<any[]>('responsable/operateur/list');
  }

  /* ===================== RACCORD ===================== */

  getAllRaccordementByResponsable(): Observable<any[]> {
    return this.get<any[]>('responsable/raccordement/list');
  }
  getAllRaccordementsToExcel(projetId: string): Observable<any[]> {
    return this.get<any[]>(`responsable/${projetId}/raccordements`);
  }
  getAllRaccordement(): Observable<any[]> {
    return this.get<any[]>('responsable/raccordements');
  }
  /* ===================== Zones And Projets ===================== */
  getAllZonesAndProjets(): Observable<{
    dataZonesAndProjetDTOS: any[],
    operateurs: any[]
  }> {
    return this.get<any>('responsable/projet/zones');
  }

  getAllProduits() : Observable<any[]> {
    return this.get<any[]>('api/produit/list');
  }
  getAllProduitData(): Observable<{
    operateurs: any[],
    typeArticles: any[],
  }> {
    return this.get<any>('api/produit/data');
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

  deleteZone(zoneId: string) {
    return this.http.delete(stsgroupe_api + `responsable/zone/${zoneId}`, { headers: this.tokenizer(), responseType: 'text' })
      .pipe(
        catchError(this.handleError('deleteZone'))
      );
  }

  createZone(zone: any) {
    const payload = JSON.stringify(zone); // <-- stringify the object
    return this.http.post(
      stsgroupe_api + 'responsable/zone/add',
      payload,
      { headers: this.tokenizer() }
    ).pipe(catchError(this.handleError('createZone')));
  }
//

  getAllCLients(id: string, param: string): Observable<any> {
    return this.http.get(stsgroupe_api + 'responsable/'+param+'/clients',
      { params: { id }, headers: this.tokenizer()})
      .pipe(catchError(this.handleError('getAllCLients')));
  }


  deleteClient(clientId: string) {
    return this.http.delete(stsgroupe_api + `responsable/client/delete/${clientId}`, { headers: this.tokenizer(), responseType: 'text'})
      .pipe(
        catchError(this.handleError('deleteZone'))
      );
  }

  deleteProduit(prodId: string) {
    return this.http.delete(stsgroupe_api + `api/produit/delete/${prodId}`, { headers: this.tokenizer(), responseType: 'text' })
      .pipe(
        catchError(this.handleError('deleteProduit'))
      );

  }


  addProduit(newProduit: any): Observable<any> {
    const payload = JSON.stringify(newProduit); // <-- stringify the object
    return this.http.post(
      stsgroupe_api + 'api/produit',
      payload,
      { headers: this.tokenizer() }
    ).pipe(catchError(this.handleError('addProduit')));
  }

  updateProjet(payload: any) {
    return this.http.put(stsgroupe_api + 'responsable/projet/update', payload, { headers: this.tokenizer() });
  }

  deleteOperateur(id: string) {
    return this.http.delete(stsgroupe_api + `responsable/operateur/delete/${id}`, { headers: this.tokenizer(), responseType: 'text'})
      .pipe(
        catchError(this.handleError('deleteoperateur'))
      );
  }

  confirmAccount(data: {
    token: string;
    password: string;
    confirm_password: string;
  }): Observable<string> {
    return this.http.post(
      stsgroupe_api +'auth/confirm',
      data,
      { responseType: 'text' }
    );
  }

  userExist(email: string) {
    return this.http.get<UserExistResponse>(stsgroupe_api + 'auth/userExists', {
      params: { email }
    });
  }


  requestPasswordReset(email: string) {
    return this.http.post(stsgroupe_api + 'auth/forget_password', email, { observe: 'response' });
  }
  resetPassword(data: {
    token: string;
    password: string;
    confirm_password: string;
  }): Observable<string> {
    return this.http.post(
      stsgroupe_api +'auth/reset_password',
      data,
      { responseType: 'text' }
    );
  }

  confirmToken(token: string) {
    return this.http.get<boolean>(
      stsgroupe_api + 'auth/confirmTokenValid',
      {
        params: { token }
      }
    );
  }

  deleteSousZone(sousZoneId: string) {
    return this.http.delete(stsgroupe_api + `responsable/souzone/delete/${sousZoneId}`, { headers: this.tokenizer(), responseType: 'text'})
      .pipe(
        catchError(this.handleError('deleteSousZone'))
      );
  }

  addRaccordementSource(raccordementSource: { titre: any; latitude: any; longitude: any; typeRaccordement: { id: any } }) {
      const source = JSON.stringify(raccordementSource);
      return this.http.post(
        stsgroupe_api + 'responsable/raccordement-source/add',
        source,
        { headers: this.tokenizer(),
          observe: 'response'
        }
      ).pipe(
        catchError((err) => {
          return of(err);
        })
      );
  }

  deleteSoutraitance(id: any) {
    return this.http.delete(stsgroupe_api + `rh/soutraitance/delete/${id}`, { headers: this.tokenizer(), responseType: 'text'})
      .pipe(
        catchError(this.handleError('deleteSoutraitance'))
      );
  }

  batchAddClientsTunTel(data: any[]) {
    return this.http.post(
      stsgroupe_api + 'responsable/clients/tuntel/add',
      data,
      { headers: this.tokenizer(),
        observe: 'response'
      }
    ).pipe(
      catchError((err) => {
        return of(err);
      })
    );
  }
  batchAddClientsZoneOoredoo(data: any[]) {
    return this.http.post(
      stsgroupe_api + 'responsable/clients/zone/ooredoo/add',
      data,
      { headers: this.tokenizer(),
        observe: 'response'
      }
    ).pipe(
      catchError((err) => {
        return of(err);
      })
    );
  }
  batchAddClientsOoredoo(data: any[]) {
    return this.http.post(
      stsgroupe_api + 'responsable/clients/ooredoo/add',
      data,
      { headers: this.tokenizer(),
        observe: 'response'
      }
    ).pipe(
      catchError((err) => {
        return of(err);
      })
    );
  }

  getAllEtatOT() {
    return this.get<any[]>('responsable/etatots');
  }

  getAllUsersReg(): Observable<any[]> {
    return this.get<any[]>('rh/users/not_enabled');
  }

  getTachesRaccordementByClient(clientId: string | undefined): Observable<any> {
    return this.http.get(stsgroupe_api + `responsable/fiche_client/${clientId}`,
      {headers: this.tokenizer()})
      .pipe(catchError(this.handleError('getAllTachesRaccordementByClient')));
  }
  addAllRaccordements(raccordementsDTO: any) {
    return this.http.post(
      stsgroupe_api + 'responsable/raccordements/ooredoo/addAll',
      raccordementsDTO,
      { headers: this.tokenizer(),
        observe: 'response'
      }
    ).pipe(
      catchError((err) => {
        return of(err);
      })
    );
  }

  deleteMultipleClients(clientIds: string[]) {
    return this.http.delete(
      stsgroupe_api + `responsable/client/delete-multiple`,
      {
        headers: this.tokenizer(),
        body: clientIds,
        responseType: 'text',
      }
    ).pipe(
      catchError(this.handleError('deleteMultipleClients'))
    );
  }

  addAgentOoredoo(formData: FormData): Observable<any> {
    return this.http.post(stsgroupe_api + 'admin/agent_ooredoo/add', formData, { headers: this.tokenizer() });
  }

}
