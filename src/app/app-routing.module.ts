// app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

import { LoginComponent } from './login/login.component';

// RESPONSABLE components
import { AppRespComponent } from './app-resp/app-resp.component';
import { ProjetComponent } from './app-resp/projet/projet.component';
import { RaccordementComponent } from './app-resp/raccordement/raccordement.component';

// RH components
import { AppRhComponent } from './app-rh/app-rh.component';
import {AddRaccordementComponent} from './app-resp/raccordement/add-raccordement/add-raccordement.component';

import {ZoneComponent} from './app-resp/zone/zone.component';
import {OperateurComponent} from './app-resp/operateur/operateur.component';
import {ProduitComponent} from './app-resp/produit/produit.component';
import {ActivateUserComponent} from './app-rh/activate-user/activate-user.component';
import {AccessDeniedComponent} from './access-denied/access-denied.component';
import {ChefTechAuthGuard} from './chef-tech/chef-tech-auth.guard';
import {DashboardChefTechComponent} from './chef-tech/dashboard-chef-tech/dashboard-chef-tech.component';
import {SetPasswordComponent} from './app-rh/set-password/set-password.component';
import {DashboardOoredooComponent} from './app-resp/dashboard-ooredoo/dashboard-ooredoo.component';

const routes: Routes = [
  // default redirect
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  { path: 'user/activate', component: ActivateUserComponent },
  { path: 'user/reset-password', component: SetPasswordComponent },
  { path: 'DeniedAccess', component: AccessDeniedComponent },

  { path: 'dashboard/chef-tech',
    component: DashboardChefTechComponent,
    canActivate: [ChefTechAuthGuard],
    data: { roles: ['CHEF', 'TECHNICIEN'] }
  },


  {
    path: '',
    component: AppRespComponent,
    canActivate: [AuthGuard],
    data: { roles: ['CHEFPROJET', 'RH', 'RESPONSABLE', 'ADMIN', 'OOREDOO'] },
    children: [
      { path: 'dashboard', component: ZoneComponent, canActivate: [AuthGuard], data: { roles: ['RESPONSABLE', 'CHEFPROJET'] } },
      { path: 'projets', component: ProjetComponent, canActivate: [AuthGuard], data: { roles: ['CHEFPROJET', 'ADMIN'] } },
      { path: 'operateurs', component: OperateurComponent, canActivate: [AuthGuard], data: { roles: ['CHEFPROJET', 'ADMIN'] } },
      { path: 'articles', component: ProduitComponent, canActivate: [AuthGuard], data: { roles: ['RESPONSABLE', 'CHEFPROJET'] } },
      { path: 'statistique', component: DashboardOoredooComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN', 'RESPONSABLE', 'CHEFPROJET','OOREDOO'] } },
      { path: 'raccordements', component: RaccordementComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN', 'RESPONSABLE', 'CHEFPROJET','OOREDOO'] } },
      { path: 'addRaccordement', component: AddRaccordementComponent, canActivate: [AuthGuard], data: { roles: ['RESPONSABLE', 'CHEFPROJET'] } },
      { path: 'users', component: AppRhComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN', 'CHEFPROJET', 'RH'] } },
    ],
  },

  { path: '**', redirectTo: '' }, // catch-all
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
