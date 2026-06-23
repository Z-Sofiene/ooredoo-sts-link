import {Component, EventEmitter, Input, Output} from '@angular/core';
import { Zone, Projet, Operateur } from '../models';
@Component({
  selector: 'app-add-souszone',
  templateUrl: './add-souszone.component.html',
  styleUrl: './add-souszone.component.css'
})
export class AddSouszoneComponent {
  @Input() selectedZone: Zone | null = null;
  @Input() projet: Projet | null = null;
  @Input() operateur: Operateur | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

}
