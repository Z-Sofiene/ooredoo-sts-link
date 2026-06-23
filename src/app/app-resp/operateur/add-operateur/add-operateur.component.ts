import {Component, EventEmitter, Output} from '@angular/core';
import {GestionService} from '../../../gestion.service';

@Component({
  selector: 'app-add-operateur',
  templateUrl: './add-operateur.component.html',
  styleUrl: './add-operateur.component.css'
})
export class AddOperateurComponent {
  @Output() refresh = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  operateur: any = {
    nomOperateur: ''
  };

  constructor(private gest: GestionService) {}


  addOperateur() {
    if (!this.operateur.nomOperateur ) {
      console.error('Operateur name is required');
      return;
    }


    const payload = {
      ...this.operateur
    };

    console.log('Adding operateur:', payload);

    this.gest.createOperateur(payload).subscribe({
      next: (response) => {
        console.log('Operateur added successfully:', response);
        this.refresh.emit();
        this.close.emit();
      },
      error: (err) => console.error('Error adding operateur:', err)
    });
  }
}
