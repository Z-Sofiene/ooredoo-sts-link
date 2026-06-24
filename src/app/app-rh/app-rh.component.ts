import { Component, OnInit } from '@angular/core';
import { GestionService } from '../gestion.service';

@Component({
  selector: 'app-app-rh',
  templateUrl: './app-rh.component.html',
  styleUrls: ['./app-rh.component.css']
})
export class AppRhComponent implements OnInit {

  users: any[] = [];
  usersReg: any[] = [];
  paginatedUsers: any[] = [];
  roles: string[] = [];
  currentPage = 1;
  totalPages = 1;
  pageSize = 5;

  filterNom = '';
  filterRole = '';

  showModal: boolean = false;
  editingUser: any = null;

  constructor(private gest: GestionService) {}

  ngOnInit() {
    this.loadUsers();
    this.loadUsersReg();
  }
  loadUsersReg(){
    this.gest.getAllUsersReg().subscribe({
      next: (data: any[]) => {
        this.usersReg = data;
      },
      error: err => console.error('Erreur de chargement des utilisateurs', err)
    });
  }
  loadUsers() {
    this.gest.getAllUsers().subscribe({
      next: (data: any[]) => {
        this.users = data;
        this.roles = [...new Set(this.users.map(u => u.role))];
        this.applyFilters();
      },
      error: err => console.error('Erreur de chargement des utilisateurs', err)
    });
  }

  applyFilters() {
    const filtered = this.users.filter(u =>
      (!this.filterNom || u.nom.toLowerCase().includes(this.filterNom.toLowerCase())) &&
      (!this.filterRole || u.role === this.filterRole)
    );
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedUsers = filtered.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFilters();
  }

  deleteUser(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    this.gest.deleteUser(id).subscribe({
      next: () => this.loadUsers(),
      error: () => alert('Erreur lors de la suppression')
    });
  }

  viewUser(id: string) {
    this.gest.getUserById(id).subscribe({
      next: (user) => {
        this.editingUser = user;
        this.showModal = true;
      },
      error: (err) => {
        alert('Erreur lors de la récupération de l\'utilisateur');
        console.error(err);
      }
    });
  }

  addUser() {
    this.editingUser = null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingUser = null;
    this.loadUsers();
  }

  getUserTypeFromRole(role: string) {
    switch (role) {
      case 'CHEFPROJET': return 'chef projet';
      case 'RESPONSABLE': return 'responsable';
      case 'TECHNICIEN': return 'technicien';
      case 'CHEF': return 'chef equipe';
      case 'OOREDOO': return 'agent ooredoo';
      case 'ADMIN': return 'admin';
      default: return 'chef projet';
    }
  }

  downloadApk(): void {
    const apk = 'sts-rh.apk';
    const apkUrl = this.gest.downloadLink(apk);
    if (apkUrl != null) {
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'sts-rh.apk';
    link.target = '_blank';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    }

  }


}
