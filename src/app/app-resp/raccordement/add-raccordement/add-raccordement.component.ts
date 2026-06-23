import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GestionService } from '../../../gestion.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-add-raccordement',
  templateUrl: './add-raccordement.component.html',
  styleUrls: ['./add-raccordement.component.css']
})
export class AddRaccordementComponent implements OnInit {
  @Output() refresh = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  chefs_equipes: any[] = [];
  typesRaccordement: any[] = [];
  etatsRaccordement: any[] = [];
  raccordements: any[] = [];

  filteredSources: any[] = [];
  filteredChefs: any[] = [];
  filteredTypes: any[] = [];
  filteredEtats: any[] = [];

  sourceSearch: string = '';
  chefSearch: string = '';

  selectedDebit: string = '';

  isManualDebit = false;
  showDeleteTypesModal = false;
  showTypeModal = false;
  showSourceModal = false;

  pageSize: number = 5;
  sourcePage: number = 1;
  chefPage: number = 1;

  // Flag to track if RDV fields should be shown
  showRdvFields: boolean = false;

  newClient: any = {
    id: '',
    label: '',
    nom: '',
    prenom: '',
    email: '',
    numTelephone: '',
    msisdn: '',
    adresse: '',
    zone: {
      id: '',
      label: ''
    },
    projet: {
      projetId: '',
      nomProjet: '',
      operateur: ''
    }
  };
  lon = 0.0;
  lat = 0.0;
  raccordement: any = {
    titre: '',
    description: '',
    dateRDV: '',
    heureRDV: '',
    numFixe: '',
    longitude: this.lon,
    latitude: this.lat,
    hasBridge: false,
    debit: '',
    distance_travaux: 0.0,
    distance_total: 0.0,
    source: {id: '', titre: ''},
    etatRaccordement: {id: 0, etat: ''},
    typeRaccordement: {id: 0, type: ''},
    chef_equipe: {id: '', nom: '', prenom: '', email: ''},
    client: {id: '', label: '', nom: ''}
  };

  newType = {type: ''};
  newSource: any = { titre: '', lon: this.lon, lat: this.lat, typeRaccordement: {id: 0, type: ''} };

  constructor(private router: Router, private gest: GestionService) {
  }

  ngOnInit(): void {
    this.loadGlobalData();
    const clientFromStorage = localStorage.getItem('newClient');
    if (clientFromStorage != null) {
      this.newClient = JSON.parse(clientFromStorage);
      this.raccordement.client.id = this.newClient.id;
      this.raccordement.client.nom = this.newClient.nom;
      this.raccordement.client.label = this.newClient.label;
      this.raccordement.titre = this.newClient.label;
      this.raccordement.numFixe = this.newClient.msisdn;

      // Check if dateRDV and heureRDV exist
      if (this.newClient.dateRDV && this.newClient.heureRDV) {
        // Use existing values
        this.raccordement.dateRDV = this.newClient.dateRDV;
        this.raccordement.heureRDV = this.newClient.heureRDV;
        this.showRdvFields = false; // Hide input fields
      } else {
        // Set to empty to show input fields
        this.raccordement.dateRDV = '';
        this.raccordement.heureRDV = '';
        this.showRdvFields = true; // Show input fields
      }

      if (['20M', '30M', '50M', '100M'].includes(this.raccordement.debit)) {
        this.selectedDebit = this.raccordement.debit;
      } else if (this.raccordement.debit) {
        this.selectedDebit = 'custom';
      }
    } else {
      this.router.navigate(['/DeniedAccess']);
    }
  }

  private loadGlobalData() {
    this.gest.getGlobalData().subscribe(data => {
      this.chefs_equipes = data.chefs_equipes?.slice().reverse() ?? [];
      this.raccordements = data.raccordements?.slice().reverse() ?? [];
      this.typesRaccordement = data.typesRaccordement ?? [];
      this.etatsRaccordement = data.etatsRaccordement ?? [];
      this.filteredSources = [...this.raccordements];
      this.filteredChefs = [...this.chefs_equipes];
      this.filteredTypes = [...this.typesRaccordement];
      this.filteredEtats = [...this.etatsRaccordement];
    });
  }

  filterSources() {
    const term = this.sourceSearch.toLowerCase().trim();
    this.filteredSources = term
      ? this.raccordements.filter(s => s.titre?.toLowerCase().includes(term))
      : [...this.raccordements];
    this.sourcePage = 1;
  }

  filterChefs() {
    const term = this.chefSearch.toLowerCase().trim();
    this.filteredChefs = term
      ? this.chefs_equipes.filter(c => c.nom?.toLowerCase().includes(term) || c.prenom?.toLowerCase().includes(term))
      : [...this.chefs_equipes];
    this.chefPage = 1;
  }

  // Pagination methods
  getSourceTotalPages(): number {
    return Math.ceil(this.filteredSources.length / this.pageSize);
  }

  getChefTotalPages(): number {
    return Math.ceil(this.filteredChefs.length / this.pageSize);
  }

  prevSourcePage() {
    if (this.sourcePage > 1) this.sourcePage--;
  }

  nextSourcePage() {
    if (this.sourcePage < this.getSourceTotalPages()) this.sourcePage++;
  }

