/* AVA Bay — Suivi quotidien (démo) : données de référence */

/* Contrôle des espaces : un seul bloc à l'écran, en deux sous-parties (propreté, mise en place). */
const CHECKS=[
  {id:'clean',title:'Propreté',tag:'Propreté',items:[
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

/* WhatsApp marketing : modèles de messages. {prenom} est remplacé par le prénom de la cliente, {nom} par son nom complet.
   Les modèles marqués auto servent aux rappels automatiques (anniversaire, merci après la visite, relance). */
const WA_TEMPLATES=[
  {id:'promo',name:'Offre / promotion',msg:"Bonjour {prenom} ✨\n\nCette semaine chez AVA BAY : [votre offre].\n\nRéservez votre moment en répondant simplement à ce message.\n\nÀ très vite 🌸"},
  {id:'event',name:'Événement',msg:"Bonjour {prenom} ✨\n\nAVA BAY vous invite à [événement] le [date] à [heure].\n\nLes places sont limitées : répondez à ce message pour réserver la vôtre.\n\nÀ bientôt 🌸"},
  {id:'new',name:'Nouveauté',msg:"Bonjour {prenom} ✨\n\nDu nouveau chez AVA BAY : [nouveauté].\n\nNous serions ravies de vous le faire découvrir lors de votre prochaine visite.\n\nBelle journée 🌸"},
  {id:'bday',name:'Anniversaire',auto:true,msg:"Joyeux anniversaire {prenom} 🎂✨\n\nToute l'équipe AVA BAY vous souhaite une merveilleuse journée.\n\nPour la fêter, un [cadeau / soin offert] vous attend lors de votre prochaine visite.\n\nÀ très vite 🌸"},
  {id:'thanks',name:'Merci pour votre visite',auto:true,msg:"Bonjour {prenom} ✨\n\nMerci pour votre visite chez AVA BAY hier. Nous espérons que vous avez passé un moment agréable.\n\nUn petit retour nous ferait très plaisir : répondez simplement à ce message.\n\nÀ bientôt 🌸"},
  {id:'back',name:'Relance',auto:true,msg:"Bonjour {prenom} ✨\n\nCela fait un moment que nous n'avons pas eu le plaisir de vous accueillir chez AVA BAY.\n\nVotre espace de détente vous attend : hammam, piscine, soins, restauration…\n\nQuand revenez-vous nous voir ? 🌸"},
];
