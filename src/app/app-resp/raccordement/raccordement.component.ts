import {Component, OnInit} from '@angular/core';
import {GestionService} from '../../gestion.service';
import ExcelJS from 'exceljs';
import {saveAs} from 'file-saver';

interface Zone {
  id: number;
  nomZone: string;
}

interface Projet {
  id: number;
  nomProjet: string;
  zones: Zone[];
}

interface Operateur { id: number; nomOperateur: string; }

@Component({
  selector: 'app-raccordement',
  templateUrl: './raccordement.component.html',
  styleUrls: ['./raccordement.component.css']
})
export class RaccordementComponent implements OnInit {

  raccordements: any[] = [];
  filteredRaccordements: any[] = [];

  currentPage = 1;
  itemsPerPage = 10;

  // =========================
  // FILTERS
  // =========================

  filterProjet = '';
  filterZone = '';
  filterClient = '';
  filterChef = '';
  filterTitre = '';
  filterDateRDV = '';
  filterDateStart = '';
  filterDateEnd = '';
  filterEtat = '';
  filterDebit = '';
  filterTelephone = '';
  filterFixe = '';

  // =========================
  // SORTING
  // =========================

  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // =========================
  // DROPDOWNS
  // =========================

  projets: Projet[] = [];
  filteredZones: Zone[] = [];
  chefsEquipe: string[] = [];
  debits: string[] = [];

  showTacheModel = false;
  selectedClientId: string | null = null;
  selectedZone: string = '';
  selectedProjet: string = '';
  selectedOperator: Operateur | null = null;

  constructor(private gest: GestionService) {}

  ngOnInit() {
    this.loadRaccordements();
  }

  // =========================
  // LOAD DATA
  // =========================

  loadRaccordements() {
    this.gest.getAllRaccordementByResponsable().subscribe({
      next: (res: any[]) => {
        this.raccordements = res?.slice().reverse() || [];
        this.extractedProjetsAndZones();
        this.extractDynamicFilters();
        this.applyFilters();
        this.selectedOperator = {id : 1 , nomOperateur : 'Ooredoo'};
      },
      error: err => console.error('Failed to load raccordements:', err)
    });
  }

  // =========================
  // EXTRACT PROJECT / ZONES
  // =========================

  extractedProjetsAndZones() {
    const projetMap = new Map<string, Projet>();
    this.raccordements.forEach(r => {
      if (!r.projet) return;
      if (!projetMap.has(r.projet)) {
        projetMap.set(r.projet, {
          id: projetMap.size + 1,
          nomProjet: r.projet,
          zones: []
        });
      }
      if (r.zone) {
        const projet = projetMap.get(r.projet)!;
        const exists = projet.zones.some(z => z.nomZone === r.zone);
        if (!exists) {
          projet.zones.push({
            id: projet.zones.length + 1,
            nomZone: r.zone
          });
        }
      }
    });
    this.projets = Array.from(projetMap.values());
    this.filteredZones = [];
  }

  // =========================
  // DYNAMIC FILTER VALUES
  // =========================

  extractDynamicFilters() {
    this.chefsEquipe = [
      ...new Set(
        this.raccordements.map(r => r.chef_equipe).filter(v => v)
      )
    ];
    this.debits = [
      ...new Set(
        this.raccordements.map(r => r.debit).filter(v => v)
      )
    ];
  }

  onProjetChange() {
    const projet = this.projets.find(p => p.nomProjet === this.filterProjet);
    this.filteredZones = projet ? projet.zones : [];
    this.filterZone = '';
    this.applyFilters();
  }

  // =========================
  // FILTER ENGINE (fixed date handling)
  // =========================

  applyFilters() {
    this.filteredRaccordements = this.raccordements.filter(r => {
      const fullClient = `${r.nomClient || ''} ${r.prenomClient || ''}`.toLowerCase();

      const matchProjet = !this.filterProjet || r.projet === this.filterProjet;
      const matchZone = !this.filterZone || r.zone === this.filterZone;
      const matchClient = !this.filterClient || fullClient.includes(this.filterClient.toLowerCase());
      const matchChef = !this.filterChef || r.chef_equipe === this.filterChef;
      const matchTitre = !this.filterTitre || (r.titre || '').toLowerCase().includes(this.filterTitre.toLowerCase());

      // ---- DATE FIX: compare strings directly (YYYY-MM-DD) ----
      const matchDate = !this.filterDateRDV || r.dateRDV === this.filterDateRDV;
      const matchDateStart = !this.filterDateStart || (r.dateRDV && r.dateRDV >= this.filterDateStart);
      const matchDateEnd = !this.filterDateEnd || (r.dateRDV && r.dateRDV <= this.filterDateEnd);

      const matchEtat = !this.filterEtat || r.etatRaccordement === this.filterEtat;
      const matchDebit = !this.filterDebit || r.debit === this.filterDebit;
      const matchTelephone = !this.filterTelephone || (r.numTelephone || '').includes(this.filterTelephone);
      const matchFixe = !this.filterFixe || (r.numFixe || '').includes(this.filterFixe);

      return matchProjet && matchZone && matchClient && matchChef &&
        matchTitre && matchDate && matchDateStart && matchDateEnd &&
        matchEtat && matchDebit && matchTelephone && matchFixe;
    });

    if (this.sortField) this.applySorting();
    else this.currentPage = 1;
  }

