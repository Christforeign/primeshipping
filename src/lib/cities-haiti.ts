export interface HaitiCity {
  name: string;
  department: string;
  isMajor?: boolean;
}

export const HAITI_DEPARTMENTS = [
  "Ouest",
  "Nord",
  "Artibonite",
  "Sud",
  "Sud-Est",
  "Centre",
  "Nord-Est",
  "Nord-Ouest",
  "Grand'Anse",
  "Nippes",
];

export const HAITI_CITIES: HaitiCity[] = [
  // Ouest
  { name: "Port-au-Prince", department: "Ouest", isMajor: true },
  { name: "Delmas", department: "Ouest", isMajor: true },
  { name: "Pétion-Ville", department: "Ouest", isMajor: true },
  { name: "Carrefour", department: "Ouest", isMajor: true },
  { name: "Tabarre", department: "Ouest", isMajor: true },
  { name: "Croix-des-Bouquets", department: "Ouest", isMajor: true },
  { name: "Cité Soleil", department: "Ouest" },
  { name: "Léogâne", department: "Ouest" },
  { name: "Petit-Goâve", department: "Ouest" },
  { name: "Grand-Goâve", department: "Ouest" },
  { name: "Gressier", department: "Ouest" },
  { name: "Kenscoff", department: "Ouest" },
  { name: "Arcahaie", department: "Ouest" },
  { name: "Cabaret", department: "Ouest" },

  // Nord
  { name: "Cap-Haïtien", department: "Nord", isMajor: true },
  { name: "Limonade", department: "Nord" },
  { name: "Plaine-du-Nord", department: "Nord" },
  { name: "Quartier-Morin", department: "Nord" },
  { name: "Milot", department: "Nord" },
  { name: "Acul-du-Nord", department: "Nord" },

  // Artibonite
  { name: "Gonaïves", department: "Artibonite", isMajor: true },
  { name: "Saint-Marc", department: "Artibonite", isMajor: true },
  { name: "Verrettes", department: "Artibonite" },
  { name: "Petite-Rivière-de-l'Artibonite", department: "Artibonite" },
  { name: "Marchand-Dessalines", department: "Artibonite" },
  { name: "Gros-Morne", department: "Artibonite" },

  // Sud
  { name: "Les Cayes", department: "Sud", isMajor: true },
  { name: "Aquin", department: "Sud" },
  { name: "Camp-Perrin", department: "Sud" },
  { name: "Torbeck", department: "Sud" },
  { name: "Port-Salut", department: "Sud" },

  // Sud-Est
  { name: "Jacmel", department: "Sud-Est", isMajor: true },
  { name: "Cayes-Jacmel", department: "Sud-Est" },
  { name: "Marigot", department: "Sud-Est" },
  { name: "Belle-Anse", department: "Sud-Est" },

  // Centre
  { name: "Hinche", department: "Centre", isMajor: true },
  { name: "Mirebalais", department: "Centre", isMajor: true },
  { name: "Lascahobas", department: "Centre" },
  { name: "Belladère", department: "Centre" },

  // Nord-Est
  { name: "Ouanaminthe", department: "Nord-Est", isMajor: true },
  { name: "Fort-Liberté", department: "Nord-Est", isMajor: true },
  { name: "Trou-du-Nord", department: "Nord-Est" },

  // Nord-Ouest
  { name: "Port-de-Paix", department: "Nord-Ouest", isMajor: true },
  { name: "Saint-Louis-du-Nord", department: "Nord-Ouest" },

  // Grand'Anse
  { name: "Jérémie", department: "Grand'Anse", isMajor: true },
  { name: "Anse-d'Hainault", department: "Grand'Anse" },

  // Nippes
  { name: "Miragoâne", department: "Nippes", isMajor: true },
  { name: "Anse-à-Veau", department: "Nippes" },
];

export const JUL_PICKUP_AGENCIES = [
  {
    id: "agence-pap",
    name: "Succursale Principale Delmas 33",
    address: "Boulevard Toussaint Louverture, Delmas 33, Haïti",
    phone: "+509 3700-0000",
  },
  {
    id: "agence-petionville",
    name: "Agence Pétion-Ville Centre",
    address: "Rue Panaméricaine, En face Place Saint-Pierre, Pétion-Ville",
    phone: "+509 3700-0001",
  },
  {
    id: "agence-cap",
    name: "Succursale Cap-Haïtien",
    address: "Rue 18 Boulevard du Cap, Cap-Haïtien",
    phone: "+509 3700-0002",
  },
  {
    id: "agence-cayes",
    name: "Point Relais Les Cayes",
    address: "Avenue des Quatre Chemins, Les Cayes",
    phone: "+509 3700-0003",
  },
  {
    id: "agence-st-marc",
    name: "Point Relais Saint-Marc",
    address: "Route Nationale 1, Carrefour Portail, Saint-Marc",
    phone: "+509 3700-0004",
  },
];

export const PRIME_PICKUP_AGENCIES = JUL_PICKUP_AGENCIES;
