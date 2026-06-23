import { Component, OnInit } from '@angular/core';
import { GestionService } from '../../gestion.service';

interface Zone {
  id: number;
  nomZone: string;
}

interface Projet {
  id: number;
  nomProjet: string;
  zones: Zone[];
}

@Component({
  selector: 'app-raccordement',
  templateUrl: './raccordement.component.html',
  styleUrls: ['./raccordement.component.css']
})
export class RaccordementComponent implements OnInit {

  raccordements: any[] = [];
  filteredRaccordements: any[] = [];

  currentPage = 1;
  itemsPerPage = 10;

  // =========================
  // FILTERS
  // =========================

  filterProjet = '';
  filterZone = '';
  filterClient = '';
  filterChef = '';
  filterTitre = '';
  filterDateRDV = '';
  filterDateStart = '';
  filterDateEnd = '';
  filterEtat = '';
  filterDebit = '';
  filterTelephone = '';
  filterFixe = '';

  // =========================
  // SORTING
  // =========================

  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // =========================
  // DROPDOWNS
  // =========================

  projets: Projet[] = [];
  filteredZones: Zone[] = [];
  chefsEquipe: string[] = [];
  debits: string[] = [];

  constructor(private gest: GestionService) {}

  ngOnInit() {
    this.loadRaccordements();
  }

  // =========================
  // LOAD DATA
  // =========================

  loadRaccordements() {
    this.gest.getAllRaccordementByResponsable().subscribe({
      next: (res: any[]) => {
        this.raccordements = res?.slice().reverse() || [];
        this.extractedProjetsAndZones();
        this.extractDynamicFilters();
        this.applyFilters();
      },
      error: err => console.error('Failed to load raccordements:', err)
    });
  }

  // =========================
  // EXTRACT PROJECT / ZONES
  // =========================

  extractedProjetsAndZones() {
    const projetMap = new Map<string, Projet>();
    this.raccordements.forEach(r => {
      if (!r.projet) return;
      if (!projetMap.has(r.projet)) {
        projetMap.set(r.projet, {
          id: projetMap.size + 1,
          nomProjet: r.projet,
          zones: []
        });
      }
      if (r.zone) {
        const projet = projetMap.get(r.projet)!;
        const exists = projet.zones.some(z => z.nomZone === r.zone);
        if (!exists) {
          projet.zones.push({
            id: projet.zones.length + 1,
            nomZone: r.zone
          });
        }
      }
    });
    this.projets = Array.from(projetMap.values());
    this.filteredZones = [];
  }

  // =========================
  // DYNAMIC FILTER VALUES
  // =========================

  extractDynamicFilters() {
    this.chefsEquipe = [
      ...new Set(
        this.raccordements.map(r => r.chef_equipe).filter(v => v)
      )
    ];
    this.debits = [
      ...new Set(
        this.raccordements.map(r => r.debit).filter(v => v)
      )
    ];
  }

  onProjetChange() {
    const projet = this.projets.find(p => p.nomProjet === this.filterProjet);
    this.filteredZones = projet ? projet.zones : [];
    this.filterZone = '';
    this.applyFilters();
  }

  // =========================
  // FILTER ENGINE
  // =========================

  applyFilters() {
    this.filteredRaccordements = this.raccordements.filter(r => {
      const rdvDate = r.dateRDV ? new Date(r.dateRDV) : null;
      const fullClient = `${r.nomClient || ''} ${r.prenomClient || ''}`.toLowerCase();

      const matchProjet = !this.filterProjet || r.projet === this.filterProjet;
      const matchZone = !this.filterZone || r.zone === this.filterZone;
      const matchClient = !this.filterClient || fullClient.includes(this.filterClient.toLowerCase());
      const matchChef = !this.filterChef || r.chef_equipe === this.filterChef;
      const matchTitre = !this.filterTitre || (r.titre || '').toLowerCase().includes(this.filterTitre.toLowerCase());
      const matchDate = !this.filterDateRDV || this.formatDate(r.dateRDV) === this.filterDateRDV;
      const matchDateStart = !this.filterDateStart || (rdvDate && rdvDate >= new Date(this.filterDateStart));
      const matchDateEnd = !this.filterDateEnd || (rdvDate && rdvDate <= new Date(this.filterDateEnd));
      const matchEtat = !this.filterEtat || r.etatRaccordement === this.filterEtat;
      const matchDebit = !this.filterDebit || r.debit === this.filterDebit;
      const matchTelephone = !this.filterTelephone || (r.numTelephone || '').includes(this.filterTelephone);
      const matchFixe = !this.filterFixe || (r.numFixe || '').includes(this.filterFixe);

      return matchProjet && matchZone && matchClient && matchChef &&
        matchTitre && matchDate && matchDateStart && matchDateEnd &&
        matchEtat && matchDebit && matchTelephone && matchFixe;
    });

    if (this.sortField) this.applySorting();
    else this.currentPage = 1;
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  // =========================
  // SORT
  // =========================

  applySorting() {
    this.filteredRaccordements.sort((a, b) => {
      let aValue = a[this.sortField];
      let bValue = b[this.sortField];

      if (this.sortField === 'projet') {
        aValue = a.projet || '';
        bValue = b.projet || '';
      }
      if (this.sortField === 'zone') {
        aValue = a.zone || '';
        bValue = b.zone || '';
      }
      if (this.sortField === 'dateRDV') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      return this.sortDirection === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
    this.currentPage = 1;
  }

  // =========================
  // PAGINATION
  // =========================

  paginatedRaccordements() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredRaccordements.slice(start, start + this.itemsPerPage);
  }

  totalPages() {
    return Math.ceil(this.filteredRaccordements.length / this.itemsPerPage) || 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  firstPage() {
    this.currentPage = 1;
  }

  lastPage() {
    this.currentPage = this.totalPages();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
  }

  getStartIndex(): number {
    if (this.filteredRaccordements.length === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredRaccordements.length);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage;
    const delta = 2;
    const range = [];
    const rangeWithDots: number[] = [];
    let l: number;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push(-1); // indicates ellipsis
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }

  // =========================
  // ACTIONS
  // =========================

  addRaccordement() {
    // Implémentez la navigation vers le formulaire d'ajout ou ouvrez un modal
    console.log('Ajouter un nouveau raccordement');
    // Exemple : this.router.navigate(['/raccordement/new']);
  }

  editRaccordement(r: any) {
    console.log('Edit raccordement:', r);
    // Implémentez la modification
  }

  viewRaccordement(r: any) {
    console.log('Voir détails du raccordement:', r);
    // Implémentez l'affichage des détails (modal ou navigation)
  }

  deleteRaccordement(id: string) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce raccordement ?')) return;
    this.gest.deleteRaccordement(id).subscribe(() => {
      this.loadRaccordements();
    });
  }

  resetFilters() {
    this.filterProjet = '';
    this.filterZone = '';
    this.filterClient = '';
    this.filterChef = '';
    this.filterTitre = '';
    this.filterDateRDV = '';
    this.filterDateStart = '';
    this.filterDateEnd = '';
    this.filterEtat = '';
    this.filterDebit = '';
    this.filterTelephone = '';
    this.filterFixe = '';
    this.sortField = '';
    this.sortDirection = 'asc';
    // Réinitialiser les zones dynamiques
    this.filteredZones = [];
    this.currentPage = 1;
    this.applyFilters();
  }

  exportData() {
    // Implémentez l'export des données (ex: CSV, Excel)
    console.log('Exporter les données');
    // Exemple : télécharger un fichier CSV
  }

  refreshData() {
    this.loadRaccordements();
  }
}
