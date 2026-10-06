/* AVA Bay — Suivi quotidien (démo) : données de référence */

/* Points à vérifier chaque jour, en deux groupes : propreté des espaces et mise en place. */
const CHECKS=[
  {id:'clean',title:'Propreté des espaces',tag:'Propreté',items:[
    ['clean-reception','Accueil / réception'],
    ['clean-changing','Vestiaires'],
    ['clean-toilets','Sanitaires'],
    ['clean-prayer','Salle de prière'],
    ['clean-pool','Piscine et espaces extérieurs'],
    ['clean-dining','Salle de restauration'],
    ['clean-spa','Spa, hammam et beauté'],
    ['clean-kids','AVA LAND'],
    ['clean-coworking','Coworking / espaces communs'],
  ]},
  {id:'setup',title:'Mise en place',tag:'Mise en place',items:[
    ['tv','Télévisions allumées'],
    ['music','Musique allumée'],
    ['tables','Tables dressées'],
    ['loungers','Transats installés'],
    ['towels','Serviettes disponibles'],
    ['hammam','Hammam allumé'],
  ]},
];

/* Équipe par défaut : [secteur, prénom, nom, fonction]. Modifiable dans l'application. */
const TEAM_DEFAULT=[["Direction générale","Inès","","Fondatrice"],["Direction générale","Rod","","Cofondateur"],["Direction","Assia","","Direction"],["Réception et relation client","Fatima Zara","","Réception et relation client"],["Beauté","Sokaina","","Responsable du pôle beauté – coiffure, manucure et pédicure"],["Beauté","Ahlem 1","","Gommeuse – massage"],["Beauté","Fatima Zahra","","Coiffure, manucure et pédicure"],["Beauté","Ahlem 2","","Gommeuse n° 2 – massage"],["Animation","Charlène","","Directrice du pôle animation"],["Animation","Hajar","","Animatrice référente"],["Animation","Assia","","Animatrice"],["Cuisine et pâtisserie","","","Chef de cuisine"],["Cuisine et pâtisserie","Farid","","Chef pâtissier"],["Cuisine et pâtisserie","Latifa","","Commis de cuisine salée"],["Cuisine et pâtisserie","Fayssal","",""],["Cuisine et pâtisserie","Mimi","","Plongeuse"],["Hygiène et entretien","Khadija","","Ménage"],["Hygiène et entretien","Fadoua","","Ménage"],["Hygiène et entretien","Aisha","","Laverie – serviettes"],["Hygiène et entretien","Awa","","Ménage"],["Hygiène et entretien","Hassese","",""]];
