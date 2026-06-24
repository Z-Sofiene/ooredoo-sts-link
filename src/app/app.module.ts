import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AppRhComponent } from './app-rh/app-rh.component';
import { AppRespComponent } from './app-resp/app-resp.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './app-resp/dashboard/dashboard.component';
import { ProjetComponent } from './app-resp/projet/projet.component';
import { RaccordementComponent } from './app-resp/raccordement/raccordement.component';
import { TacheComponent } from './app-resp/tache/tache.component';
import {AuthGuard} from './auth.guard';
import {GestionService} from './gestion.service';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { SidebarComponent } from './app-resp/sidebar/sidebar.component';
import { HeaderComponent } from './app-resp/header/header.component';
import { AddProjetComponent } from './app-resp/projet/add-projet/add-projet.component';
import {BaseChartDirective} from "ng2-charts";
import { FooterComponent } from './app-resp/footer/footer.component';
import { UserModalComponent } from './app-rh/user-modal/user-modal.component';
import { AddRaccordementComponent } from './app-resp/raccordement/add-raccordement/add-raccordement.component';
import { OperateurComponent } from './app-resp/operateur/operateur.component';
import { AddOperateurComponent } from './app-resp/operateur/add-operateur/add-operateur.component';
import { ZoneComponent } from './app-resp/zone/zone.component';
import { AddZoneComponent } from './app-resp/zone/add-zone/add-zone.component';
import { AddClientComponent } from './app-resp/client/add-client/add-client.component';

import { ProduitComponent } from './app-resp/produit/produit.component';
import { AddProduitComponent } from './app-resp/produit/add-produit/add-produit.component';
import {UpdateProjetComponent} from './app-resp/projet/update-projet/update-projet.component';
import { ActivateUserComponent } from './app-rh/activate-user/activate-user.component';
import {AccessDeniedComponent} from './access-denied/access-denied.component';
import {GestionChefTechService} from './chef-tech/gestion-chef-tech.service';
import {ChefTechAuthGuard} from './chef-tech/chef-tech-auth.guard';
import { DashboardChefTechComponent } from './chef-tech/dashboard-chef-tech/dashboard-chef-tech.component';
import {NgOptimizedImage} from '@angular/common';
import { ForgetPasswordComponent } from './login/forget-password/forget-password.component';
import { SetPasswordComponent } from './app-rh/set-password/set-password.component';
import { AddSouszoneComponent } from './app-resp/zone/add-souszone/add-souszone.component';
import { AddCiteComponent } from './app-resp/zone/add-cite/add-cite.component';
import { AddClientsOoredooComponent } from './app-resp/client/add-clients-ooredoo/add-clients-ooredoo.component';
import {ClientComponent} from './app-resp/client/client.component';
import { OperateurOoredooComponent } from './operateur-ooredoo/operateur-ooredoo.component';
import { DetailRaccordementComponent } from './app-resp/raccordement/detail-raccordement/detail-raccordement.component';




@NgModule({
  declarations: [
    AppComponent,
    AppRhComponent,
    AppRespComponent,
    LoginComponent,
    DashboardComponent,
    ProjetComponent,
    RaccordementComponent,
    TacheComponent,
    SidebarComponent,
    HeaderComponent,
    AddProjetComponent,
    FooterComponent,
    UserModalComponent,
    AddRaccordementComponent,
    OperateurComponent,
    AddOperateurComponent,
    ZoneComponent,
    AddZoneComponent,
    AddClientComponent,
    ClientComponent,
    ProduitComponent,
    AddProduitComponent,
    UpdateProjetComponent,
    ActivateUserComponent,
    AccessDeniedComponent,
    DashboardChefTechComponent,
    ForgetPasswordComponent,
    SetPasswordComponent,
    AddSouszoneComponent,
    AddCiteComponent,
    AddClientsOoredooComponent,
    OperateurOoredooComponent,
    RaccordementComponent,
    DetailRaccordementComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BaseChartDirective,
    NgOptimizedImage,
  ],
  providers: [
    GestionService,
    GestionChefTechService,
    ChefTechAuthGuard,
    AuthGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
