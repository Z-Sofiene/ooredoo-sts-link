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
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'] // ✅ corrected to plural
})
export class HeaderComponent implements OnInit {
  @Input() roleUser = localStorage.getItem('role') || null;

  menuItems: MenuItem[] = [];
  isMenuOpen = false; // ✅ controls the mobile overlay

  constructor(private router: Router, private gest: GestionService) {}

  ngOnInit() {
    const menu: MenuItem[] = [];

    // RH menu items
    const rhMenu: MenuItem[] = [
      { icon: 'fas fa-users', label: 'Utilisateurs', route: '/users', active: false },
    ];

    // Admin menu
    const adminMenu: MenuItem[] = [
      { icon: 'fas fa-tachometer-alt', label: 'Tableau de bord', route: '/dashboard/admin', active: false },
    ]

    //Chef projet Menu
    const chefProjetMenu: MenuItem[] = [
      { icon: 'fas fa-project-diagram text-white-900', label: 'Projets', route: '/projets', active: false },
      { icon: 'fas fa-tower-broadcast text-white-900', label: 'Operateurs', route: '/operateurs', active: false },
    ]

    // RESPONSABLE menu items
    const respMenu: MenuItem[] = [
      { icon: 'fas fa-route text-white-900', label: 'Tableau de bord', route: '/dashboard', active: false },
    ];
    const agentOoredooMenu: MenuItem[] = [
      { icon: 'fas fa-network-wired text-white-900', label: 'Abonnés FTTH', route: '/raccordements', active: false },
    ];
    //Magasinier Menu
    const magasinierMenu: MenuItem[] = [
      { icon: 'fas fa-box text-white-900', label: 'Articles', route: '/articles', active: false },
    ];

    if (this.roleUser === 'CHEFPROJET') menu.push(...respMenu, ...agentOoredooMenu, ...chefProjetMenu, ...magasinierMenu, ...rhMenu);
    if (this.roleUser === 'RESPONSABLE') menu.push(...respMenu, ...agentOoredooMenu, ...magasinierMenu);
    if (this.roleUser === 'ADMIN') menu.push(...adminMenu, ...agentOoredooMenu, ...chefProjetMenu, ...rhMenu);
    if (this.roleUser === 'RH') menu.push(...rhMenu);
    if (this.roleUser === 'OOREDOO') menu.push(...agentOoredooMenu);

    // Optionally mark the first item as active
    if (menu.length > 0) menu[0].active = true;

    this.menuItems = menu;
  }

  navigateTo(route: string) {
    this.menuItems.forEach((item) => (item.active = false));
    const selectedItem = this.menuItems.find((item) => item.route === route);
    if (selectedItem) selectedItem.active = true;
    this.router.navigate([route]);
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
