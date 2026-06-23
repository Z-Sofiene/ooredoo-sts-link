import { Component, OnInit } from '@angular/core';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import { GestionService } from '../../gestion.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // ========================
  // Data source
  // ========================
  raccordements: any[] = [];

  // ========================
  // Charts data
  // ========================
  etatData: ChartData<'pie'> = { labels: [], datasets: [] };
  typeData: ChartData<'pie'> = { labels: [], datasets: [] };
  projetsByResponsableData: ChartData<'bar'> = { labels: [], datasets: [] };
  projetsByChefEquipeData: ChartData<'bar'> = { labels: [], datasets: [] };
  projetsByOperateurData: ChartData<'bar'> = { labels: [], datasets: [] };

  // ========================
  // Chart options
  // ========================
  barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  horizontalBarOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } }
  };

  constructor(private gest: GestionService) {}

  // ========================
  // Lifecycle
  // ========================
  ngOnInit(): void {
    this.loadRaccordements();
  }

  // ========================
  // Data loading
  // ========================
  private loadRaccordements(): void {
    this.gest.getAllRaccordement().subscribe({
      next: (data) => {
        this.raccordements = data ?? [];
        this.prepareCharts();
      },
      error: (err) => {
        console.error('Error loading raccordements', err);
        this.raccordements = [];
      }
    });
  }

  getUniqueProjets(): string[] {
    return [
      ...new Set(
        this.raccordements
          .filter(r => r?.projet?.nomProjet)
          .map(r => r.projet.nomProjet)
      )
    ];
  }


  // ========================
  // Charts preparation
  // ========================
  private prepareCharts(): void {

    const etatCount: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    const projetsByResponsable: Record<string, number> = {};
    const projetsByChefEquipe: Record<string, number> = {};
    const projetsByOperateur: Record<string, number> = {};

    this.raccordements.forEach(r => {

      // Etat raccordement
      if (r?.etatRaccordement) {
        etatCount[r.etatRaccordement] =
          (etatCount[r.etatRaccordement] || 0) + 1;
      }

      // Type raccordement
      if (r?.typeRaccordement) {
        typeCount[r.typeRaccordement] =
          (typeCount[r.typeRaccordement] || 0) + 1;
      }

      // Projets by responsable
      if (r?.responsable) {
        const name = `${r.responsable.nom} ${r.responsable.prenom}`;
        projetsByResponsable[name] =
          (projetsByResponsable[name] || 0) + 1;
      }

      // Projets by chef d'équipe (NEW)
      if (r?.chef_equipe) {
        const name = `${r.chef_equipe.nom} ${r.chef_equipe.prenom}`;
        projetsByChefEquipe[name] =
          (projetsByChefEquipe[name] || 0) + 1;
      }

      // Projets by opérateur
      if (r?.projet?.operateur) {
        projetsByOperateur[r.projet.operateur] =
          (projetsByOperateur[r.projet.operateur] || 0) + 1;
      }
    });

    // ========================
    // Assign chart data
    // ========================
    this.etatData = {
      labels: Object.keys(etatCount),
      datasets: [{
        data: Object.values(etatCount),
        backgroundColor: ['#f39c12', '#27ae60', '#2980b9', '#c0392b']
      }]
    };


    this.typeData = {
      labels: Object.keys(typeCount),
      datasets: [{
        data: Object.values(typeCount),
        backgroundColor: ['#8e44ad', '#16a085', '#d35400']
      }]
    };

    this.projetsByResponsableData = {
      labels: Object.keys(projetsByResponsable),
      datasets: [{
        label: 'Projets',
        data: Object.values(projetsByResponsable),
        backgroundColor: '#3498db'
      }]
    };

    this.projetsByChefEquipeData = {
      labels: Object.keys(projetsByChefEquipe),
      datasets: [{
        label: 'Projets',
        data: Object.values(projetsByChefEquipe),
        backgroundColor: '#e67e22'
      }]
    };

    this.projetsByOperateurData = {
      labels: Object.keys(projetsByOperateur),
      datasets: [{
        label: 'Projets',
        data: Object.values(projetsByOperateur),
        backgroundColor: '#2ecc71'
      }]
    };
  }
}
