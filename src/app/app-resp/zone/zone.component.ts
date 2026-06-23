import { Component, OnInit } from '@angular/core';
import { GestionService } from '../../gestion.service';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Zone, SousZone, Cite, Projet, Operateur, ViewMode, OperatorMap, ThemeMap } from './models';


@Component({
  selector: 'app-zone',
  templateUrl: './zone.component.html',
  styleUrls: ['./zone.component.css']
})
export class ZoneComponent implements OnInit {

  roleUser = '';
  projets: Projet[] = [];
  operators: Operateur[] = [];

  selectedOperator: Operateur | null = null;
  selectedProjet: Projet | null = null;
  selectedZone: Zone | null = null;
  selectedSousZone: SousZone | null = null;
  selectedCite: Cite | null = null;
  currentViewMode: ViewMode = ViewMode.ZONE;
  showAddZoneForm = false;
  showAddSousZoneForm = false;
  showAddCiteForm = false;
  showAddOperatorModal = false;
  showAddProjetModal = false;
  showClientModel = false;
  showAddClientModel = false;
  showAddClientsOoredooModel = false;
  filtredZone = '';
  zone: any = { id: '', label: '' };
//Pagination Items :
  // Pagination state
  zonePage: number = 1;
  sousZonePage: number = 1;
  citePage: number = 1;
  itemsPerPage: number = 4;
  protected readonly Math = Math;

  constructor(
    private gest: GestionService
  ) {}

// Computed paginated arrays
  get paginatedZones() {
    const start = (this.zonePage - 1) * this.itemsPerPage;
    return this.filteredZones.slice(start, start + this.itemsPerPage);
  }

  get paginatedSousZones() {
    const start = (this.sousZonePage - 1) * this.itemsPerPage;
    return this.selectedZone?.sousZones.slice(start, start + this.itemsPerPage) || [];
  }

  get paginatedCites() {
    const start = (this.citePage - 1) * this.itemsPerPage;
    return this.selectedSousZone?.cites.slice(start, start + this.itemsPerPage) || [];
  }

// Navigation functions
  prevPage(type: 'zone' | 'sousZone' | 'cite') {
    if (type === 'zone' && this.zonePage > 1) this.zonePage--;
    if (type === 'sousZone' && this.sousZonePage > 1) this.sousZonePage--;
    if (type === 'cite' && this.citePage > 1) this.citePage--;
  }

  nextPage(type: 'zone' | 'sousZone' | 'cite') {
    if (type === 'zone' && this.zonePage < Math.ceil(this.filteredZones.length / this.itemsPerPage)) this.zonePage++;
    if (type === 'sousZone' && this.sousZonePage < Math.ceil((this.selectedZone?.sousZones.length || 0) / this.itemsPerPage)) this.sousZonePage++;
    if (type === 'cite' && this.citePage < Math.ceil((this.selectedSousZone?.cites.length || 0) / this.itemsPerPage)) this.citePage++;
  }



  ngOnInit(): void {
    this.loadZonesAndProjets();
    this.roleUser = this.gest.getRoleFromToken();
  }
  private snapshotSelection() {
    return {
      operatorId: this.selectedOperator?.id ?? null,
      projetId: this.selectedProjet?.id ?? null,
      zoneId: this.selectedZone?.id ?? null,
      sousZoneId: this.selectedSousZone?.id ?? null,
      citeId: this.selectedCite?.id ?? null,
      viewMode: this.currentViewMode
    };
  }
  private restoreSelection(snapshot: any) {
    if (!snapshot) return;

    this.selectedOperator = {id : 1 , nomOperateur : 'Ooredoo'};
      //this.operators.find(o => o.id === snapshot.operatorId) ?? null;

    if (!this.selectedOperator) return;

    this.selectedProjet =
      this.filteredProjets.find(p => p.id === snapshot.projetId) ?? null;

    if (!this.selectedProjet) return;

    this.selectedZone =
      this.selectedProjet.zones.find(z => z.id === snapshot.zoneId) ?? null;

    if (!this.selectedZone) return;

    this.selectedSousZone =
      this.selectedZone.sousZones.find(sz => sz.id === snapshot.sousZoneId) ?? null;

    if (this.selectedSousZone) {
      this.selectedCite =
        this.selectedSousZone.cites.find(c => c.id === snapshot.citeId) ?? null;
    }

    this.currentViewMode = snapshot.viewMode ?? ViewMode.ZONE;
  }
  loadZonesAndProjets(): void {
    const snapshot = this.snapshotSelection();
    this.gest.getAllZonesAndProjets().subscribe({
      next: (data: any) => {
        this.projets = data.dataZonesAndProjetDTOS?.slice().reverse() ?? [];

        const REQUIRED_OPERATORS: string[] = [
          'Ooredoo', 'Orange', 'Tunisie Telecom', 'Divers'
        ];

        const backendOps: Operateur[] = (data.operateurs ?? []).map((op: any) => ({
          id: op.id,
          nomOperateur: op.nomOperateur
        }));

        const operatorsMap = new Map<string, Operateur>();

        REQUIRED_OPERATORS.forEach(name => {
          const found = backendOps.find((op: Operateur) =>
            op.nomOperateur.toLowerCase() === name.toLowerCase()
          );
          if (found) {
            operatorsMap.set(name.toLowerCase(), found);
          } else {
            operatorsMap.set(name.toLowerCase(), { id: 0, nomOperateur: name });
          }
        });

        this.operators = REQUIRED_OPERATORS.map(name => operatorsMap.get(name.toLowerCase())!);

        // Only set default operator if no selection exists
         if (!this.selectedOperator && this.operators.length) {
          this.selectedOperator = this.operators[0];
        }

        // Restore selection after data is loaded
        this.restoreSelection(snapshot);
      },
      error: err => console.error('Failed to load projets:', err)
    });
  }

