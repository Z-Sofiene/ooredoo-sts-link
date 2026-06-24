import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { GestionService } from '../../gestion.service';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
@Component({
  selector: 'app-dashboard-ooredoo',
  templateUrl: './dashboard-ooredoo.component.html',
  styleUrl: './dashboard-ooredoo.component.css'
})
export class DashboardOoredooComponent implements OnInit, AfterViewInit, OnDestroy {

  // ---------- Data ----------
  raccordements: any[] = [];
  totalRaccordements = 0;
  lastUpdated = new Date();
  isLoading = false;

  // Aggregates
  statusCounts: { [key: string]: number } = {};
  projets: string[] = [];
  zonesCount = 0;
  chefsEquipe: string[] = [];
  debits: string[] = [];

  // Chart instances
  private charts: Chart[] = [];
  private viewReady = false;

  // Canvas references
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('projectChart') projectChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('zoneChart') zoneChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chefChart') chefChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('debitChart') debitChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('rdvChart') rdvChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stackedChart') stackedChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChart') monthlyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('horizontalStatusChart') horizontalStatusChartRef!: ElementRef<HTMLCanvasElement>;

  constructor(private gest: GestionService) {}

  ngOnInit() {
    this.loadData();
  }

  ngAfterViewInit() {
    this.viewReady = true;
    if (this.totalRaccordements > 0) {
      this.renderCharts();
    }
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  // ---------- Load Data ----------
  loadData() {
    this.isLoading = true;
    this.gest.getAllRaccordementByResponsable().subscribe({
      next: (res: any[]) => {
        this.raccordements = res || [];
        this.totalRaccordements = this.raccordements.length;
        this.computeAggregates();
        this.lastUpdated = new Date();
        this.isLoading = false;
        if (this.viewReady) {
          this.renderCharts();
        }
      },
      error: err => {
        console.error('Failed to load raccordements for stats:', err);
        this.isLoading = false;
      }
    });
  }

  refreshData() {
    this.destroyCharts();
    this.loadData();
  }

  // ---------- Compute Aggregates ----------
  private computeAggregates() {
    this.statusCounts = {};
    this.raccordements.forEach(r => {
      const status = r.etatRaccordement || 'Non défini';
      this.statusCounts[status] = (this.statusCounts[status] || 0) + 1;
    });

    const projectSet = new Set<string>();
    this.raccordements.forEach(r => {
      if (r.projet) projectSet.add(r.projet);
    });
    this.projets = Array.from(projectSet);

    const zoneSet = new Set<string>();
    this.raccordements.forEach(r => {
      if (r.zone) zoneSet.add(r.zone);
    });
    this.zonesCount = zoneSet.size;

    const chefSet = new Set<string>();
    this.raccordements.forEach(r => {
      if (r.chef_equipe) chefSet.add(r.chef_equipe);
    });
    this.chefsEquipe = Array.from(chefSet);

    const debitSet = new Set<string>();
    this.raccordements.forEach(r => {
      if (r.debit) debitSet.add(r.debit);
    });
    this.debits = Array.from(debitSet);
  }

  // ---------- Chart Rendering ----------
  private renderCharts() {
    if (this.totalRaccordements === 0) return;
    this.destroyCharts();

    // 1. Status Donut
    this.charts.push(
      new Chart(this.statusChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: Object.keys(this.statusCounts),
          datasets: [{
            data: Object.values(this.statusCounts),
            backgroundColor: this.getStatusColors(Object.keys(this.statusCounts)),
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } }
          }
        }
      } as any) // cast to any to bypass type strictness
    );

    // 2. Projects Bar
    const projectCounts = this.projets.map(p => this.raccordements.filter(r => r.projet === p).length);
    this.charts.push(
      new Chart(this.projectChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: this.projets,
          datasets: [{
            label: 'Raccordements',
            data: projectCounts,
            backgroundColor: '#E30613',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } }
          }
        }
      } as any)
    );

    // 3. Zones Bar (top 10)
    const zoneMap = new Map<string, number>();
    this.raccordements.forEach(r => {
      if (r.zone) zoneMap.set(r.zone, (zoneMap.get(r.zone) || 0) + 1);
    });
    const sortedZones = Array.from(zoneMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const zoneLabels = sortedZones.map(([label]) => label);
    const zoneData = sortedZones.map(([, count]) => count);

    this.charts.push(
      new Chart(this.zoneChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: zoneLabels,
          datasets: [{
            label: 'Raccordements',
            data: zoneData,
            backgroundColor: '#1F4E79',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } }
          }
        }
      } as any)
    );

    // 4. Chef d'équipe workload
    const chefMap = new Map<string, number>();
    this.raccordements.forEach(r => {
      if (r.chef_equipe) chefMap.set(r.chef_equipe, (chefMap.get(r.chef_equipe) || 0) + 1);
    });
    const sortedChefs = Array.from(chefMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const chefLabels = sortedChefs.map(([label]) => label);
    const chefData = sortedChefs.map(([, count]) => count);

    this.charts.push(
      new Chart(this.chefChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: chefLabels,
          datasets: [{
            label: 'Raccordements',
            data: chefData,
            backgroundColor: '#2E7D32',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } }
          }
        }
      } as any)
    );

    // 5. Débit Pie
    const debitCounts: { [key: string]: number } = {};
    this.raccordements.forEach(r => {
      const d = r.debit || 'Non défini';
      debitCounts[d] = (debitCounts[d] || 0) + 1;
    });
    this.charts.push(
      new Chart(this.debitChartRef.nativeElement, {
        type: 'pie',
        data: {
          labels: Object.keys(debitCounts),
          datasets: [{
            data: Object.values(debitCounts),
            backgroundColor: ['#E30613', '#1F4E79', '#2E7D32', '#F57C00', '#6A1B9A']
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'right', labels: { boxWidth: 12 } } }
        }
      } as any)
    );

    // 6. RDV Trend (line)
    const rdvMap = new Map<string, number>();
    this.raccordements.forEach(r => {
      if (r.dateRDV) {
        const dateKey = r.dateRDV;
        rdvMap.set(dateKey, (rdvMap.get(dateKey) || 0) + 1);
      }
    });
    const sortedDates = Array.from(rdvMap.keys()).sort();
    const rdvCounts = sortedDates.map(d => rdvMap.get(d) || 0);
    this.charts.push(
      new Chart(this.rdvChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: sortedDates,
          datasets: [{
            label: 'RDV',
            data: rdvCounts,
            borderColor: '#E30613',
            backgroundColor: 'rgba(227,6,19,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 3
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false }, ticks: { maxTicksLimit: 15 } }
          }
        }
      } as any)
    );

    // 7. Stacked Bar – Status per Project (top 5)
    const topProjects = this.projets.slice(0, 5);
    const statuses = Object.keys(this.statusCounts);
    const stackedData = topProjects.map(proj => {
      const counts: { [key: string]: number } = {};
      statuses.forEach(s => counts[s] = 0);
      this.raccordements.forEach(r => {
        if (r.projet === proj && r.etatRaccordement) {
          counts[r.etatRaccordement] = (counts[r.etatRaccordement] || 0) + 1;
        }
      });
      return counts;
    });

    const datasets = statuses.map((status, idx) => ({
      label: status,
      data: topProjects.map((_, i) => stackedData[i][status] || 0),
      backgroundColor: this.getStatusColors([status])[0],
      borderColor: '#fff',
      borderWidth: 1
    }));

    this.charts.push(
      new Chart(this.stackedChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: topProjects,
          datasets: datasets
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'top' } },
          scales: {
            x: { stacked: true, grid: { display: false } },
            y: { stacked: true, beginAtZero: true, grid: { color: '#f0f0f0' } }
          }
        }
      } as any)
    );

    // 8. Monthly Trend
    const monthMap = new Map<string, number>();
    this.raccordements.forEach(r => {
      if (r.dateRDV) {
        const month = r.dateRDV.substring(0, 7);
        monthMap.set(month, (monthMap.get(month) || 0) + 1);
      }
    });
    const sortedMonths = Array.from(monthMap.keys()).sort();
    const monthData = sortedMonths.map(m => monthMap.get(m) || 0);
    this.charts.push(
      new Chart(this.monthlyChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: sortedMonths,
          datasets: [{
            label: 'Raccordements',
            data: monthData,
            borderColor: '#1F4E79',
            backgroundColor: 'rgba(31,78,121,0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            x: { grid: { display: false } }
          }
        }
      } as any)
    );

    // 9. Horizontal Bar for Status detail
    const statusLabels = Object.keys(this.statusCounts);
    const statusValues = Object.values(this.statusCounts);
    this.charts.push(
      new Chart(this.horizontalStatusChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: statusLabels,
          datasets: [{
            label: 'Nombre',
            data: statusValues,
            backgroundColor: this.getStatusColors(statusLabels),
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: '#f0f0f0' } },
            y: { grid: { display: false } }
          }
        }
      } as any)
    );
  }

  // ---------- Helper: Status Colors ----------
  // Get sorted status keys (optional: sort by count descending)
  get statusKeys(): string[] {
    return Object.keys(this.statusCounts).sort((a, b) => this.statusCounts[b] - this.statusCounts[a]);
  }

