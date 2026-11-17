// Contenu de l'avant-propos (remerciements, introduction, mission).
// Modifier ici le texte : il est repris à l'identique sur le site et dans le PDF.

export const REMERCIEMENTS = [
  "Je tiens tout d'abord à remercier M. Benoît HERTZOG, chef de secteur et mon maître d'apprentissage, pour la confiance qu'il m'accorde et le temps qu'il consacre à ma formation.",
  "Je remercie tout particulièrement Mme Mathilde MOUILLARD, conductrice de travaux, qui m'a associée à ses chantiers et a toujours pris le temps de m'expliquer son métier, ainsi que Mme Ines SCHALCK, conductrice de travaux, pour son accompagnement. Merci également à M. Nuno DA SILVA, chef de chantier, et à M. José VALENTE FERREIRA, chef d'équipe, pour leurs explications sur le terrain.",
  "Je remercie M. Philippe LAMBERT, directeur d'activité, ainsi que l'ensemble de l'agence de Krautergersheim pour leur accueil.",
  "Enfin, je remercie M. Frédéric ROUSSEY et l'équipe pédagogique de l'UFA Le Corbusier pour leur accompagnement tout au long de ma formation.",
];

export const INTRODUCTION = [
  "Titulaire d'un baccalauréat général obtenu en 2023 avec la mention Très Bien (spécialités mathématiques et SVT), je me suis d'abord orientée vers des études de médecine à l'Universität des Saarlandes, en Allemagne, que j'ai suivies pendant deux ans. Cette expérience m'a appris la rigueur, l'organisation face à une forte charge de travail et le travail en équipe, mais elle m'a aussi fait comprendre que ma motivation profonde se trouvait ailleurs : dans la construction et la conception des bâtiments.",
  "J'ai donc choisi de me réorienter vers le BTS Bâtiment en alternance à l'UFA Le Corbusier d'Illkirch-Graffenstaden, afin d'apprendre le métier au contact du terrain, au rythme de deux semaines en entreprise et deux semaines en formation.",
  "C'est l'UFA qui m'a mise en relation avec Sogea Est BTP, entité de Sogea Environnement au sein du groupe VINCI Construction, où j'effectue mon apprentissage à l'agence de Krautergersheim. Ce cadre m'apporte un double avantage : appartenir à un grand groupe, avec ses méthodes et ses outils, et découvrir le génie civil (ouvrages de l'eau, stations d'épuration, ouvrages d'art) en plus du bâtiment. Rattachée à M. Benoît HERTZOG, chef de secteur, je participe depuis le bureau à la préparation et au suivi des chantiers aux côtés des conducteurs de travaux.",
  "À l'issue du BTS, je souhaite poursuivre en école d'ingénieurs en génie civil par la voie de l'alternance, idéalement chez ADIM, la filiale de développement immobilier de VINCI Construction. Mon objectif à terme est d'occuper un poste en développement immobilier, où la connaissance technique des chantiers est un véritable atout.",
  "Ce rapport présente d'abord mon parcours, ma formation et l'entreprise qui m'accueille. Il détaille ensuite les chantiers sur lesquels je suis intervenue et les compétences de l'épreuve U61 que j'y ai mobilisées, puis approfondit plusieurs thèmes d'étude. Il se termine par un bilan de cette expérience et de mon projet professionnel.",
];

export const MISSION = {
  poste: "Alternante assistante chef de chantier",
  posteReel: "Missions exercées : assistante conductrice de travaux",
  infos: [
    { label: 'Entreprise', value: 'Sogea Est BTP — Agence de Krautergersheim' },
    { label: "Maître d'apprentissage", value: 'Benoît HERTZOG, chef de secteur' },
    { label: 'Lieu de travail', value: "Bureau de l'agence, en appui des conducteurs de travaux" },
    { label: 'Rythme', value: '2 semaines en entreprise / 2 semaines au CFA' },
  ],
  groupes: [
    {
      titre: 'Préparation de chantier et sécurité',
      items: [
        'Rédaction des PPSPS (fiche FAT, informations chantier, SAFE) et de leurs annexes',
        'Analyses de risques particulières au chantier',
        'Fiches « conduite à tenir en cas d\'accident »',
        'Protocoles de sécurité pour les livraisons',
      ],
      competences: ['C16.7', 'C16.9'],
    },
    {
      titre: 'Achats et suivi des dépenses',
      items: [
        'Demandes de devis et comparaison des offres',
        'Création des commandes dans SAP (Connect) et envoi aux fournisseurs',
        'Avenants aux contrats de sous-traitance',
      ],
      competences: ['C15.4', 'C16.4'],
    },
    {
      titre: "Réponses aux appels d'offres",
      items: [
        'Rédaction de mémoires techniques',
        'Plans de phasage des travaux',
        'Consultation des fournisseurs et sous-traitants, y compris en Allemagne',
      ],
      competences: ['C2.1', 'C2.2', 'C2.3'],
    },
    {
      titre: 'Études',
      items: ["Réalisation de plans d'exécution"],
      competences: ['C2.2'],
    },
  ],
};

export const NOTE_EXAMENS = "Examens 2027 (sous réserve) : épreuves écrites mi-mai, épreuves de projet de mi-mai à mi-juin.";
