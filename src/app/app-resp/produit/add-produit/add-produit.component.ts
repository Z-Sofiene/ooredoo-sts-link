import { Component, EventEmitter, OnInit, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { GestionService } from '../../../gestion.service';

@Component({
  selector: 'app-add-produit',
  templateUrl: './add-produit.component.html',
  styleUrl: './add-produit.component.css'
})
export class AddProduitComponent implements OnInit, OnChanges {

  @Output() refresh = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
  @Input() itemToUpdate: any = null;
  @Input() isUpdateMode: boolean = false;

  sourcesProduit: any[] = [];
  typeArticles: any[] = [];
  produit: any = {
    id: 0,
    code: '',
    nomArticle: '',
    unite: '',
    articleSTS: false,
    titre: '',
    quantite: 0,
    operateurId: 0,
    typeArticleId: 0
  };

  showOptionalFields = false;

  constructor(private gest: GestionService) {}

  ngOnInit(): void {
    this.loadToAddProduitData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['itemToUpdate'] && this.itemToUpdate && this.isUpdateMode) {
      this.populateFormForUpdate();
    }
  }

  populateFormForUpdate() {
    this.produit = {
      id: this.itemToUpdate.id,
      code: this.itemToUpdate.code || '',
      nomArticle: this.itemToUpdate.nomArticle,
      unite: this.itemToUpdate.unite,
      articleSTS: this.itemToUpdate.articleSTS || false,
      titre: this.itemToUpdate.titre || '',
      quantite: this.itemToUpdate.quantite || 0,
      operateurId: this.itemToUpdate.operateur.id,
      typeArticleId: this.itemToUpdate.typeArticleId || 0
    };

    // Show optional fields if titre exists
    this.showOptionalFields = !this.produit.titre;
  }

  loadToAddProduitData() {
    this.gest.getAllProduitData().subscribe(data => {
      this.sourcesProduit = data?.operateurs.slice().reverse() ?? [];
      this.typeArticles = data?.typeArticles.slice().reverse() ?? [];
    });
  }

  isFormValid(): boolean {
    // For update mode, we only need to validate the fields that are being updated
    if (this.isUpdateMode) {
      return !!this.produit.nomArticle?.trim();
    }

    // For add mode, validate all required fields
    return this.produit.operateurId &&
      this.produit.operateurId !== 0 &&
      this.produit.nomArticle?.trim() &&
      this.produit.quantite >= 0;
  }

  addProduit(): void {
    if (!this.isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const request = this.gest.addProduit(this.produit);

    request.subscribe({
      next: () => {
        const message = this.isUpdateMode
          ? 'Produit mis à jour avec succès!'
          : 'Produit créé avec succès!';

        alert(message);

        this.resetForm();
        this.refresh.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error(`Error ${this.isUpdateMode ? 'updating' : 'adding'} produit:`, err);
        const errorMessage = this.isUpdateMode
          ? 'Erreur lors de la mise à jour du produit'
          : 'Erreur lors de la création du produit';
        alert(errorMessage);
      }
    });
  }

  resetForm() {
    this.produit = {
      id: 0,
      code: '',
      nomArticle: '',
      unite: '',
      articleSTS: false,
      titre: '',
      quantite: 0,
      operateurId: 0,
      typeArticleId: 0
    };
    this.showOptionalFields = false;
  }

  toggleOptionalFields() {
    this.showOptionalFields = !this.showOptionalFields;
    if (!this.showOptionalFields) {
      this.produit.titre = '';
      this.produit.quantite = 0;
    }
  }

  cancel() {
    this.resetForm();
    this.close.emit();
  }
}
