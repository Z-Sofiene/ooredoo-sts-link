import { Component, OnInit } from '@angular/core';
import { GestionService } from '../../gestion.service';

interface Operateur {
  id: number;
  nomOperateur: string;
}

interface Article {
  id: number;
  nomArticle: string;
  unite: string;
  articleSTS: boolean;
  operateur: Operateur;
}

interface Produit extends Article {
  titre: string | null;
  quantite: number;
}

@Component({
  selector: 'app-produit',
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.css']
})
export class ProduitComponent implements OnInit {
  produits: Produit[] = [];
  articles: Article[] = [];
  filteredProduits: Produit[] = [];
  filteredArticles: Article[] = [];
  showAddForm: boolean = false;

  // Selected item for update
  selectedItem: any = null;
  isUpdateMode: boolean = false;

  // Filters
  filterSourceId: number | null = null;
  filterTitre: string = '';

  // Sorting
  sortBy: string = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  // Pagination for produits
  currentPage: number = 1;
  pageSize: number = 7;
  totalPages: number = 1;

  // Pagination for articles
  currentPageArticles: number = 1;
  pageSizeArticles: number = 7;
  totalPagesArticles: number = 1;

  // Unique sources
  uniqueSources: Operateur[] = [];

  constructor(private gest: GestionService) {}

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits() {
    this.gest.getAllProduits().subscribe({
      next: (res: any) => {
        const produitsArray: Produit[] = [];
        const articlesArray: Article[] = [];

        // Ensure res is parsed as array of Produit | Article
        let dataArray: any[] = [];
        if (typeof res === 'string') {
          try {
            dataArray = JSON.parse(res);
          } catch (e) {
            console.error('Failed to parse JSON:', e);
            dataArray = [];
          }
        } else if (Array.isArray(res)) {
          dataArray = res;
        }

        // Split produits vs articles
        dataArray.forEach((p: Produit) => {
          if (p.titre) {
            produitsArray.push(p);
          } else {
            articlesArray.push(p);
          }
        });

        // Reverse produits so newest first
        this.produits = produitsArray.slice().reverse();
        this.articles = articlesArray.slice().reverse();

        // Init filtered arrays
        this.filteredProduits = [...this.produits];
        this.filteredArticles = [...this.articles];

        this.extractUniqueValues();
        this.applyFiltersAndSort();
      },
      error: (err) => console.error('Failed to load produits:', err)
    });
  }

  extractUniqueValues() {
    const sourcesMap = new Map<number, Operateur>();
    [...this.produits, ...this.articles].forEach(p => {
      sourcesMap.set(p.operateur.id, p.operateur);
    });
    this.uniqueSources = Array.from(sourcesMap.values());
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (!this.showAddForm) {
      // Reset selected item when closing
      this.selectedItem = null;
      this.isUpdateMode = false;
    }
  }

  openUpdateForm(item: any, type: 'produit' | 'article') {
    this.selectedItem = { ...item, itemType: type };
    this.isUpdateMode = true;
    this.showAddForm = true;
  }

  deleteProduit(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      this.gest.deleteProduit(id.toString()).subscribe({
        next: () => this.loadProduits(),
        error: (err) => console.error('Failed to delete produit:', err)
      });
    }
  }

  applyFiltersAndSort() {
    // --- Produits ---
    let filteredP = this.produits.filter(p => {
      const matchTitre = this.filterTitre ? (p.titre ?? '').toLowerCase().includes(this.filterTitre.toLowerCase()) : true;
      const matchSource = this.filterSourceId ? p.operateur.id === this.filterSourceId : true;
      return matchTitre && matchSource;
    });

    if (this.sortBy) {
      filteredP.sort((a, b) => {
        let valueA = '';
        let valueB = '';

        switch (this.sortBy) {
          case 'titre':
            valueA = (a.titre ?? '').toLowerCase();
            valueB = (b.titre ?? '').toLowerCase();
            break;
          case 'operateur.nomOperateur':
            valueA = a.operateur.nomOperateur.toLowerCase();
            valueB = b.operateur.nomOperateur.toLowerCase();
            break;
          default:
            return 0;
        }

        if (valueA < valueB) return this.sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return this.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this.filteredProduits = [...filteredP];

    // --- Articles ---
    let filteredA = this.articles.filter(a => {
      const matchSource = this.filterSourceId ? a.operateur.id === this.filterSourceId : true;
      const matchTitre = this.filterTitre ? a.nomArticle.toLowerCase().includes(this.filterTitre.toLowerCase()) : true;
      return matchSource && matchTitre;
    });

    // Optional: sort articles by nomArticle
    if (this.sortBy === 'operateur.nomOperateur') {
      filteredA.sort((a, b) => {
        const vA = a.operateur.nomOperateur.toLowerCase();
        const vB = b.operateur.nomOperateur.toLowerCase();
        return this.sortOrder === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      });
    }

    this.filteredArticles = [...filteredA];

    // Update paginations
    this.updatePagination();
    this.updatePaginationArticles();
  }

  applyFilters() {
    this.applyFiltersAndSort();
  }

  applySorting() {
    this.applyFiltersAndSort();
  }

  handleFormSuccess() {
    this.loadProduits();
    this.toggleAddForm();
  }

  // --- Pagination Produits ---
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredProduits.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) this.currentPage = 1;
  }

  get paginatedProduits() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProduits.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = start + maxVisible - 1;
    if (end > this.totalPages) { end = this.totalPages; start = Math.max(1, end - maxVisible + 1); }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // --- Pagination Articles ---
  updatePaginationArticles() {
    this.totalPagesArticles = Math.ceil(this.filteredArticles.length / this.pageSizeArticles);
    if (this.currentPageArticles > this.totalPagesArticles && this.totalPagesArticles > 0) this.currentPageArticles = 1;
  }

  get paginatedArticles() {
    const start = (this.currentPageArticles - 1) * this.pageSizeArticles;
    return this.filteredArticles.slice(start, start + this.pageSizeArticles);
  }

  goToPageArticles(page: number) {
    if (page >= 1 && page <= this.totalPagesArticles) this.currentPageArticles = page;
  }

  getPageNumbersArticles(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPageArticles - 2);
    let end = start + maxVisible - 1;
    if (end > this.totalPagesArticles) { end = this.totalPagesArticles; start = Math.max(1, end - maxVisible + 1); }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  resetFilters() {
    this.filterSourceId = null;
    this.filterTitre = '';
    this.sortBy = '';
    this.sortOrder = 'asc';
    this.applyFiltersAndSort();
  }

  protected readonly Math = Math;
}
