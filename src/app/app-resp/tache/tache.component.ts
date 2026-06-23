import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { GestionService } from '../../gestion.service';


interface ProduitDTO {
  id: number;
  nomArticle: string;
  unite: string;
  titre: string;
  operateur: Operateur;
  quantite: number;
}

interface ProduitRaccordementDTO {
  id: string;
  quantite: number;
  produit: ProduitDTO;
}

interface ImageDTO {
  id: string;
  image: string; // Raw base64 string without prefix
}

interface TacheDTO {
  id: string;
  titre: string;
  images: ImageDTO[];
  etat: string;
  createAt: string;
  updatedAt: string;
  description: string;
  nom_technicien: string | null;
  produits: ProduitRaccordementDTO[];
}

interface ClientRaccordementDTO {
  id: string;
  titre: string;
  description: string;
  dateRDV: string;
  heureRDV: string;
  numFixe: string;
  debit: string;
  testDebit: string;
  puissance: string;
  snont: string;
  attenuation: number;
  distance_travaux: number
  distance_total: number;
  brinBranchement: string;
  hasBridge: boolean;
  responsable: string;
  chef_equipe: string;
  etatRaccordement: string;
  typeRaccordement: string;
  nomClient: string;
  adresseClient: string;
  numTelephone: string;
  longitudeClient: number;
  latitudeClient: number;
  longitude: number;
  latitude: number;
  taches: TacheDTO[];
}
interface Cite { id: string; nomCite: string; clientsCount: number; }
interface SousZone { id: string; label: string; clientsCount: number; cites: Cite[]; }
interface Zone { id: string; label: string; clientsCount: number; sousZones?: SousZone[]; }
interface Projet { id: string; nomProjet: string; }
interface Operateur { id: number; nomOperateur: string; }
@Component({
  selector: 'app-tache',
  templateUrl: './tache.component.html',
  styleUrls: ['./tache.component.css']
})
export class TacheComponent implements OnInit, OnDestroy {
  @Input() zone: Zone | null = null;
  @Input() sousZone: SousZone | null = null;
  @Input() cite: Cite | null = null;
  @Input() projet: Projet | null = null;
  @Input() operateur: Operateur | null = null;
  @Input() clientId: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  // Data properties
  clientRaccordement: ClientRaccordementDTO | null = null;
  taches: TacheDTO[] = [];
  loading: boolean = false;
  error: string | null = null;


  // Image viewer properties
  showImageViewer: boolean = false;
  currentImages: ImageDTO[] = [];
  currentImageIndex: number = 0;

  // Task type ordering
  taskTypeOrder: { [key: string]: number } = {
    'gcv': 1,
    'tirage': 2,
    'raccordement': 3
  };

  constructor(private gest: GestionService) {}

  ngOnInit() {
    if (this.clientId) {
      this.loadClientTasks(this.clientId);
    }
  }

  loadClientTasks(clientId: string) {
    this.loading = true;
    this.error = null;

    this.gest.getTachesRaccordementByClient(clientId).subscribe({
      next: (data: ClientRaccordementDTO) => {
        this.clientRaccordement = data;
        this.taches = this.sortTaches(data.taches || []);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.error = 'Erreur lors du chargement des tâches';
        this.loading = false;
      }
    });
  }

  // Sort tasks by type: GCV -> Tirage -> Raccordement
  sortTaches(taches: TacheDTO[]): TacheDTO[] {
    return taches.sort((a, b) => {
      const typeA = this.getTaskType(a.titre);
      const typeB = this.getTaskType(b.titre);
      const orderA = this.taskTypeOrder[typeA] || 999;
      const orderB = this.taskTypeOrder[typeB] || 999;
      return orderA - orderB;
    });
  }

  // Get task type from title
  getTaskType(titre: string): string {
    const lower = titre.toLowerCase();
    if (lower.includes('gcv')) return 'gcv';
    if (lower.includes('tirage')) return 'tirage';
    if (lower.includes('raccordement')) return 'raccordement';
    return 'other';
  }