// Map status to gradient background
  getStatusGradient(status: string): string {
    const gradients: { [key: string]: string } = {
      'En attente': 'linear-gradient(135deg,#f59e0b,#d97706)',
      'En cours': 'linear-gradient(135deg,#3b82f6,#2563eb)',
      'Terminé': 'linear-gradient(135deg,#10b981,#059669)',
      'Annulé': 'linear-gradient(135deg,#ef4444,#dc2626)',
      'Non affecté': 'linear-gradient(135deg,#6b7280,#4b5563)',
      'Non fibré': 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
      'Non disponible': 'linear-gradient(135deg,#ec4899,#db2777)',
      'RDV raté': 'linear-gradient(135deg,#f97316,#ea580c)',
      'Hors zone': 'linear-gradient(135deg,#14b8a6,#0d9488)'
    };
    return gradients[status] || 'linear-gradient(135deg,#6c757d,#495057)';
  }

// Map status to icon class
  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'En attente': 'fas fa-clock',
      'En cours': 'fas fa-spinner fa-pulse',
      'Terminé': 'fas fa-check-circle',
      'Annulé': 'fas fa-ban',
      'Non affecté': 'fas fa-user-slash',
      'Non fibré': 'fas fa-wifi-slash',
      'Non disponible': 'fas fa-exclamation-circle',
      'RDV raté': 'fas fa-calendar-times',
      'Hors zone': 'fas fa-map-marker-alt'
    };
    return icons[status] || 'fas fa-circle';
  }

// Map status to icon color
  getStatusIconColor(status: string): string {
    const colors: { [key: string]: string } = {
      'En attente': '#fcd34d',
      'En cours': '#60a5fa',
      'Terminé': '#34d399',
      'Annulé': '#f87171',
      'Non affecté': '#9ca3af',
      'Non fibré': '#a78bfa',
      'Non disponible': '#f472b6',
      'RDV raté': '#fb923c',
      'Hors zone': '#2dd4bf'
    };
    return colors[status] || '#ffffff';
  }
  private getStatusColors(statuses: string[]): string[] {
    const colorMap: { [key: string]: string } = {
      'En attente': '#F59E0B',
      'En cours': '#3B82F6',
      'Terminé': '#10B981',
      'Annulé': '#EF4444',
      'Non affecté': '#6B7280',
      'Non fibré': '#8B5CF6',
      'Non disponible': '#EC4899',
      'RDV raté': '#F97316',
      'Hors zone': '#14B8A6'
    };
    return statuses.map(s => colorMap[s] || '#94A3B8');
  }

  // ---------- Cleanup ----------
  private destroyCharts() {
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];
  }
}
