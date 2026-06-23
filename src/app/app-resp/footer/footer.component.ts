import {Component, Input} from '@angular/core';
import {GestionService} from '../../gestion.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  @Input() currentUser = localStorage.getItem('name') || null;
  @Input() roleUser = localStorage.getItem('role') || null;

  constructor(private router: Router, private gest: GestionService) {
  }

  logout() {
    this.gest.logout();
    this.router.navigate(['/login']);
  }
}
