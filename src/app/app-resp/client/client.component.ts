import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import { GestionService } from '../../gestion.service';

interface Cite { id: string; nomCite: string; clientsCount: number; }
interface SousZone { id: string; label: string; clientsCount: number; cites: Cite[]; }
interface Zone { id: string; label: string; clientsCount: number; sousZones?: SousZone[]; }
interface Projet { id: string; nomProjet: string; }
interface Operateur { id: number; nomOperateur: string; }
interface Raccordement { id: number; titre: string; raccordementId?: number; label?: string; }
interface EtatRaccordement { id: number; etat: string;}
interface TypeRaccordement { id: number; type: string; }
interface RaccordementsDTO {
  chefEmail: string;
  type: TypeRaccordement;
  etat: EtatRaccordement;
  raccordements: Raccordement[];
}

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css']
})
export class ClientComponent implements OnInit, OnChanges {
  @Input() zone: Zone | null = null;
  @Input() sousZone: SousZone | null = null;
  @Input() cite: Cite | null = null;
  @Input() projet: Projet | null = null;
  @Input() operateur: Operateur | null = null;
  @Input() param: String | undefined;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  chefs_equipes: any[] = [];
  typesRaccordement: any[] = [];
  etatsRaccordement: any[] = [];

  filteredTypes: any[] = [];
  newType = {type: ''};

  showDeleteTypesModal = false;
  showTypeModal = false;

  viewMode: 'clients' | 'raccordements' = 'clients';
  selectedEtat: string = 'all';

  clients: any[] = [];
  currentPage = 1;
  pageSize = 6;
  searchTerm = '';
  id = '';
  pathParam = '';
  selectedSousZone: SousZone | null = null;
  selectedCite: Cite | null = null;
  showAddRaccordementModal = false;
  showMultiAssignModal = false;
  sousZones: SousZone[] = [];
  showTacheModel = false;
  selectedClientId: string | null = null;
  raccordement: Raccordement | null = null;

  // Sorting properties
  sortField: 'dateRDV' | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Multi-assign properties
  multiAssignData = {
    selectedClients: new Set<any>(),
    selectedChefEquipe: '',
    selectedType: null as TypeRaccordement | null,
    selectedEtatRaccordement: null as EtatRaccordement | null,
  };

  deletedClients = {
    selectedClients: new Set<any>(),
  };
  constructor(private gest: GestionService) {}

  ngOnInit(): void {
    this.loadGlobalData();
    this.tryLoadClients();
  }

  private tryLoadClients(): void {
    let id = '';
    let pathParam = '';

    if (this.cite?.id && this.param == 'cite') {
      id = this.cite.id;
      pathParam = 'cite';
    }
    else if (this.sousZone?.id && this.param == 'souszone') {
      id = this.sousZone.id;
      pathParam = 'souszone';
    }
    else if (this.zone?.id && this.param == 'zone') {
      id = this.zone.id;
      pathParam = 'zone';
    }
    else if (this.projet?.id && this.param == 'projet') {
      id = this.projet.id;
      pathParam = 'projet';
    }

    // important: prevent useless API calls
    if (id && pathParam && (id !== this.id || pathParam !== this.param)) {
      this.id = id;
      this.pathParam = pathParam;
      this.loadClients(id, pathParam);
    }
  }

