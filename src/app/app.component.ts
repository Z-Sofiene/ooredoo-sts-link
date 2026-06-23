import { Component} from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'sts-groupe-app';
/*
  // Disable right click
  @HostListener('document:contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault();
  }

  // Disable DevTools shortcuts
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {

    // F12
    if (event.key === 'F12') {
      event.preventDefault();
      return;
    }

    // Ctrl + Shift + I / J / C
    if (
      event.ctrlKey &&
      event.shiftKey &&
      ['I', 'J', 'C'].includes(event.key.toUpperCase())
    ) {
      event.preventDefault();
      return;
    }

    // Ctrl + U (view source)
    if (event.ctrlKey && event.key.toLowerCase() === 'u') {
      event.preventDefault();
    }
  }

 */
}