  // Convert raw base64 to proper image URL
  getImageUrl(base64Data: string): string {
    if (!base64Data) return '';

    // If already has data URL prefix, return as is
    if (base64Data.startsWith('data:image')) {
      return base64Data;
    }

    // Detect image type from base64 string
    let mimeType = 'image/jpeg'; // default
    if (base64Data.startsWith('/9j/')) {
      mimeType = 'image/jpeg';
    } else if (base64Data.startsWith('iVBORw0KGgo')) {
      mimeType = 'image/png';
    } else if (base64Data.startsWith('R0lGODlh')) {
      mimeType = 'image/gif';
    } else if (base64Data.startsWith('PHN2Zy')) {
      mimeType = 'image/svg+xml';
    }

    return `data:${mimeType};base64,${base64Data}`;
  }

  // Handle image loading errors
  handleImageError(event: any, image: ImageDTO) {
    console.error('Failed to load image:', image.id);
    event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3Cpath d="M8 2v20M16 2v20M2 8h20M2 16h20"%3E%3C/path%3E%3C/svg%3E';
    event.target.style.objectFit = 'contain';
    event.target.style.opacity = '0.5';
  }



  // Open image viewer
  openImageViewer(images: ImageDTO[], event?: Event, startIndex: number = 0) {
    if (event) {
      event.stopPropagation();
    }
    if (images && images.length > 0) {
      this.currentImages = images;
      this.currentImageIndex = startIndex;
      this.showImageViewer = true;
      document.body.style.overflow = 'hidden';
      document.body.classList.add('image-viewer-open');
    }
  }

  // Close image viewer


  ngOnDestroy() {
    document.body.style.overflow = '';
    document.body.classList.remove('image-viewer-open');
  }
  closeImageViewer() {
    this.showImageViewer = false;
    this.currentImages = [];
    this.currentImageIndex = 0;
    document.body.style.overflow = '';
    document.body.classList.remove('image-viewer-open');
  }
  // Handle image viewer errors
  handleImageViewerError(event: any) {
    console.error('Failed to load image in viewer');
    event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="2" y="2" width="20" height="20" rx="2.18"%3E%3C/rect%3E%3Cpath d="M8 2v20M16 2v20M2 8h20M2 16h20"%3E%3C/path%3E%3C/svg%3E';
  }

  // Next image
  nextImage() {
    if (this.currentImageIndex < this.currentImages.length - 1) {
      this.currentImageIndex++;
    }
  }

  // Previous image
  prevImage() {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  // Get current image
  get currentImage(): ImageDTO | null {
    return this.currentImages[this.currentImageIndex] || null;
  }

  // Get status badge class
  getStatusClass(etat: string): string {
    switch(etat?.toLowerCase()) {
      case 'terminé':
      case 'termine':
        return 'status-success';
      case 'en attente':
      case 'enattente':
        return 'status-warning';
      case 'en cours':
      case 'encours':
        return 'status-info';
      default:
        return 'status-default';
    }
  }

  // Format date
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format date only
  formatDateOnly(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  // Get total products count
  getTotalProducts(tache: TacheDTO): number {
    if (!tache.produits || tache.produits.length === 0) return 0;
    return tache.produits.reduce((total, p) => total + p.quantite, 0);
  }

  // Export to PDF with proper styling
  async exportToPDF() {
    const element = document.getElementById('pdf-content');
    if (!element) return;

    this.loading = true;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/png');

      const pdfWidth = 210;
      const pdfHeight = 297;

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(
        `raccordement_${this.clientRaccordement?.nomClient || 'client'}.pdf`
      );

    } catch (e) {
      console.error(e);
      this.error = 'Erreur génération PDF';
    } finally {
      this.loading = false;
    }
  }
  getThemeClass(): string {
    if (!this.operateur?.nomOperateur) return 'theme-divers';
    const op = this.operateur.nomOperateur.toLowerCase().trim();
    if (op.includes('ooredoo')) return 'theme-ooredoo';
    if (op.includes('orange')) return 'theme-orange';
    if (op.includes('tunisie telecom') || op.includes('tunisietelecom')) return 'theme-tunisietelecom';

    return 'theme-divers';
  }
}