  get filteredProjets(): Projet[] {
    if (!this.selectedOperator) return [];

    if (this.selectedOperator.nomOperateur === 'Divers') {
      const mainOps = ['Ooredoo', 'Orange', 'Tunisie Telecom'];
      return this.projets.filter(p => !mainOps.includes(p.operateur.nomOperateur));
    }

    return this.projets.filter(
      p => p.operateur.nomOperateur === this.selectedOperator!.nomOperateur
    );
  }

  get filteredZones(): Zone[] {
    if (!this.selectedProjet) return [];
    if (!this.filtredZone) return this.selectedProjet.zones;

    return this.selectedProjet.zones.filter(z =>
      z.label.toLowerCase().includes(this.filtredZone.toLowerCase()) ||
      z.description?.toLowerCase().includes(this.filtredZone.toLowerCase())
    );
  }
  get totalClientsProjet(): number {
    return (
      this.selectedProjet?.zones?.reduce(
        (sum, zone) => sum + (zone.clientsCount || 0),
        0
      ) ?? 0
    );
  }
  selectZone(zone: Zone): void {
    if (zone.sousZones.length > 0) {
      this.selectedZone = zone;
      this.currentViewMode = ViewMode.SOUSZONE;
      this.selectedSousZone = null;
    } else {
      this.selectedZone = zone;
      this.currentViewMode = ViewMode.ZONE;
    }
  }

  selectSousZone(sousZone: SousZone): void {
    if (sousZone.cites.length > 0) {
      this.selectedSousZone = sousZone;
      this.currentViewMode = ViewMode.CITE;
      this.selectedCite = null;
    } else {
      this.selectedSousZone = sousZone;
      this.currentViewMode = ViewMode.SOUSZONE;
    }
  }

  backToZones(): void {
    this.selectedZone = null;
    this.selectedCite = null;
    this.selectedSousZone = null;
    this.currentViewMode = ViewMode.ZONE;
  }

  backToSousZones(): void {
    this.selectedSousZone = null;
    this.selectedCite = null;
    this.currentViewMode = ViewMode.SOUSZONE;
  }

  selectOperator(op: Operateur): void {
    this.selectedOperator = op;
    this.selectedProjet = null;
    this.selectedZone = null;
    this.selectedSousZone = null;
    this.currentViewMode = ViewMode.ZONE;
  }

  selectProjet(projet: Projet): void {
    this.selectedProjet = projet;
    this.selectedZone = null;
    this.selectedSousZone = null;
    this.currentViewMode = ViewMode.ZONE;
  }

  deleteZone(zoneId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette zone ?')) return;

    this.gest.deleteZone(zoneId).subscribe(() => {
      this.loadZonesAndProjets();
      this.selectedZone = null;
      this.currentViewMode = ViewMode.ZONE;
    });
  }

  deleteSousZone(sousZoneId: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette sous-zone ?')) return;

    // You need to implement this in your service
    this.gest.deleteSousZone(sousZoneId).subscribe(() => {
      this.loadZonesAndProjets();
      this.selectedSousZone = null;
      this.currentViewMode = ViewMode.SOUSZONE;
    });
  }

  clientZone: any = {
    id: '',
    label: ''
  }
  clientSousZone: any = {
    id: '',
    label: ''
  }
  clientCite: any = {
    id: '',
    nomCite: ''
  }
  clientOperateur: any = {
    id: '',
    nomOperateur: ''
  }
  clientProjet: any = {
    id: '',
    nomProjet: ''
  }
  param: String | undefined = '';