  private loadGlobalData() {
    this.gest.getRaccordementsGlobalData().subscribe(data => {
      this.chefs_equipes = data.chefs_equipes?.slice().reverse() ?? [];
      this.typesRaccordement = data.typesRaccordement ?? [];
      this.etatsRaccordement = data.etatsRaccordement ?? [];
      this.filteredTypes = [...this.typesRaccordement];
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    let shouldReload = false;

    if (changes['sousZone'] && !(this as any)._userChangedSousZone) {
      this.selectedSousZone = this.sousZone;
    }

    if (changes['cite'] && !(this as any)._userChangedCite) {
      this.selectedCite = this.cite;
    }

    if (changes['zone'] || changes['projet']) {
      shouldReload = true;
    }

    if (shouldReload) {
      this.tryLoadClients();
    }

    (this as any)._userChangedSousZone = false;
    (this as any)._userChangedCite = false;
    (this as any)._filteredCache = null;
  }

  onSousZoneChange() {
    this.selectedCite = null;
    (this as any)._userChangedSousZone = true;
    (this as any)._filteredCache = null;
  }

  onCiteChange() {
    (this as any)._userChangedCite = true;
    (this as any)._filteredCache = null;
  }

  filterByEtat(etat: string) {
    this.selectedEtat = etat;
    (this as any)._filteredCache = null;
    this.currentPage = 1;
  }

  getEtatCount(etat: string): number {
    if (etat === 'all') {
      return this.clients.length;
    }
    return this.clients.filter(client => client.etatRaccordement === etat).length;
  }

  loadClients(id: string, param: string) {
    this.gest.getAllCLients(id, param).subscribe({
      next: res => {
        if (Array.isArray(res)) {
          this.clients = [...res].reverse();
        } else if (res?.data && Array.isArray(res.data)) {
          this.clients = [...res.data].reverse();
        } else {
          this.clients = [];
        }

        // Reset sorting when loading new clients
        this.sortField = null;
        this.sortDirection = 'asc';

        this.rebuildHierarchy();
        (this as any)._filteredCache = null;
        this.clearSelection();
      },
      error: err => console.error('Failed to load clients:', err)
    });
  }

  addNewType() {
    if (!this.newType.type?.trim()) {
      alert('Veuillez entrer un type');
      return;
    }

    this.gest.addTypeRaccordement(this.newType).subscribe({
      next: (response: any) => {
        if (response && response.id) {
          // Add to dropdowns
          this.typesRaccordement.push(response);
          this.filteredTypes.push(response);

          // Reset modal
          this.newType = { type: '' };
          this.showTypeModal = false;

          alert('Type ajouté avec succès!');
        } else if (response.status === 409) {
          alert('Erreur : ce type existe déjà.');
        } else {
          alert('Type ajouté avec succès!');
          this.newType = { type: '' };
          this.showTypeModal = false;
          this.loadGlobalData();
        }
      },
      error: (err) => {
        if (err.status === 409) {
          alert('Erreur : ce type existe déjà.');
        } else {
          alert('Erreur serveur lors de l\'ajout du type : ' + err.message);
        }
      }
    });
  }

  deleteTypeRaccordement(type: any, event: Event) {
    event.stopPropagation();
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le type "${type.type}" ?`)) return;

    this.gest.deleteTypeRaccordement(type.id).subscribe({
      next: () => {
        this.typesRaccordement = this.typesRaccordement.filter(t => t.id !== type.id);
        this.filteredTypes = this.filteredTypes.filter(t => t.id !== type.id);
        alert('Type supprimé avec succès!');
        if (this.typesRaccordement.length === 0) {
          this.showDeleteTypesModal = false;
        }
      },
      error: (err) => console.error('Error deleting type:', err)
    });
  }

  toggleTacheModal(clientId: string) {
    this.selectedClientId = clientId;
    this.showTacheModel = true;
  }

  toggleAddRaccordementModal(client: any) {
    localStorage.setItem('newClient', JSON.stringify(client));
    this.showAddRaccordementModal = !this.showAddRaccordementModal;
  }

  // Sorting method
  toggleSort(field: 'dateRDV') {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    // Invalidate cached filtered list
    (this as any)._filteredCache = null;
    this.currentPage = 1;
  }

  private getDateTimeValue(client: any): number {
    if (!client.dateRDV || !client.heureRDV) return 0;
    // Combine date and time strings into a sortable timestamp
    const dateTimeStr = `${client.dateRDV}T${client.heureRDV}:00`;
    return new Date(dateTimeStr).getTime();
  }

  // Multi-assign methods

  openMultiAssignModal() {
    if (this.multiAssignData.selectedClients.size === 0) {
      alert('Veuillez sélectionner au moins un client');
      return;
    }
    this.showMultiAssignModal = true;
  }

  closeMultiAssignModal() {
    this.showMultiAssignModal = false;
    this.multiAssignData.selectedChefEquipe = '';
    this.multiAssignData.selectedType = null;
    this.multiAssignData.selectedEtatRaccordement = null;
  }

  toggleClientSelection(client: any, event: any) {
    if (event.target.checked) {
      this.multiAssignData.selectedClients.add(client);
    } else {
      this.multiAssignData.selectedClients.delete(client);
    }
  }

  isClientSelected(client: any): boolean {
    return this.multiAssignData.selectedClients.has(client);
  }

  clearSelection() {
    this.multiAssignData.selectedClients.clear();
  }

  submitMultiAssign() {
    if (!this.multiAssignData.selectedChefEquipe) {
      alert('Veuillez sélectionner un chef d\'équipe');
      return;
    }
    if (!this.multiAssignData.selectedEtatRaccordement) {
      alert('Veuillez sélectionner une etat de raccordement');
      return;
    }
    if (!this.multiAssignData.selectedType) {
      alert('Veuillez sélectionner un type de raccordement');
      return;
    }

    const selectedClientsArray = Array.from(this.multiAssignData.selectedClients);

    const raccordementsDTO: RaccordementsDTO = {
      chefEmail: this.multiAssignData.selectedChefEquipe,
      type: this.multiAssignData.selectedType,
      etat: this.multiAssignData.selectedEtatRaccordement,
      raccordements: selectedClientsArray.map(client => ({
        id: client.raccordementId || client.id,
        titre: client.label || `Client ${client.nom} ${client.prenom}`
      }))
    };

    console.log('Sending DTO:', raccordementsDTO);

    this.gest.addAllRaccordements(raccordementsDTO).subscribe({
      next: () => {
        alert(`${selectedClientsArray.length} client(s) affecté(s) avec succès!`);
        this.closeMultiAssignModal();
        this.clearSelection();
        this.loadClients(this.id, this.pathParam);
        this.refresh.emit();
      },
      error: (err) => {
        console.error('Error assigning raccordements:', err);
        alert('Erreur lors de l\'affectation des clients: ' + (err.error?.message || err.message));
      }
    });
  }

  private rebuildHierarchy() {
    const sousZoneMap = new Map<string, SousZone>();

    this.clients.forEach(client => {
      let sz = sousZoneMap.get(client.souszone);
      if (!sz) {
        sz = { id: client.souszone, label: client.souszone, clientsCount: 0, cites: [] };
        sousZoneMap.set(client.souszone, sz);
      }
      sz.clientsCount++;

      if (client.cite) {
        let existingCite = sz.cites.find(c => c.nomCite === client.cite);
        if (!existingCite) {
          existingCite = { id: client.cite, nomCite: client.cite, clientsCount: 0 };
          sz.cites.push(existingCite);
        }
        existingCite.clientsCount++;
      }
    });

    this.sousZones = Array.from(sousZoneMap.values());
  }

  toggleAllClients(event: any) {
    if (event.target.checked) {
      // Select all filtered clients
      this.filteredClientsList.forEach((client: any) => {
        this.multiAssignData.selectedClients.add(client);
      });
    } else {
      // Deselect all
      this.clearSelection();
    }
  }

  isAllSelected(): boolean {
    return this.filteredClientsList.length > 0 &&
      this.filteredClientsList.every((client: any) => this.multiAssignData.selectedClients.has(client));
  }

  isSomeSelected(): boolean {
    const selectedCount = this.multiAssignData.selectedClients.size;
    return selectedCount > 0 && selectedCount < this.filteredClientsList.length;
  }

  get filteredClientsList() {
    const needsRecomputation =
      this.searchTerm !== (this as any)._searchTerm ||
      this.selectedSousZone !== (this as any)._selectedSousZone ||
      this.selectedCite !== (this as any)._selectedCite ||
      this.selectedEtat !== (this as any)._selectedEtat ||
      this.sortField !== (this as any)._sortField ||
      this.sortDirection !== (this as any)._sortDirection;

    if (needsRecomputation) {
      (this as any)._searchTerm = this.searchTerm;
      (this as any)._selectedSousZone = this.selectedSousZone;
      (this as any)._selectedCite = this.selectedCite;
      (this as any)._selectedEtat = this.selectedEtat;
      (this as any)._sortField = this.sortField;
      (this as any)._sortDirection = this.sortDirection;
      (this as any)._filteredCache = this.computeFilteredClients();
      this.currentPage = 1;
    }

    return (this as any)._filteredCache || this.clients;
  }

  private computeFilteredClients() {
    let filtered = this.clients;

    if (this.selectedEtat !== 'all') {
      filtered = filtered.filter(c => c.etatRaccordement === this.selectedEtat);
    }

    if (this.selectedSousZone) {
      filtered = filtered.filter(c =>
        c.souszone?.toLowerCase() === this.selectedSousZone?.label.toLowerCase()
      );
    }

    if (this.selectedCite) {
      filtered = filtered.filter(c =>
        c.cite?.toLowerCase() === this.selectedCite?.nomCite.toLowerCase()
      );
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.nom?.toLowerCase().includes(term) ||
        c.prenom?.toLowerCase().includes(term) ||
        c.label?.toLowerCase().includes(term) ||
        c.numTelephone?.includes(term) ||
        c.msisdn?.includes(term) ||
        c.adresse?.toLowerCase().includes(term)
      );
    }

    // Apply sorting if a sort field is selected
    if (this.sortField === 'dateRDV') {
      filtered = [...filtered].sort((a, b) => {
        const aVal = this.getDateTimeValue(a);
        const bVal = this.getDateTimeValue(b);
        if (this.sortDirection === 'asc') {
          return aVal - bVal;
        } else {
          return bVal - aVal;
        }
      });
    }

    return filtered;
  }

  trackByClientId(_index: number, client: any): string {
    return client.id;
  }

  deleteClient(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
    this.gest.deleteClient(id).subscribe({
      next: () => {
        this.loadClients(this.id, this.pathParam);

        if (this.cite) {
          this.cite.clientsCount = (this.cite.clientsCount || 1) - 1;
        } else if (this.sousZone) {
          this.sousZone.clientsCount = (this.sousZone.clientsCount || 1) - 1;
        } else if (this.zone) {
          this.zone.clientsCount = (this.zone.clientsCount || 1) - 1;
        }

        this.refresh.emit();
      },
      error: err => console.error(err)
    });
  }

  getThemeClass(): string {
    const op = this.operateur?.nomOperateur?.toLowerCase() || '';
    if (op.includes('ooredoo')) return 'theme-ooredoo';
    if (op.includes('orange')) return 'theme-orange';
    if (op.includes('tunisie telecom') || op.includes('tunisietelecom')) return 'theme-tunisietelecom';
    return 'theme-divers';
  }

  get totalPages(): number {
    return Math.ceil(this.filteredClientsList.length / this.pageSize) || 1;
  }

  get paginatedClients(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredClientsList.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }


  // ... dans la classe

  showDeletedClientsModal = false;

// Remplacer la méthode existante par celle-ci (ou la modifier)
  openMultiDeletedClientModal() {
    if (this.multiAssignData.selectedClients.size === 0) {
      alert('Veuillez sélectionner au moins un client');
      return;
    }
    // Copier la sélection pour la suppression
    this.deletedClients.selectedClients = new Set(this.multiAssignData.selectedClients);
    this.showDeletedClientsModal = true;
  }

  closeMultiDeletedClientsModal() {
    this.showDeletedClientsModal = false;
    this.deletedClients.selectedClients.clear();
  }

  submitMultiDelete() {
    const selectedClientsArray = Array.from(this.deletedClients.selectedClients);
    if (selectedClientsArray.length === 0) {
      alert('Aucun client sélectionné à supprimer.');
      return;
    }

    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ${selectedClientsArray.length} client(s) ? Cette action est irréversible.`;
    if (!confirm(confirmMessage)) return;

    const ids = selectedClientsArray.map(client => client.id);

    // Appel au service (à adapter selon votre API)
    this.gest.deleteMultipleClients(ids).subscribe({
      next: () => {
        alert(`${ids.length} client(s) supprimé(s) avec succès.`);
        // Réinitialiser les sélections
        this.deletedClients.selectedClients.clear();
        this.multiAssignData.selectedClients.clear();
        this.showDeletedClientsModal = false;
        // Recharger les données
        this.loadClients(this.id, this.pathParam);
        this.refresh.emit();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression multiple :', err);
        alert('Erreur lors de la suppression des clients : ' + (err.error?.message || err.message));
      }
    });
  }

// Ajouter cette méthode si elle n'existe pas déjà pour gérer l'indéterminé
  isSomeDeletedSelected(): boolean {
    const selectedCount = this.deletedClients.selectedClients.size;
    return selectedCount > 0 && selectedCount < this.filteredClientsList.length;
  }
}
