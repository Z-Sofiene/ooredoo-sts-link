import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GestionService } from '../../../gestion.service';

@Component({
  selector: 'app-update-projet',
  templateUrl: './update-projet.component.html',
  styleUrls: ['./update-projet.component.css'] // fixed typo
})
export class UpdateProjetComponent implements OnInit {
  @Input() selectedProjet: any; // <-- the project to edit
  @Output() refresh = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  operateurs: any[] = [];
  projet: any = {
    id: 0,
    nomProjet: '',
    description: '',
    date_debut: '',
    date_fin: '',
    operateur: { id: 0, nomOperateur: '' }
  };

  constructor(private gest: GestionService) {}

  ngOnInit(): void {
    this.loadOperateurs();

    // Load selected project into the form
    if (this.selectedProjet) {
      this.projet = { ...this.selectedProjet }; // shallow copy
    }
  }

  loadOperateurs() {
    this.gest.getAllOperateurs().subscribe({
      next: (res: any) => this.operateurs = res,
      error: (err) => console.error(err)
    });
  }

  updateProjet() {
    if (!this.projet.nomProjet || this.projet.operateur.id === 0) {
      console.error('Project name and operator are required');
      return;
    }

    const selectedOp = this.operateurs.find(
      op => op.id === +this.projet.operateur.id
    );

    if (!selectedOp) {
      console.error('Selected operator not found');
      return;
    }

    const payload = {
      ...this.projet,
      operateur: {
        id: this.projet.operateur.id,
        nomOperateur: this.projet.operateur.nomOperateur
      }
    };

    console.log('Updating projet:', payload);

    this.gest.updateProjet(payload).subscribe({
      next: (response) => {
        console.log('Projet updated successfully:', response);
        this.refresh.emit();
        this.close.emit();
      },
      error: (err) => console.error('Error updating projet:', err)
    });
  }
}
