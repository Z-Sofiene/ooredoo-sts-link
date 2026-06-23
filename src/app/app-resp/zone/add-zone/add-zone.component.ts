import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GestionService } from '../../../gestion.service';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Projet, Operateur } from '../models';

@Component({
  selector: 'app-add-zone',
  templateUrl: './add-zone.component.html',
  styleUrls: ['./add-zone.component.css']
})
export class AddZoneComponent implements OnInit {
  @Input() projet!: Projet | null;
  @Input() operateur!: Operateur | null;
  @Output() refresh = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  projets: Projet[] = [];
  addSousZones = false;

  zoneForm: FormGroup;

  constructor(private gest: GestionService, private fb: FormBuilder) {
    this.zoneForm = this.fb.group({
      label: ['', Validators.required],
      description: [''],
      projet: [null, Validators.required],
      sousZones: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    if (this.projet) {
      this.zoneForm.patchValue({ projet: this.projet });
    } else {
      this.loadProjets();
    }
  }

  loadProjets(): void {
    this.gest.getAllProjets().subscribe({
      next: res => this.projets = res,
      error: err => console.error(err)
    });
  }

  /** ---------- FormArray Getters ---------- */
  get sousZonesArray(): FormArray {
    return this.zoneForm.get('sousZones') as FormArray;
  }

  getCitesArray(sousZoneIndex: number): FormArray {
    const sousZoneGroup = this.sousZonesArray.at(sousZoneIndex) as FormGroup;
    return sousZoneGroup.get('cites') as FormArray;
  }

  getSousZoneControl(index: number, controlName: string): FormControl {
    return this.sousZonesArray.at(index).get(controlName) as FormControl;
  }

  getCiteControl(sousZoneIndex: number, citeIndex: number): FormControl {
    return this.getCitesArray(sousZoneIndex).at(citeIndex).get('nomCite') as FormControl;
  }

  /** ---------- Toggle Sections ---------- */
  toggleSousZones(): void {
    this.addSousZones = !this.addSousZones;
    if (!this.addSousZones) this.sousZonesArray.clear();
  }

  toggleCites(index: number): void {
    const citesArray = this.getCitesArray(index);
    if (citesArray.length === 0) {
      this.addCite(index); // add first cite
    } else {
      citesArray.clear(); // remove all cites
    }
  }

  sousZoneHasCites(index: number): boolean {
    return this.getCitesArray(index).length > 0;
  }

  /** ---------- Add/Remove Dynamic Controls ---------- */
  addSousZone(): void {
    const sousZoneGroup = this.fb.group({
      label: ['', Validators.required],
      description: [''], // must exist for template binding
      cites: this.fb.array([]),
    });
    this.sousZonesArray.push(sousZoneGroup);
  }

  removeSousZone(index: number): void {
    this.sousZonesArray.removeAt(index);
  }

  addCite(sousZoneIndex: number): void {
    const citeGroup = this.fb.group({
      nomCite: ['', Validators.required]
    });
    this.getCitesArray(sousZoneIndex).push(citeGroup);
  }

  removeCite(sousZoneIndex: number, citeIndex: number): void {
    this.getCitesArray(sousZoneIndex).removeAt(citeIndex);
  }

  /** ---------- Submit ---------- */
  addZone(): void {
    if (this.zoneForm.invalid) {
      this.markFormGroupTouched(this.zoneForm);
      return;
    }

    const formValue = this.zoneForm.value;

    const payload: any = {
      label: formValue.label,
      description: formValue.description,
      projet: { id: formValue.projet.id , nomProjet: formValue.projet.nomProjet },
      sousZones: []
    };

    if (this.addSousZones && formValue.sousZones.length > 0) {
      payload.sousZones = formValue.sousZones.map((s: any) => ({
        label: s.label,
        description: s.description,
        cites: s.cites?.map((c: any) => ({ nomCite: c.nomCite })) || []
      }));
    }

    this.gest.createZone(payload).subscribe({
      next: () => {
        this.refresh.emit();
        this.close.emit();
      },
      error: err => {
        console.error('Error creating zone:', err);
        alert('Erreur lors de la création de la zone');
      }
    });
  }

  /** ---------- Helpers ---------- */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) this.markFormGroupTouched(control);
      if (control instanceof FormArray) {
        control.controls.forEach(c => c instanceof FormGroup ? this.markFormGroupTouched(c) : c.markAsTouched());
      }
    });
  }

  getThemeClass(): string {
    if (!this.operateur?.nomOperateur) return 'theme-divers';
    const op = this.operateur.nomOperateur.toLowerCase();
    if (op.includes('ooredoo')) return 'theme-ooredoo';
    if (op.includes('orange')) return 'theme-orange';
    if (op.includes('tunisietelecom') || op.includes('tunisie telecom')) return 'theme-tunisietelecom';
    return 'theme-divers';
  }

  closeModal(): void {
    this.close.emit();
  }
}
