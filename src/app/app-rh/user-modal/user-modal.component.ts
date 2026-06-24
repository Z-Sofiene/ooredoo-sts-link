import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  OnInit
} from '@angular/core';
import { GestionService } from '../../gestion.service';

@Component({
  selector: 'app-user-modal',
  templateUrl: './user-modal.component.html',
  styleUrl: './user-modal.component.css'
})
export class UserModalComponent implements OnChanges, OnInit {

  @Input() show = false;
  @Input() mode: 'add' | 'view' | 'edit' = 'add';
  @Input() user: any = null;
  @Input() userType: 'chef projet' | 'responsable' | 'technicien' | 'chef equipe' | 'admin' | 'agent ooredoo' = 'chef projet';

  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  userForm = {
    nom: '',
    prenom: '',
    email: '',
    telephone: ''
  };
  loggedInUser = '';
  userTypes: ('chef projet' | 'responsable' | 'chef equipe' | 'technicien' | 'admin' | 'agent ooredoo')[] =
    ['chef projet', 'responsable', 'chef equipe', 'technicien', 'admin', 'agent ooredoo'];

  // Soutraitance
  soutraitances: any[] = [];
  selectedSoutraitanceId = 0;

  showSoutraitanceModal = false;
  showDeleteSoutraitanceModal = false;
  newSoutraitance = { label: '' };

  constructor(private gest: GestionService) {}

  ngOnInit() {
    this.loadSoutraitances();
    this.loggedInUser = this.gest.getRoleFromToken(); // or from token
    if (this.loggedInUser !== 'ADMIN') {
      const blocked = ['admin', 'agent ooredoo'];
      this.userTypes = this.userTypes.filter(t => !blocked.includes(t));
    }

  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes['user'] && this.user) {
      this.userForm = {
        nom: this.user.nom,
        prenom: this.user.prenom,
        email: this.user.email,
        telephone: this.user.telephone
      };

      this.userType = this.getUserTypeFromRole(this.user.role);
      this.selectedSoutraitanceId = this.user?.soutraitance?.id ?? 0;
    }

    if (this.mode === 'add') {
      this.resetForm();
    }
  }

  // -------------------------
  // Soutraitance Management
  // -------------------------

  loadSoutraitances() {
    this.gest.getAllSoutraitances().subscribe({
      next: data => this.soutraitances = data,
      error: err => console.error(err)
    });
  }

  addNewSoutraitance() {
    if (!this.newSoutraitance.label.trim()) return;

    this.gest.createSoutraitance(this.newSoutraitance).subscribe(() => {
      this.newSoutraitance.label = '';
      this.showSoutraitanceModal = false;
      this.loadSoutraitances();
    });
  }

  deleteSoutraitance(s: any, event: Event) {
    event.stopPropagation();

    if (!confirm(`Supprimer ${s.label} ?`)) return;

    this.gest.deleteSoutraitance(s.id).subscribe(() => {
      this.loadSoutraitances();
    });
  }

  // -------------------------
  // Role Mapping
  // -------------------------

  getUserTypeFromRole(role: string) {
    switch (role) {
      case 'CHEFPROJET': return 'chef projet';
      case 'RESPONSABLE': return 'responsable';
      case 'TECHNICIEN': return 'technicien';
      case 'CHEF': return 'chef equipe';
      case 'ADMIN': return 'admin';
      case 'OOREDOO': return 'agent ooredoo';
      default: return 'chef projet';
    }
  }

  // -------------------------
  // Submit Logic
  // -------------------------

  submitUser() {
    if (this.mode === 'view') return;

    const formData = new FormData();

    const requestPartKey =
      this.userType === 'chef projet' ? 'chef_projet' :
        this.userType === 'responsable' ? 'responsable' :
        this.userType === 'technicien' ? 'technicien' :
          this.userType === 'chef equipe' ? 'chef_equipe' :
            this.userType === 'agent ooredoo' ? 'agent_ooredoo' :
            'admin';

    const payload: any = {
      nom: this.userForm.nom,
      prenom: this.userForm.prenom,
      email: this.userForm.email,
      telephone: this.userForm.telephone,
      role:
        this.userType === 'chef projet' ? 'ROLE_CHEFPROJET' :
          this.userType === 'responsable' ? 'ROLE_RESPONSABLE' :
          this.userType === 'technicien' ? 'ROLE_TECHNICIEN' :
            this.userType === 'chef equipe' ? 'ROLE_CHEF' :
              this.userType === 'agent ooredoo' ? 'ROLE_OOREDOO' :
              'ROLE_ADMIN'
    };

    // Add soutraitance only if needed
    if (this.userType === 'technicien' || this.userType === 'chef equipe') {
      payload.soutraitance = {id: this.selectedSoutraitanceId};
    }

    formData.append(
      requestPartKey,
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    );

    // Always send empty file
    if (this.userType !== 'admin' && this.userType !== 'agent ooredoo') {
      formData.append(
        'file',
        new Blob([new Uint8Array(0)], { type: 'application/octet-stream' })
      );
    }

    let request$;
    if (this.userType === 'chef projet') request$ = this.gest.addChefProjet(formData);
    else if (this.userType === 'responsable') request$ = this.gest.addResponsable(formData);
    else if (this.userType === 'technicien') request$ = this.gest.addTech(formData);
    else if (this.userType === 'chef equipe') request$ = this.gest.addChef(formData);
    else if (this.userType === 'agent ooredoo') request$ = this.gest.addAgentOoredoo(formData);
    else request$ = this.gest.addAdmin(formData);

    request$.subscribe({
      next: () => {
        alert(`${this.userType} saved successfully!`);
        this.refresh.emit();
        this.close.emit();
        this.resetForm();
      },
      error: err => {
        console.error(err);
        alert('Error while saving');
      }
    });
  }

  // -------------------------
  // Reset & Close
  // -------------------------

  resetForm() {
    this.userForm = {
      nom: '',
      prenom: '',
      email: '',
      telephone: ''
    };

    this.userType = 'chef projet';
    this.selectedSoutraitanceId = 0;
  }

  toggleClose() {
    this.close.emit();
    this.resetForm();
  }
}
