import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GestionService } from '../../../gestion.service';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';

interface ClientDTO {
  label?: string | null;
  nom?: string | null;
  numTelephone?: string | null;
  sla?: string | null;
  debit?: string | null;
  bridge?: boolean;
  msisdn?: string | null;
  adresse?: string | null;
  etat?: EtatOT | null;
  dateRDV?: string | null;
  heureRDV?: string | null;
  zoneName?: string | null;
  latitude?: number | 0.0;
  longitude?: number | 0.0;
  selected?: boolean;
}

export interface EtatOT {
  id?: number;
  etatOT: string;
  dateOT?: string;
}

export interface Projet {
  id: string;
  nomProjet: string;
}

export interface Operateur {
  id: number;
  nomOperateur: string;
}

@Component({
  selector: 'app-add-clients-ooredoo',
  templateUrl: './add-clients-ooredoo.component.html',
  styleUrl: './add-clients-ooredoo.component.css'
})
export class AddClientsOoredooComponent implements OnInit {

  @Input() projet!: Projet | null;
  @Input() operateur!: Operateur | null;

  @Output() refresh = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  clients: ClientDTO[] = [];

  addedClients: any = {
    clients: [],
    projetId: '',
  };

  headerRow = 1;
  isSubmitting = false; // Add this to prevent multiple submissions

  constructor(
    private router: Router,
    private gest: GestionService
  ) {}

  ngOnInit(): void {}

  getThemeClass(): string {
    const name = this.operateur?.nomOperateur?.toLowerCase()?.trim();

    if (!name) return 'theme-divers';

    if (name.includes('ooredoo')) return 'theme-ooredoo';
    if (name.includes('orange')) return 'theme-orange';
    if (name.includes('tunisie telecom') || name.includes('tunisietelecom')) {
      return 'theme-tunisietelecom';
    }

    return 'theme-divers';
  }

  parseBoolean(value: any): boolean {
    if (value === null || value === undefined) return false;

    if (typeof value === 'boolean') return value;

    if (typeof value === 'number') return value === 1;

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }

    return false;
  }

  excelTimeToHHMM(value: number): string {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private excelDateToJSDate(serial: number): string {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0];
  }

  onFileChange(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e: any) => {
      const binaryStr = e.target.result;
      const workbook = XLSX.read(binaryStr, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<any>(worksheet, {
        range: this.headerRow - 1
      });

      const op = this.operateur?.nomOperateur?.toLowerCase()?.trim();
      if (op === 'ooredoo') {
        this.clients = data.map(row => ({
          label: row['CRM CASE ID'] ?? '',
          nom: row['Client'] ?? '',
          numTelephone: row['Contact'] ?? '',
          msisdn: row['MSISDN'] ?? '',
          sla: row['SLA'] ?? '',
          debit: row['Debit'] ?? '',
          bridge: this.parseBoolean(row['Bridge']),
          etat: {
            id: 0,
            etatOT: 'Emis',
            dateOT: typeof row['DATE affectation'] === 'number'
              ? this.excelDateToJSDate(row['DATE affectation'])
              : row['DATE affectation'] ?? '',
          },
          adresse: row['Immeuble'] + ' - App: ' + row['Appartement'] ?? '',
          zoneName: row['Zone'],
          dateRDV: typeof row['Date RDV'] === 'number'
            ? this.excelDateToJSDate(row['Date RDV'])
            : row['Date RDV'] ?? '',
          heureRDV: this.excelTimeToHHMM(row['HeureRDV']) ?? '',
          latitude: row['Latitude'],
          longitude: row['Longitude'],
          selected: false
        }));
      }

      this.addedClients = {
        clients: this.clients,
        projetId: this.projet?.id
      };
      console.log('Parsed clients:', this.clients);
    };

    reader.readAsArrayBuffer(file);
  }

  // Selection Methods
  isAllSelected(): boolean {
    return this.clients.length > 0 && this.clients.every(client => client.selected === true);
  }

  toggleSelectAll(event: any): void {
    const isChecked = event.target.checked;
    this.clients.forEach(client => client.selected = isChecked);
  }

  onSelectionChange(): void {
    // This method is called when individual checkboxes change
  }

  getSelectedCount(): number {
    return this.clients.filter(client => client.selected === true).length;
  }

  clearSelection(): void {
    this.clients.forEach(client => client.selected = false);
  }

  addSelectedClients() {
    if (this.isSubmitting) return; // Prevent multiple submissions

    const selectedClients = this.clients.filter(client => client.selected === true);

    if (selectedClients.length === 0) {
      alert('Veuillez sélectionner au moins un client');
      return;
    }

    this.isSubmitting = true;

    const clientsToSend = selectedClients.map(client => {
      const { selected, ...clientData } = client;
      return clientData;
    });
    const addedClientsToSend: any = {
      clients: clientsToSend,
      projetId: this.projet?.id,
    };

    this.gest.batchAddClientsOoredoo(addedClientsToSend).subscribe({
      next: () => {
        alert(`${selectedClients.length} client(s) importé(s) avec succès!`);

        // Remove only the selected clients from the list
        this.clients = this.clients.filter(client => !client.selected);

        this.isSubmitting = false;

        // Only close the modal if the list is empty
        if (this.clients.length === 0) {
          // Small delay to ensure alert is seen before closing
          setTimeout(() => {
            this.refresh.emit();
            this.close.emit();
          }, 500);
        }
        // Do NOT emit refresh if list is not empty - this prevents modal from closing
      },
      error: (err: any) => {
        console.error(err);
        alert('Échec de l\'importation');
        this.isSubmitting = false;
      }
    });
  }


  // Keep original method but rename to avoid confusion
  batchAddClients() {
    this.addSelectedClients();
  }
}
