import { Component, OnInit } from '@angular/core';
import { GestionService } from '../../gestion.service';

@Component({
  selector: 'app-operateur',
  templateUrl: './operateur.component.html',
  styleUrl: './operateur.component.css'
})
export class OperateurComponent implements OnInit {
  operateurs: any[] = [];
  showAddForm: boolean = false;


  constructor(private gest: GestionService) {}

  ngOnInit(): void {
    this.loadOperateurs();
  }

  loadOperateurs() {
    this.gest.getAllOperateurs().subscribe({
      next: (res: any) => {
        this.operateurs = res?.slice().reverse();
      },
      error: (err) => console.error('Failed to load operateurs:', err)
    });
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
  }


  deleteOperateur(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      this.gest.deleteOperateur(id).subscribe({
        next: () => {
          console.log('Projet deleted:', id);
          this.loadOperateurs();
        },
        error: (err) => console.error('Failed to delete projet:', err)
      });
    }
  }


}
