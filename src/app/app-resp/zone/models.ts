export interface Cite {
  id: string;
  nomCite: string;
  clientsCount?: number;
}

export interface SousZone {
  id: string;
  label: string;
  cites: Cite[];
  clientsCount?: number;
}

export interface Zone {
  id: string;
  label: string;
  description?: string;
  sousZones: SousZone[];
  clientsCount?: number;
}

export interface Projet {
  id: string;
  nomProjet: string;
  operateur: Operateur;
  zones: Zone[];
}

export interface Operateur {
  id: number;
  nomOperateur: string;
}

export interface ThemeMap {
  [key: string]: string;
}

export interface OperatorMap {
  [key: string]: string;
}

export enum ViewMode {
  ZONE = 'zone',
  SOUSZONE = 'souszone',
  CITE = 'cite'
}
