# AVA Bay — Suivi quotidien (démo)

Version d'essai de la **nouvelle checklist** et du **nouveau compte rendu de la journée**.
L'application publique de l'équipe (`checklist-ava-bay`, checklist.avabay-marrakech.com) n'est pas modifiée.

## Ce qui change

- **Journée** : une seule page, deux blocs à cocher.
  - *Présence du personnel* — Présent · Retard · Absent · Non prévu, heure d'arrivée et observation. Ajout de personnel depuis l'en-tête.
  - *Contrôle des espaces* — en deux sous-parties : *Propreté* (accueil, vestiaires, sanitaires, salle de prière, piscine, restauration, spa/hammam, AVA LAND, coworking) et *Mise en place* (télévisions, musique, tables, transats, serviettes, hammam).
  - Chaque point : **Prêt · À corriger · Non concerné**, avec « à régler », responsable et jusqu'à 4 photos quand il y a un souci.
  - Les deux blocs arrivent repliés : on ouvre ce qu'on veut contrôler.
  - *Bilan / priorités du lendemain* — un seul champ libre.
- **Compte rendu** : généré à partir de ces éléments — personnel, contrôle des espaces, parcours clientes, messages envoyés, bilan. Version écran + version texte à copier / partager. `server/rapport.php` produit le même compte rendu par e-mail (11h et 20h).

- **WhatsApp marketing** (nouvel onglet) :
  - *Campagnes* — offre, événement, nouveauté : modèle de message personnalisé (`{prenom}`, `{nom}`), choix des destinataires (toutes, VIP, influenceuses, venues ce mois, une seule visite, pas revenues, anniversaire ce mois), date et heure de programmation. L'envoi se fait cliente par cliente depuis le WhatsApp de la tablette (bouton « Envoyer » → message prêt), avec suivi envoyé / ignoré.
  - *Rappels automatiques* — anniversaire du jour, merci le lendemain d'une visite, relance des clientes pas revenues depuis N jours (réglable). Calculés depuis la base clientes.
  - *Notifications* — bandeau dans l'application et notification du navigateur (après autorisation) quand une campagne programmée arrive à échéance et, chaque jour à l'heure choisie, pour les rappels du jour. Pastille sur l'onglet tant qu'il reste des envois à faire.
  - Les clientes sans numéro ou cochées « Pas de WhatsApp marketing » dans la base ne sont jamais incluses.
  - Les messages envoyés apparaissent dans le compte rendu du jour (écran, texte, e-mail).

## Ce qui est conservé tel quel

- **Clientes du jour** : fiche en trois étapes (informations, envies, organisation), programme envoyé sur WhatsApp.
- **Base clientes** : coordonnées, réseaux, profil, historique des visites, retours.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | page de l'application |
| `style.css` | styles (identiques à l'application actuelle + compléments) |
| `data.js` | points de contrôle (`CHECKS`), équipe par défaut (`TEAM_DEFAULT`), modèles WhatsApp (`WA_TEMPLATES`) |
| `app.js` | application |
| `server/api.php` | enregistrement des données côté hébergement (dossier `ava_data_demo`, séparé de la production) |
| `server/rapport.php` | compte rendu e-mail de 11h et 20h |

## Données

- En démo (GitHub Pages), les saisies restent dans le navigateur, sous des clés `ava3-…` distinctes de l'application actuelle.
- À la première ouverture sur un appareil qui a déjà l'application actuelle, l'équipe et la base clientes sont reprises automatiquement.
- Les photos restent sur l'appareil qui les a prises (pas d'envoi serveur dans la démo) ; le compte rendu e-mail indique seulement leur nombre.
- Les documents serveur gardent la même forme : `jours/jour-<date>/parts/<staff|checks|client|bilan|resume>`, `equipe/liste`, `clients/liste`, et `marketing/campagnes` (campagnes, réglages des rappels, journal des envois).
