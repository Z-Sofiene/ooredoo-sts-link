import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GestionService } from '../../gestion.service';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'] // <- fixed
})
export class SidebarComponent implements OnInit {
  @Input() currentUser = localStorage.getItem('name') || null;
  @Input() roleUser = localStorage.getItem('role') || null;

  menuItems: MenuItem[] = [];

  constructor(private router: Router, private authService: GestionService) {}
  role : string | null = null

  ngOnInit() {
    const menu: MenuItem[] = [];
    this.role = this.authService.getRoleFromToken()
    // RH menu items
    const rhMenu: MenuItem[] = [
      { icon: 'fas fa-users', label: 'Utilisateurs', route: '/users', active: false },
    ];

    // Admin menu
    const adminMenu: MenuItem[] = [
      { icon: 'fas fa-tower-broadcast text-white-900', label: 'Operateurs', route: '/operateurs', active: false },
    ]

    //Chef projet Menu
    const chefProjetMenu: MenuItem[] = [
      { icon: 'fas fa-project-diagram text-white-900', label: 'Projets', route: '/projets', active: false },
    ]

    // RESPONSABLE menu items
    const respMenu: MenuItem[] = [
      { icon: 'fas fa-route text-white-900', label: 'Tableau de bord', route: '/dashboard', active: false },
    ];
    const agentOoredooMenu: MenuItem[] = [
        { icon: 'fas fa-chart-line text-white-900', label: 'Statistique', route: '/statistique', active: false },
        { icon: 'fas fa-network-wired text-white-900', label: 'Abonnés FTTH', route: '/raccordements', active: false },
      ];
    //Magasinier Menu
    const magasinierMenu: MenuItem[] = [
      { icon: 'fas fa-box text-white-900', label: 'Articles', route: '/articles', active: false },
    ];

    if (this.roleUser === 'CHEFPROJET') menu.push(...respMenu, ...agentOoredooMenu, ...chefProjetMenu, ...magasinierMenu, ...rhMenu);
    if (this.roleUser === 'RESPONSABLE') menu.push(...respMenu, ...agentOoredooMenu, ...magasinierMenu);
    if (this.roleUser === 'ADMIN') menu.push(...agentOoredooMenu, ...adminMenu, ...chefProjetMenu, ...rhMenu);
    if (this.roleUser === 'RH') menu.push(...rhMenu);
    if (this.roleUser === 'OOREDOO') menu.push(...agentOoredooMenu);
    if (menu.length > 0) menu[0].active = true;

    this.menuItems = menu;
  }

  navigateTo(route: string) {
    this.menuItems.forEach((item) => (item.active = false));
    const selectedItem = this.menuItems.find((item) => item.route === route);
    if (selectedItem) selectedItem.active = true;
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
