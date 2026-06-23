import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GestionService } from '../../../gestion.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import * as XLSX from 'xlsx';
import { ClientDTO, Operateur, Projet, Zone, SousZone, Cite, EtatOT } from './demande.model';

@Component({
  selector: 'app-add-client',
  templateUrl: './add-client.component.html',
  styleUrls: ['./add-client.component.css']
})
export class AddClientComponent implements OnInit {

  @Input() zone!: Zone | null;
  @Input() sousZone!: SousZone | null;
  @Input() cite!: Cite | null;
  @Input() projet!: Projet | null;
  @Input() operateur!: Operateur | null;

  @Output() refresh = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  clients: ClientDTO[] = [];

  addedClients: any = {
    clients: [],
    zoneId: '',
    sousZoneId: '',
    citeId: '',
  };

  headerRow = 1;
  viewMode: 'client' | 'clients' = 'client';

  newClient: any = {
    numVoip: '',
    nom: '',
    cin: '',
    label: '',
    email: '',
    numTelephone: '',
    numTelephone2: '',
    msisdn: '',
    adresse: '',
    dateRDV: '',
    heureRDV: '',
    etat: {
      id: 0,
      etatOT: '',
      dateOT: '',
    },
    zoneId: '',
    zoneName: '',
    sousZoneId: '',
    sousZoneName: '',
    citeId: '',
    citeName: '',
  };

  etatOTs: EtatOT[] = [];

  constructor(
    private router: Router,
    private gest: GestionService
  ) {}

  ngOnInit(): void {
    this.newClient.zoneId = this.zone?.id ?? null;
    this.newClient.sousZoneId = this.sousZone?.id ?? null;
    this.newClient.citeId = this.cite?.id ?? null;

    this.loadEtatOT();
  }

  loadEtatOT() {
    this.gest.getAllEtatOT().subscribe(data => {
      this.etatOTs = data;
    });
  }

  addNewClient() {
    if (!this.newClient.nom || !this.newClient.label) {
      alert('Veuillez remplir les champs obligatoires (Nom, Label)');
      return;
    }

    this.gest.addClient(this.newClient).subscribe({
      next: (clientObj: any) => {

        localStorage.setItem('newClient', JSON.stringify(clientObj));

        this.newClient = {
          numVoip: '',
          nom: '',
          cin: '',
          label: '',
          email: '',
          numTelephone: '',
          numTelephone2: '',
          msisdn: '',
          adresse: '',
          dateRDV: '',
          heureRDV: '',
          etat: {
            id: 0,
            etatOT: '',
            dateOT: ''
          },
          zoneId: this.zone?.id ?? null,
          zoneName: this.zone?.label ?? null,
          sousZoneId: this.sousZone?.id ?? null,
          sousZoneName: this.sousZone?.label ?? null,
          citeId: this.cite?.id ?? null,
          citeName: this.cite?.nomCite ?? null,
        };

        alert('Client ajouté avec succès!');
        this.router.navigate(['/addRaccordement']);
      },

      error: (err: HttpErrorResponse) => {
        console.error(err);

        const msg = err.error?.message;

        if (err.status === 409) alert('⚠️ ' + msg);
        else if (err.status === 404) alert('❌ Ressource introuvable : ' + msg);
        else if (err.status === 400) alert('❌ Données invalides : ' + msg);
        else alert('🚨 Erreur serveur');
      }
    });
  }

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

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
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

      if (op === 'tunisie telecom') {

        this.clients = data.map(row => ({
          label: row['Ref. demande'] ?? '',
          numVoip: row['Num. VoIP']?.toString() ?? null,
          nom: row['Client'] ?? '',
          numTelephone: row['Tél Client 1'] ?? '',
          numTelephone2: row['Tél Client 2'] ?? '',
          email: row['E-mail Client'] ?? '',
          adresse: row['Adresse installation'] ?? '',
          etat: {
            id: 0,
            etatOT: row['Etat OT'] ?? '',
            dateOT: typeof row['Date OT'] === 'number'
              ? this.excelDateToJSDate(row['Date OT'])
              : row['Date OT'] ?? '',
          }
        }));
      }

      else if (op === 'ooredoo') {
//
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
          sousZoneName: row['Zone'],
          dateRDV: typeof row['Date RDV'] === 'number'
            ? this.excelDateToJSDate(row['Date RDV'])
            : row['Date RDV'] ?? '',
          heureRDV: this.excelTimeToHHMM(row['HeureRDV']) ?? '',
          latitude: row['Latitude'],
          longitude: row['Longitude']
        }));
      }

      this.addedClients = {
        clients: this.clients,
        zoneId: this.zone?.id ?? null,
        sousZoneId: this.sousZone?.id ?? null,
        citeId: this.cite?.id ?? null,
      };

      console.log('Parsed clients:', this.clients);
    };

    reader.readAsArrayBuffer(file);
  }
  private excelDateToJSDate(serial: number): string {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);

    return date_info.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  batchAddClients() {
    const op = this.operateur?.nomOperateur?.toLowerCase()?.trim();

    if (!op) {
      alert('Operator is missing');
      return;
    }

    const serviceMap: Record<string, any> = {
      'tunisie telecom': this.gest.batchAddClientsTunTel.bind(this.gest),
      'ooredoo': this.gest.batchAddClientsZoneOoredoo.bind(this.gest)
    };

    const serviceCall = serviceMap[op];

    if (!serviceCall) {
      alert('Unsupported operator');
      return;
    }

    serviceCall(this.addedClients).subscribe({
      next: () => {
        alert('Import successful !');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        console.error(err);
        alert('Import failed');
      }
    });
  }
}
