export interface ClientDTO {
  label?: string | null;
  numVoip?: string | null;
  nom?: string | null;
  numTelephone?: string | null;
  numTelephone2?: string | null;
  sla?: string | null;
  debit?: string | null;
  bridge?: boolean;
  msisdn?: string | null;
  email?: string | null;
  adresse?: string | null;
  etat?: EtatOT | null;
  dateRDV?: string | null;
  heureRDV?: string | null;
  zoneId?: string | null;
  zoneName?: string | null;
  sousZoneId?: string | null;
  sousZoneName?: string | null;
  citeId?: string | null;
  citeName?: string | null;
  latitude?: number | 0.0;
  longitude?: number | 0.0;
}

export interface EtatOT {
  id?: number;
  etatOT: string;
  dateOT?: string;
}

export interface Cite {
  id: string;
  nomCite: string;
}

export interface SousZone {
  id: string;
  label: string;
}

export interface Zone {
  id: string;
  label: string;
}

export interface Projet {
  id: string;
  nomProjet: string;
}

export interface Operateur {
  id: number;
  nomOperateur: string;
}
