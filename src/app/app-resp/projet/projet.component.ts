import { Component, OnInit } from '@angular/core';
import { GestionService } from '../../gestion.service';

@Component({
  selector: 'app-projets',
  templateUrl: './projet.component.html',
  styleUrl: './projet.component.css',
})
export class ProjetComponent implements OnInit {
  projets: any[] = [];
  filteredProjets: any[] = [];
  showAddForm: boolean = false;
  showUpdateForm: boolean = false;
  // Filters
  filterNom: string = '';
  filterOperateur: string = '';
  filterDateDebut: string = '';
  filterDateFin: string = '';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10; // number of projets per page
  totalPages: number = 1;
  operators: string[] = [];
  currentProjet: any = null;




  constructor(private gest: GestionService) {}

  ngOnInit(): void {
    this.loadProjets();
  }

  loadProjets() {
    this.gest.getAllProjets().subscribe({
      next: (res: any) => {
        this.projets = res?.slice().reverse();
        this.extractOperators();
        this.applyFilters();
      },
      error: (err) => console.error('Failed to load projets:', err)
    });
  }

  extractOperators() {
    const ops = this.projets.map(p => p.operateur.nomOperateur);
    this.operators = Array.from(new Set(ops)); // remove duplicates
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
  }
  toggleUpdateForm(projet?: any) {

    if (projet) {
      this.currentProjet = projet; // set the project to edit
    }
    this.showUpdateForm = !this.showUpdateForm;
  }

  deleteProjet(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      this.gest.deleteProjet(id).subscribe({
        next: () => {
          console.log('Projet deleted:', id);
          this.loadProjets();
        },
        error: (err) => console.error('Failed to delete projet:', err)
      });
    }
  }

  viewProjet(id: string) {
    console.log('Viewing projet with id:', id);
  }

  applyFilters() {
    this.filteredProjets = this.projets.filter(p => {
      const matchNom = this.filterNom ? p.nomProjet.toLowerCase().includes(this.filterNom.toLowerCase()) : true;
      const matchOperateur = this.filterOperateur ? p.operateur.nomOperateur === this.filterOperateur : true;

      let matchDateDebut = true;
      let matchDateFin = true;

      if (this.filterDateDebut) {
        const projetDebut = new Date(p.date_debut);
        const filterDebut = new Date(this.filterDateDebut);
        matchDateDebut = projetDebut >= filterDebut;
      }

      if (this.filterDateFin) {
        const projetFin = new Date(p.date_fin);
        const filterFin = new Date(this.filterDateFin);
        matchDateFin = projetFin <= filterFin;
      }

      return matchNom && matchOperateur && matchDateDebut && matchDateFin;
    });

    this.totalPages = Math.ceil(this.filteredProjets.length / this.pageSize);
    this.currentPage = 1;
  }

  get paginatedProjets() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProjets.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
