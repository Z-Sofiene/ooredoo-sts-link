import {Component, EventEmitter, Input, Output} from '@angular/core';
import { Zone, SousZone, Projet, Operateur} from '../models';
@Component({
  selector: 'app-add-cite',
  templateUrl: './add-cite.component.html',
  styleUrl: './add-cite.component.css'
})
export class AddCiteComponent {
  @Input() selectedZone: Zone | null = null;
  @Input() selectedSousZone: SousZone | null = null;
  @Input() projet: Projet | null = null;
  @Input() operateur: Operateur | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

}