  dataToClientModel(operateur: Operateur, projet: Projet, param?: String, zone?: Zone, sousZone?: SousZone, cite?: Cite): void {
    if (!operateur && !projet) {
      console.warn('Operateur, Projet are required to add client');
      return;
    }
    this.param = param;
    this.clientOperateur = {id:operateur.id, nomOperateur: operateur.nomOperateur};
    this.clientProjet = {id:projet.id, nomProjet: projet.nomProjet};
    if (zone) {
      this.clientZone = { id:zone.id,label:zone.label};
    }
    if (sousZone) {
      this.clientSousZone = { id:sousZone.id, label:sousZone.label};
    } else {
      this.clientSousZone = null;
    }
    if (cite) {
      this.clientCite = {id:cite.id, nomCite:cite.nomCite};
    } else {
      this.clientCite = null;
    }
    this.selectedCite = cite || null;

  }
  addClient(operateur: Operateur, projet: Projet, zone: Zone, sousZone?: SousZone, cite?: Cite): void {
    this.dataToClientModel(operateur, projet, '', zone, sousZone, cite);
    this.showAddClientModel = true;

  }
  addClientsOoredoo(operateur: Operateur, projet: Projet) {
    this.dataToClientModel(operateur, projet);
    this.showAddClientsOoredooModel = true;
  }

  onAddClientsOoredooClose() {
    this.showAddClientsOoredooModel = false;
    // Clear the client data
    this.clientOperateur = { id: '', nomOperateur: '' };
    this.clientProjet = { id: '', nomProjet: '' };
  }
  // Add this method to handle refresh from Ooredoo modal
  onRefreshAfterOoredooAdd(): void {
    // Save current selection before refresh
    const snapshot = this.snapshotSelection();

    // Reload data
    this.loadZonesAndProjets();

    // Close the modal
    this.showAddClientsOoredooModel = false;

    // Clear client data
    this.clientOperateur = { id: '', nomOperateur: '' };
    this.clientProjet = { id: '', nomProjet: '' };
  }
  // Fixed toggleClientsModel method - properly handle null values
  toggleClientsModel(operateur: Operateur, projet: Projet, param?: String, zone?: Zone, sousZone?: SousZone, cite?: Cite): void {
    this.dataToClientModel(operateur, projet, param, zone, sousZone, cite);
    this.showClientModel = true;
  }

  toggleAddZoneForm(): void {
    this.showAddZoneForm = !this.showAddZoneForm;
  }
  toggleAddSousZoneForm(): void {
    this.showAddSousZoneForm = !this.showAddSousZoneForm;
  }
  toggleAddCiteForm(): void {
    this.showAddCiteForm = !this.showAddCiteForm;
  }

  toggleAddOperateurForm(): void {
    this.showAddOperatorModal = !this.showAddOperatorModal;
  }

  getThemeClass(): string {
    if (!this.selectedOperator) return 'theme-divers';

    const themeMap: ThemeMap = {
      'ooredoo': 'theme-ooredoo',
      'orange': 'theme-orange',
      'tunisie telecom': 'theme-tunisietelecom',
      'divers': 'theme-divers'
    };

    return themeMap[this.selectedOperator.nomOperateur.toLowerCase()] || 'theme-divers';
  }

  getOperatorIcon(op: Operateur): string {
    const iconMap: OperatorMap = {
      'ooredoo': 'fa-broadcast-tower',
      'orange': 'fa-broadcast-tower',
      'tunisie telecom': 'fa-satellite-dish',
      'divers': 'fa-building'
    };

    return iconMap[op.nomOperateur.toLowerCase()] || 'fa-building';
  }

  getOperatorCardClass(op: Operateur): string {
    const classes = ['projet-card-modern'];

    if (this.selectedOperator?.nomOperateur === op.nomOperateur) {
      classes.push('selected');
    }

    const name = op.nomOperateur.toLowerCase();

    if (name.includes('ooredoo')) classes.push('operator-ooredoo');
    else if (name.includes('orange')) classes.push('operator-orange');
    else if (name.includes('tunisie')) classes.push('operator-tt');
    else classes.push('operator-divers');

    return classes.join(' ');
  }

  getOperatorClass(type: string): string {
    const baseClasses: { [key: string]: string } = {
      'btn': 'btn submit-btn',
      'badge': 'project-count',
      'card': 'projet-card-modern',
      'card-icon': 'card-icon',
      'label': 'label-badge',
      'btn-action': 'btn-action'
    };

    return baseClasses[type] || '';
  }

  getIconForOperator(op: string): string {
    const iconMap: OperatorMap = {
      'Ooredoo': 'fa-broadcast-tower',
      'Orange': 'fa-broadcast-tower',
      'Tunisie Telecom': 'fa-satellite-dish',
      'Divers': 'fa-building'
    };

    const operatorKey = Object.keys(iconMap).find(key =>
      key.toLowerCase() === op.toLowerCase()
    );

    return iconMap[operatorKey || 'Divers'] || 'fa-building';
  }

