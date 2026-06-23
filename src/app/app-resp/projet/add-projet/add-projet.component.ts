import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GestionService } from '../../../gestion.service';

interface Operateur {
  id: number;
  nomOperateur: string;
}

@Component({
  selector: 'app-add-project',
  templateUrl: './add-projet.component.html',
  styleUrls: ['./add-projet.component.css']
})
export class AddProjetComponent implements OnInit {

  @Input() operateur: Operateur | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  operateurs: Operateur[] = [];

  projet = {
    nomProjet: '',
    description: '',
    date_debut: '',
    operateur: null as Operateur | null
  };

  constructor(private gest: GestionService) {}

  ngOnInit(): void {
    if (this.operateur) {
      // ✅ Operator passed from parent
      this.projet.operateur = this.operateur;
    } else {
      // ✅ User must select operator
      this.loadOperateurs();
    }
  }

  loadOperateurs(): void {
    this.gest.getAllOperateurs().subscribe({
      next: res => this.operateurs = res,
      error: err => console.error(err)
    });
  }

  addProjet(): void {
    if (!this.projet.nomProjet || !this.projet.operateur) {
      console.error('Project name and operator are required');
      return;
    }

    const payload = {
      nomProjet: this.projet.nomProjet,
      description: this.projet.description,
      date_debut: this.projet.date_debut,
      operateur: {
        id: this.projet.operateur.id
      }
    };

    console.log('Adding projet:', payload);

    this.gest.createProjet(payload).subscribe({
      next: () => {
        this.refresh.emit();
        this.close.emit();
      },
      error: err => console.error(err)
    });
  }
}
