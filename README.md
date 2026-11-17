# aDaube Acrobait

Éditeur de PDF gratuit, sans compte ni serveur de traitement de documents, avec une interface de logiciel bureautique. **100 % JavaScript vanilla** pour le code applicatif et déploiement statique sur GitHub Pages.

## Fonctionnalités — bêta

- Ouverture, aperçu, zoom et navigation dans des PDF grâce à PDF.js.
- Clic sur un texte existant pour créer une **correction visuelle** : recouvrement blanc et insertion d'un texte modifiable.
- Insertion de zones de texte, rectangles et surlignages ; déplacement des éléments.
- Mise en forme : polices, tailles, couleurs, gras, italique, souligné, alignement.
- Ajout et suppression de pages, duplication et suppression de blocs, annulation et rétablissement.
- Export PDF via pdf-lib et intégration des polices TTF/OTF importées.
- Catalogue de nombreuses familles Windows, macOS et Linux (nom de police uniquement).
- Ouverture par glisser-déposer, raccourcis clavier et interface responsive.

## Langues

L’interface est disponible en **français**, **anglais** et **vietnamien (Tiếng Việt)**.

- Sélecteur de langue dans la barre supérieure ; changement immédiat sans recharger la page.
- Détection de la langue préférée du navigateur (fr/en/vi, anglais par défaut pour les autres langues).
- Choix mémorisé localement dans le navigateur, sans synchronisation distante.
- Traductions des menus, infobulles, noms des outils, messages d’erreur, avertissements et panneaux d’aide.
- Seule **l’interface** est traduite : le contenu de vos PDF et les textes saisis ne sont jamais traduits automatiquement.

La cohérence des traductions et leurs paramètres dynamiques est vérifiée par `node tests/check-i18n.mjs` dans le workflow GitHub Actions.

## Affichage, zoom et performances

- **Zoom** de 30 % à 400 %, avec les modes **ajuster à la largeur** et **page entière**.
- Sur mobile : barre de zoom accessible en bas de l’écran, accès aux miniatures et aux propriétés ; pincement à deux doigts et double appui pour agrandir.
- Sur ordinateur : `Ctrl` + molette de souris pour zoomer autour du pointeur ; double-clic sur une zone vide du PDF.
- Le zoom conserve autant que possible la position de lecture et permet le défilement horizontal des pages agrandies.
- PDF.js utilise un rendu haute définition tenant compte de la densité de pixels de l’appareil, avec une limite de 12 mégapixels par canevas pour éviter la saturation mémoire.
- Les pages, miniatures et zones de sélection de texte sont chargées **progressivement lorsqu’elles approchent de l’écran**. Les canevas éloignés sont libérés pour limiter les ralentissements.
- L’ouverture des documents volumineux affiche une progression ; un indicateur discret apparaît tant qu’une page visible est en cours de rendu.

**Limite de netteté :** un PDF qui contient déjà une photographie ou une image très compressée ne peut pas retrouver des détails absents. La haute définition améliore surtout le rendu de la page et des textes vectoriels.

**Vérification :** `node tests/check-i18n.mjs` et `node tests/check-viewer.mjs` vérifient les traductions et les principaux garde-fous du visualiseur. Pour les performances réelles et les gestes tactiles, un test dans Chrome/Firefox avec le PDF concerné reste nécessaire.

## Limites importantes

**Le remplacement de texte n'est pas une modification structurelle du PDF.** Il masque le texte d'origine et superpose un nouveau contenu, mais le texte original **reste extractible**. **Ne jamais s'en servir pour cacher des informations sensibles.** Aucun OCR, aucune signature électronique cryptographique, aucune garantie de conservation exacte sur tous les PDF (notamment PDF tournés ou rognés).

**La liste des polices n'est pas un pack distribué** : l'affichage utilise les polices installées sur le système ou des alternatives ; l'export utilise les polices PDF standard ou les TTF/OTF importées dans la session. Pour conserver fidèlement une police dans le PDF exporté, importez son fichier TTF/OTF et assurez-vous d'avoir les droits d'utilisation. Les polices Microsoft et Apple ne sont pas redistribuées dans ce dépôt.

Les fichiers PDF sélectionnés sont traités dans le navigateur par l'application. Les bibliothèques externes et les ressources graphiques sont chargées depuis un CDN ; le site nécessite donc une connexion pour son premier chargement. Aucun document n'est stocké dans le dépôt, ni sauvegardé sur nos serveurs.

## Utilisation locale

Le site doit être servi en HTTP pour prendre en charge les modules JavaScript et le worker PDF.js :

~~~sh
python3 -m http.server 8000
~~~

Puis ouvrir http://localhost:8000 dans le navigateur.

## GitHub Pages

Le workflow GitHub Actions situé dans .github/workflows/pages.yml publie le contenu de la branche main. Il tente d'activer Pages automatiquement avec l'action configure-pages. Si l'activation échoue, configurer dans **Settings > Pages > Build and deployment > Source : GitHub Actions**, puis relancer le workflow.

URL attendue : https://borishnt.github.io/aDaube-Acrobait/

## Bibliothèques et licences tierces

- PDF.js — Apache-2.0 — https://mozilla.github.io/pdf.js/
- pdf-lib — MIT — https://pdf-lib.js.org/
- @pdf-lib/fontkit — MIT — https://github.com/Hopding/fontkit
- Google Material Symbols — Apache-2.0 — https://fonts.google.com/icons
- Inter — SIL OFL-1.1 — https://rsms.me/inter/

Leurs licences demeurent applicables indépendamment de celle du projet.

## Licence

**The Unlicense**. Le code original du projet est dédié au domaine public dans les juridictions qui le permettent : libre de réutilisation, modification, redistribution et commercialisation, sans attribution imposée.

Dépôt : https://github.com/BorisHnt/aDaube-Acrobait