  scrollLeft(container: HTMLElement): void {
    container.scrollBy({ left: -320, behavior: 'smooth' });
  }

  scrollRight(container: HTMLElement): void {
    container.scrollBy({ left: 320, behavior: 'smooth' });
  }

  addNewOperatorPrompt(): void {
    this.showAddOperatorModal = true;
    setTimeout(() => {
      const input = document.querySelector('.modal-input') as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  toggleAddProjet(op: Operateur): void {
    if (!this.selectedOperator || this.selectedOperator.id !== op.id) {
      this.selectedOperator = op;
      this.selectedProjet = null;
    }
    this.showAddProjetModal = true;
  }


  protected onAddClient() {
    this.clientZone= {id: '', label: '' };
    this.clientSousZone = { id: '', label: '' };
    this.clientCite = { id: '', nomCite: '' };
    this.clientOperateur = { id: '', nomOperateur: '' };
    this.clientProjet = { id: '', nomProjet: '' };
    this.showAddClientModel = false;
  }
  previewData: any[] = [];
  showPreviewModal = false;

  openExportPreview(selectedProjet: Projet) {
    this.gest.getAllRaccordementsToExcel(selectedProjet.id).subscribe({
      next: (data: any[]) => {
        this.previewData = data;
        this.showPreviewModal = true;
      },
      error: (err) => console.error(err)
    });
  }

  /**
   * Extract ISO date safely
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const isoPart = dateStr.split(' ')[0];
    const date = new Date(isoPart);

    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  confirmExport(selectedProjet: Projet) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Raccordements');

    const baseFont = { name: 'Calibri', size: 11 };

    // -------------------------
    // Columns
    // -------------------------
    sheet.columns = [
      { header: 'Cas CRM', key: 'label', width: 20 },
      { header: 'ZONE', key: 'zoneLabel', width: 25 },
      { header: 'RESIDENCE', key: 'adresse', width: 40 },
      { header: 'ABONNES', key: 'nomClient', width: 25 },
      { header: 'S/N ONT', key: 'snont', width: 18 },
      { header: 'Numéro Fixe', key: 'msisdn', width: 18 },
      { header: 'Équipe', key: 'equipe', width: 20 },
      { header: '📅 Date RDV', key: 'dateRDV', width: 28 },
      { header: "Chef d'équipe", key: 'chefEquipe', width: 25 },
      { header: 'Techniciens', key: 'techniciens', width: 18 },
      { header: 'SN Box', key: 'snBox', width: 20 }
    ];

    // -------------------------
    // Sort by RDV date
    // -------------------------
    const sorted = [...this.previewData].sort((a, b) => {
      const d1 = this.parseDate(a.dateRDV)?.getTime() || 0;
      const d2 = this.parseDate(b.dateRDV)?.getTime() || 0;
      return d1 - d2;
    });

    // -------------------------
    // HEADER STYLE
    // -------------------------
    const header = sheet.getRow(1);
    header.font = { ...baseFont, bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4E79' }
    };
    header.alignment = { vertical: 'middle', horizontal: 'center' };

    header.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // -------------------------
    // DATA ROWS
    // -------------------------
    sorted.forEach(row => {
      const formattedDate = row.dateRDV
        ? `📅 ${this.formatDate(this.parseDate(row.dateRDV)!)}`   // icon added here
        : 'Sans date';

      const added = sheet.addRow({
        ...row,
        dateRDV: formattedDate
      });

      added.font = baseFont;

      added.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true
      };

      added.eachCell((cell, colNumber) => {

        // -------------------------
        // RDV COLUMN SPECIAL STYLE
        // -------------------------
        if (colNumber === 8) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true
          };

          cell.font = {
            name: 'Calibri',
            size: 11,
            bold: true,
            color: { argb: 'FF1F4E79' }
          };

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE8F1FB' } // light blue background
          };
        }

        // -------------------------
        // NORMAL BORDERS
        // -------------------------
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // -------------------------
    // MERGE SAME RDV VALUES
    // -------------------------
    let startRow = 2;
    let currentValue: string | null = null;

    for (let i = 0; i < sorted.length; i++) {
      const rowIndex = i + 2;
      const value = sorted[i].dateRDV || 'Sans date';

      if (value !== currentValue) {
        if (i > 0 && startRow < rowIndex - 1) {
          sheet.mergeCells(`H${startRow}:H${rowIndex - 1}`);
        }
        startRow = rowIndex;
        currentValue = value;
      }
    }

    const lastRow = sorted.length + 1;
    if (startRow < lastRow) {
      sheet.mergeCells(`H${startRow}:H${lastRow}`);
    }

    // -------------------------
    // EXPORT
    // -------------------------
    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(blob, `raccordements_${selectedProjet.nomProjet}.xlsx`);
    });

    this.showPreviewModal = false;
  }
}