  prevChefPage() {
    if (this.chefPage > 1) this.chefPage--;
  }

  nextChefPage() {
    if (this.chefPage < this.getChefTotalPages()) this.chefPage++;
  }

  addNewType() {
    if (!this.newType.type?.trim()) {
      alert('Veuillez entrer un type');
      return;
    }
    this.gest.addTypeRaccordement(this.newType).subscribe({
      next: (response: any) => {
        if (response.status === 201) {
          const savedType = response.body;

          // Add to dropdowns
          this.typesRaccordement.push(savedType);
          this.filteredTypes.push(savedType);

          // Auto-select it
          this.raccordement.typeRaccordement = savedType;

          // Reset modal
          this.newType = { type: '' };
          this.showTypeModal = false;

          alert('Type ajouté avec succès!');
        } else if (response.status === 409) {
          alert('Erreur : ce type existe déjà.');
        } else {
          alert('Erreur inconnue lors de l\'ajout du type.');
        }
      },
      error: (err) => {
        alert('Erreur serveur lors de l\'ajout du type : ' + err);
      }
    });
  }

  deleteTypeRaccordement(deletedType: any, event: Event): void {
    event.stopPropagation();
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce Type ?')) return;

    this.gest.deleteTypeRaccordement(deletedType.id).subscribe({
      next: () => {
        // Update the arrays properly
        this.typesRaccordement = this.typesRaccordement.filter(c => c.id !== deletedType.id);
        this.filteredTypes = this.filteredTypes.filter(c => c.id !== deletedType.id);

        alert('Type supprimé avec succès !');
      }, error: (err) => {
        alert('Erreur lors de la suppression du type : ' + err);
      }
    });
  }

  isFormValid(): boolean {
    return !!this.raccordement.titre &&
      !!this.raccordement.client?.id &&
      !!this.raccordement.dateRDV &&
      !!this.raccordement.heureRDV &&
      !!this.raccordement.etatRaccordement?.id &&
      !!this.raccordement.typeRaccordement?.id;
  }

  addRaccordement() {
    if (!this.isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    this.raccordement.latitude = this.lat;
    this.raccordement.longitude = this.lon;

    if (this.raccordement.dateRDV) {
      const date = new Date(this.raccordement.dateRDV);
      const day = ('0' + date.getDate()).slice(-2);
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const year = date.getFullYear();
      this.raccordement.dateRDV = `${day}-${month}-${year}`;
    }
    this.gest.addRaccordement(this.raccordement).subscribe({
      next: () => {
        this.raccordement = {
          titre: '',
          description: '',
          dateRDV: '',
          heureRDV: '',
          numFixe: '',
          hasBridge: false,
          longitude: 0.0,
          latitude: 0.0,
          debit: '',
          distance_travaux: 0.0,
          distance_total: 0.0,
          source: {id: '', titre: ''},
          etatRaccordement: {id: 0, etat: ''},
          typeRaccordement: {id: 0, type: ''},
          chef_equipe: {id: '', nom: '', prenom: '', email: ''},
          client: {id: '', label: '', nom: ''}
        };
        alert('Raccordement créé avec succès!');
        localStorage.removeItem('newClient');
        this.router.navigate(['dashboard']);
      },
      error: (err) => {
        alert('Erreur lors de la création du raccordement : ' + err);
      }
    });
  }

  addNewSource() {
    if (!this.newSource.titre || this.newSource.lat == null || this.newSource.lon == null || !this.newSource.typeRaccordement.id) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    const r = {
      titre: this.newSource.titre,
      latitude: this.newSource.lat,
      longitude: this.newSource.lon,
      typeRaccordement: { id: this.newSource.typeRaccordement.id }
    };

    this.gest.addRaccordementSource(r).subscribe({
      next: (response: any) => {
        if (response.status === 201) {
          const source = response.body;
          this.filteredSources.push(source);
          this.raccordement.source = source;
          this.showSourceModal = false;
          this.newSource = {titre: '', lon: this.lon, lat: this.lat, typeRaccordement: {id: 0, type: ''}};
          alert('Source ajoutée !');
        } else if (response.status === 409) {
          alert('Erreur : cete source existe déjà.');
        } else {
          alert("Erreur inconnue lors de l\'ajout d'une source.");
        }
      },
      error: (err) => {
        alert('Erreur ajout source : ' + err)
      }
    });
  }

  selectedDebitOption: string = ''; // '20', '30', '50', '100', 'autre'
  manualDebitValue: number | null = null;

  onDebitChange() {
    if (this.selectedDebitOption === 'autre') {
      this.isManualDebit = true;
      this.raccordement.debit = this.manualDebitValue || null;
    } else {
      this.isManualDebit = false;
      this.raccordement.debit = this.selectedDebitOption;
    }
  }

  onManualDebitChange() {
    this.raccordement.debit = this.manualDebitValue;
  }

  // ========= FIXED MODAL OPENERS =========
  openTypeModal(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.showTypeModal = true;
  }

  openDeleteTypesModal(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.showDeleteTypesModal = true;
  }

  openSourceModal(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    // Always reset clean values when opening
    this.newSource = {
      titre: '',
      lon: this.lon,
      lat: this.lat,
      typeRaccordement: { id: 0, type: '' }
    };

    this.showSourceModal = true;
  }
}