  // =========================
  // SORT (use string comparison for dates)
  // =========================

  applySorting() {
    this.filteredRaccordements.sort((a, b) => {
      let aValue = a[this.sortField];
      let bValue = b[this.sortField];

      if (this.sortField === 'projet') {
        aValue = a.projet || '';
        bValue = b.projet || '';
      }
      if (this.sortField === 'zone') {
        aValue = a.zone || '';
        bValue = b.zone || '';
      }
      if (this.sortField === 'dateRDV') {
        // Compare strings directly – YYYY-MM-DD is lexicographically sortable
        aValue = a.dateRDV || '';
        bValue = b.dateRDV || '';
      }

      return this.sortDirection === 'asc'
        ? (aValue > bValue ? 1 : -1)
        : (aValue < bValue ? 1 : -1);
    });
    this.currentPage = 1;
  }

  // =========================
  // PAGINATION
  // =========================

  paginatedRaccordements() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredRaccordements.slice(start, start + this.itemsPerPage);
  }

  totalPages() {
    return Math.ceil(this.filteredRaccordements.length / this.itemsPerPage) || 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) this.currentPage++;
  }

  prevPage() {
    if (this.currentPage > 1) this.currentPage--;
  }

  firstPage() {
    this.currentPage = 1;
  }

  lastPage() {
    this.currentPage = this.totalPages();
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage = page;
    }
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
  }

  getStartIndex(): number {
    if (this.filteredRaccordements.length === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredRaccordements.length);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage;
    const delta = 2;
    const range = [];
    const rangeWithDots: number[] = [];
    let l: number;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push(-1);
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  }

  // =========================
  // ACTIONS
  // =========================

  viewRaccordement(clientId: string) {
    const raccordement = this.raccordements.find(r => r.clientId === clientId);
    if (raccordement) {
      this.selectedClientId = clientId;
      this.selectedZone = raccordement.zone || '';
      this.selectedProjet = raccordement.projet || '';
      this.showTacheModel = true;
    } else {
      console.warn('Raccordement non trouvé pour clientId:', clientId);
    }
  }
  closeDetailModal() {
    this.showTacheModel = false;
    this.selectedClientId = null;
    this.selectedZone = '';
    this.selectedProjet = '';
  }

  resetFilters() {
    this.filterProjet = '';
    this.filterZone = '';
    this.filterClient = '';
    this.filterChef = '';
    this.filterTitre = '';
    this.filterDateRDV = '';
    this.filterDateStart = '';
    this.filterDateEnd = '';
    this.filterEtat = '';
    this.filterDebit = '';
    this.filterTelephone = '';
    this.filterFixe = '';
    this.sortField = '';
    this.sortDirection = 'asc';
    this.filteredZones = [];
    this.currentPage = 1;
    this.applyFilters();
  }

  exportData() {
    this.openPreview();
  }
  refreshData() {
    this.loadRaccordements();
  }

  // =========================
  // EXPORT PREVIEW
  // =========================

  showPreviewModal = false;
  previewData: any[] = [];
  previewProjet: Projet | null = null;
  isLoadingPreview = false;
  appliedFilters: { label: string; value: any }[] = [];

  /**
   * Parse a YYYY-MM-DD string as UTC to avoid timezone shifts.
   */
  private parseDateUTC(dateStr: string): Date | null {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const [year, month, day] = parts.map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  /**
   * Format a UTC date for display in Excel (French locale, no timezone shift).
   */
  private formatDateForExcel(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      timeZone: 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private mapForExport(r: any) {
    const i = r.intervention;
    return {
      label: i?.label ?? '',
      zoneLabel: i?.zoneLabel ?? '',
      adresse: i?.adresse ?? '',
      nomClient: i?.nomClient ?? '',
      snont: i?.snont ?? '',
      msisdn: i?.msisdn ?? '',
      equipe: i?.equipe ?? '',
      dateRDV: i?.dateRDV ?? '',          // keep as string YYYY-MM-DD
      chefEquipe: i?.chefEquipe ?? '',
      techniciens: i?.techniciens ?? '',
      snBox: i?.snBox ?? '',
      etat: r.etatRaccordement ?? ''     // NEW COLUMN
    };
  }

  /**
   * Build a filename from the applied filters.
   * Keeps only the most relevant filters to avoid excessively long names.
   */
  private buildFileName(baseProject: string, dateToday: string): string {
    // Start with the project name (or "Tous" if none)
    let nameParts = [baseProject || 'Tous'];

    // Add zone if set
    if (this.filterZone) {
      nameParts.push(`Zone_${this.filterZone}`);
    }

    // Add date range if both start and end are set
    if (this.filterDateStart && this.filterDateEnd) {
      nameParts.push(`Du_${this.filterDateStart}_Au_${this.filterDateEnd}`);
    } else if (this.filterDateStart) {
      nameParts.push(`Apres_${this.filterDateStart}`);
    } else if (this.filterDateEnd) {
      nameParts.push(`Avant_${this.filterDateEnd}`);
    }

    // Add specific RDV date if set
    if (this.filterDateRDV) {
      nameParts.push(`RDV_${this.filterDateRDV}`);
    }

    // Add chef d'équipe if set
    if (this.filterChef) {
      nameParts.push(`Chef_${this.filterChef.replace(/\s+/g, '_')}`);
    }

    // Add état if set
    if (this.filterEtat) {
      nameParts.push(`Etat_${this.filterEtat}`);
    }

    // Add client search term (optional, but may be too specific)
    if (this.filterClient) {
      nameParts.push(`Client_${this.filterClient.replace(/\s+/g, '_')}`);
    }

    // Sanitize parts to remove invalid filename characters
    const sanitized = nameParts.map(part =>
      part.replace(/[<>:"/\\|?*]/g, '_') // replace forbidden chars in Windows filenames
    );

    // Join with underscores and append the date
    return `raccordements_${sanitized.join('_')}_${dateToday}.xlsx`;
  }
  /**
   * Build applied filters for the header.
   */
  private buildAppliedFilters(): { label: string; value: any }[] {
    const filters: { label: string; value: any }[] = [];
    if (this.filterProjet) filters.push({ label: 'Projet', value: this.filterProjet });
    if (this.filterZone) filters.push({ label: 'Zone', value: this.filterZone });
    if (this.filterDateStart && this.filterDateEnd) {
      filters.push({ label: 'Période', value: `${this.filterDateStart} → ${this.filterDateEnd}` });
    } else if (this.filterDateStart) {
      filters.push({ label: 'Date début', value: this.filterDateStart });
    } else if (this.filterDateEnd) {
      filters.push({ label: 'Date fin', value: this.filterDateEnd });
    }
    if (this.filterChef) filters.push({ label: "Chef d'équipe", value: this.filterChef });
    if (this.filterDateRDV) filters.push({ label: 'RDV', value: this.filterDateRDV });
    if (this.filterEtat) filters.push({ label: 'État', value: this.filterEtat });
    return filters;
  }

  openPreview() {
    const source = this.filteredRaccordements;
    if (!source?.length) {
      alert('Aucun raccordement ne correspond aux filtres actuels.');
      return;
    }

    this.isLoadingPreview = true;
    this.appliedFilters = this.buildAppliedFilters();
    this.previewData = source.map(r => this.mapForExport(r));
    this.previewProjet = this.filterProjet
      ? this.projets.find(p => p.nomProjet === this.filterProjet) ||
      { id: 0, nomProjet: this.filterProjet, zones: [] }
      : { id: 0, nomProjet: 'Tous les projets', zones: [] };

    this.isLoadingPreview = false;
    this.showPreviewModal = true;
  }

  async confirmExport(selectedProjet: Projet) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Raccordements');

    const baseFont = { name: 'Calibri', size: 11 };
    const boldFont = { ...baseFont, bold: true };
    const titleFont = {
      ...baseFont,
      bold: true,
      size: 14,
      color: { argb: 'FF1F4E79' }
    };

    let currentRow = 2; // Row 1 empty

    // TITLE
    const titleRow = sheet.getRow(currentRow++);
    titleRow.getCell(1).value = 'Abonnés FTTH OOREDOO';
    titleRow.getCell(1).font = titleFont;
    sheet.mergeCells(`A${currentRow - 1}:L${currentRow - 1}`); // extended to L because of new column
    currentRow++;

    // FILTERS HEADER
    if (this.appliedFilters.length) {
      const filterHeaderRow = sheet.getRow(currentRow++);
      this.appliedFilters.forEach((filter, index) => {
        const cell = filterHeaderRow.getCell(index + 1);
        cell.value = filter.label;
        cell.font = boldFont;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      const filterValueRow = sheet.getRow(currentRow++);
      this.appliedFilters.forEach((filter, index) => {
        const cell = filterValueRow.getCell(index + 1);
        cell.value = filter.value;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
      currentRow++;
    }

    // COLUMNS – added 'État' as the 9th column (after date)
    sheet.columns = [
      { header: 'Cas CRM', key: 'label', width: 20 },
      { header: 'ZONE', key: 'zoneLabel', width: 25 },
      { header: 'RESIDENCE', key: 'adresse', width: 40 },
      { header: 'ABONNES', key: 'nomClient', width: 25 },
      { header: 'S/N ONT', key: 'snont', width: 18 },
      { header: 'Numéro Fixe', key: 'msisdn', width: 18 },
      { header: 'Équipe', key: 'equipe', width: 20 },
      { header: '📅 Date RDV', key: 'dateRDV', width: 28 },
      { header: 'État', key: 'etat', width: 18 },          // NEW COLUMN
      { header: "Chef d'équipe", key: 'chefEquipe', width: 25 },
      { header: 'Techniciens', key: 'techniciens', width: 18 },
      { header: 'SN Box', key: 'snBox', width: 20 }
    ];

    // TABLE HEADER
    const headerRowIndex = currentRow;
    const headerRow = sheet.getRow(headerRowIndex);
    sheet.columns.forEach((col, index) => {
      headerRow.getCell(index + 1).value = col.header as string;
    });
    headerRow.font = { ...baseFont, bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E79' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.eachCell(cell => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    currentRow++;

    // DATA (sort by date using string comparison)
    const sorted = [...this.previewData].sort((a, b) => {
      const d1 = a.dateRDV || '';
      const d2 = b.dateRDV || '';
      return d1.localeCompare(d2);
    });

    sorted.forEach(row => {
      // Build the formatted date string using UTC
      let formattedDate = '📅 Sans date';
      if (row.dateRDV) {
        const d = this.parseDateUTC(row.dateRDV);
        if (d) {
          formattedDate = `📅 ${this.formatDateForExcel(d)}`;
        }
      }

      const dataRow = sheet.getRow(currentRow++);
      // Values order must match the columns definition (12 columns now)
      dataRow.values = [
        row.label,
        row.zoneLabel,
        row.adresse,
        row.nomClient,
        row.snont,
        row.msisdn,
        row.equipe,
        formattedDate,
        row.etat,                // NEW
        row.chefEquipe,
        row.techniciens,
        row.snBox
      ];

      dataRow.font = baseFont;
      dataRow.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      dataRow.eachCell((cell, colNumber) => {
        // Style the Date RDV column (column 8) as before
        if (colNumber === 8) {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1F4E79' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F1FB' } };
        }
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // MERGE RDV CELLS (column H = column index 8)
    const dataStartRow = headerRowIndex + 1;
    const dataEndRow = currentRow - 1;
    let mergeStart = dataStartRow;
    let currentDateValue: string | null = null;
    for (let i = 0; i < sorted.length; i++) {
      const rowIndex = dataStartRow + i;
      const value = sorted[i].dateRDV || 'Sans date';
      if (value !== currentDateValue) {
        if (i > 0 && mergeStart < rowIndex - 1) {
          sheet.mergeCells(`H${mergeStart}:H${rowIndex - 1}`);
        }
        mergeStart = rowIndex;
        currentDateValue = value;
      }
    }
    if (mergeStart < dataEndRow) {
      sheet.mergeCells(`H${mergeStart}:H${dataEndRow}`);
    }

    sheet.getRow(1).values = [];

    // EXPORT
    try {
      this.isLoadingPreview = true;
      const buffer = await workbook.xlsx.writeBuffer();
      if (!buffer || buffer.byteLength === 0) {
        console.log('Excel buffer is empty');
      }
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const today = new Date();
      const dateToday = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

      const fileName = this.buildFileName(selectedProjet.nomProjet, dateToday);
      saveAs(blob, fileName);

      this.showPreviewModal = false;
    } catch (error) {
      console.error('Erreur export Excel : ', error);
      alert('Une erreur est survenue pendant la génération du fichier Excel.');
    } finally {
      this.isLoadingPreview = false;
    }
  }
}
