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

  // Filters (STRING BASED)
  filterProjet = '';
  filterZone = '';
  filterClient = '';
  filterChef = '';
  filterTitre = '';
  filterDateRDV = '';
  filterEtat = '';

  // Sorting
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Dropdowns
  projets: Projet[] = [];
  filteredZones: Zone[] = [];

  constructor(private gest: GestionService) {}

  ngOnInit() {
    this.loadRaccordements();
  }

  loadRaccordements() {
    this.gest.getAllRaccordementByResponsable().subscribe({
      next: (res: any[]) => {
        this.raccordements = res?.slice().reverse() || [];
        this.extractedProjetsAndZones();
        this.applyFilters();
      },
      error: err => console.error('Failed to load raccordements:', err)
    });
  }

  extractedProjetsAndZones() {
    const projetMap = new Map<string, Projet>();

    this.raccordements.forEach(r => {
      if (!r.projet) return;

      // Create project
      if (!projetMap.has(r.projet)) {
        projetMap.set(r.projet, {
          id: projetMap.size + 1,
          nomProjet: r.projet,
          zones: []
        });
      }

      // Add zone if exists
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

  onProjetChange() {
    const projet = this.projets.find(p => p.nomProjet === this.filterProjet);
    this.filteredZones = projet ? projet.zones : [];
    this.filterZone = '';
    this.applyFilters();
  }

  applyFilters() {
    this.filteredRaccordements = this.raccordements.filter(r => {

      const matchProjet = this.filterProjet
        ? r.projet === this.filterProjet
        : true;

      const matchZone = this.filterZone
        ? r.zone === this.filterZone
        : true;

      const matchClient = this.filterClient
        ? `${r.nomClient || ''} ${r.prenomCLient || ''}`
          .toLowerCase()
          .includes(this.filterClient.toLowerCase())
        : true;

      const matchChef = this.filterChef
        ? (r.chef_equipe || '').toLowerCase().includes(this.filterChef.toLowerCase())
        : true;

      const matchTitre = this.filterTitre
        ? (r.titre || '').toLowerCase().includes(this.filterTitre.toLowerCase())
        : true;

      const matchDateRDV = this.filterDateRDV
        ? r.dateRDV &&
        new Date(r.dateRDV).toISOString().split('T')[0] === this.filterDateRDV
        : true;

      const matchEtat = this.filterEtat
        ? r.etatRaccordement === this.filterEtat
        : true;

      return (
        matchProjet &&
        matchZone &&
        matchClient &&
        matchChef &&
        matchTitre &&
        matchDateRDV &&
        matchEtat
      );
    });

    this.sortField ? this.applySorting() : (this.currentPage = 1);
  }

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
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });

    this.currentPage = 1;
  }

  paginatedRaccordements() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredRaccordements.slice(start, start + this.itemsPerPage);
  }

  totalPages() {
    return Math.ceil(this.filteredRaccordements.length / this.itemsPerPage);
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  getEndIndex(): number {
    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredRaccordements.length
    );
  }

  editRaccordement(r: any) {
    console.log('Edit raccordement:', r);
  }

  deleteRaccordement(id: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;
    this.gest.deleteRaccordement(id).subscribe(() => {
      this.loadRaccordements();
    });
  }
}
