---
title: "Workflow photo argentique"
subtitle: "De la pellicule au post"
date: 2021-01-20T13:56:50+01:00
draft: false
tags: 
- argentique
- photo
- Workflow
- Lightroom
categories:
- life
slug: "workflow-argentique"
emoji: "🎞"
resources:
- src: "*.jpg"
- src:  "cover.jpg"
  name: "cover"
---

J'avais envie de vous parler un peu de mon workflow pour la photo argentique. En fait, en parler me permet de le figer dans le temps alors qu'il ne cesse de changer et qu'il rechangera avec vos retours. J'en suis certain. 

Pour cette recette, il vous faudra:
- Un frigo
- Des films photo
- Des sujets à photographier, intéressants ou non
- Un labo sympa 
- Un ordinateur
- Lightroom Classic avec en option Negative Lab Pro
- Une appli pour vos photos développées, perso je suis pour tout dans Photos.app.

Ceci n'est que mon workflow actuel, elle n'engage que moi et marche pour le moment. Comme disent les américains, vos kilomètres peuvent varier. Cette recette va évoluer pour moi bientôt car je compte commencer à scanner mes films moi-même. J'attend juste un boîtier numérique qui ne devrait plus tarder. Qui l'eu cru, revendre tout son matos et se rendre compte que un boîtier numérique est bien plus rapide pour scanner de l'argentique.

### Cuisson des scans

Chargez la pellicule dans votre appareil préféré.
Prenez en photos vos sujets favoris dans des situations diverses et variées. Plus on est de fous, plus on rit. Une fois la pellicule terminée, stockez la avec les oeufs dans votre frigo. Rincez et répétez. Une fois le bac à oeufs rempli ou lors d'un excès de zèle, amenez ou envoyez vos pellicules à votre labo favori. Je peux vous conseiller [Nation Photo](https://nationphoto.com) ou [Mori Film Lab](https://morifilmlab.com). 

Une fois envoyé, patientez jusqu'à réception des fichiers ou du lien de téléchargement. Il se peut que le temps s'étende à l'infini une fois l'envoi fait. Vous venez de comprendre la relativité du temps. Merci Albert Einstein.

### Stockage local

Laissez reposer le temps de l'arrivée des scans sur votre ordinateur. Utilisez votre outil favori pour les télécharger. En local, utilisez une arborescence du type `/Volumes/Daily/Photos/scans/2021/2021-01-10-description-pellicule`. Ajoutez ou retirez des parties selon votre goût. C'est personnel, je pensais ajouter l'appareil mais ça peut devenir long. En gros `Daily` est mon disque dur du quotidien. Un SSD de 1To de chez Sandisk. Je vous laisse trouver le lien dans votre shop favori.

### Petites élucubrations autour du backup

Une fois cette copie en local, préparez votre disque de backup favori. Si vous n'en n'avez pas, prenez un NAS ou un simple disque USB selon vos besoin. Je suis un peu parano et j'ai donc en local `/Volumes/Daily/Photos/2021` & `/Volumes/Backup/Photos/2021`. Sur un NAS que je n'allume que mensuellement, une copie complète via `rsync` de `/Volumes/Backup/Photos` et dans les internets, une autre copie complète du backup. Personnellement, j'ai un backup complet vers [Backblaze B2](https://backblaze.com) en utilisant [Arq](https://arqbackup.com) sur mac. Si votre NAS, le supporte, il a sans doute un outil de sauvegarde similaire. Ne négligez pas les backups, même si au final c'est comme les avocats. On consulte avant d'en avoir besoin en espérant ne jamais les utiliser. Ou les assurances comme vous préférez.

### Lightroom & Negative lab pro

Une fois stocké en local, Importez dans Lightroom Classic. Via les métadonnées des photos, ajoutez les informations du film, de l'appareil utilisé et tout ce qui vous semble nécessaire. J'ai personnellement des "smart collections" par appareil et film. Cela me permet de voir en un clin d'oeil les différentes photos prises au Portra ou Tri-X. J'utilise [Negative Lab Pro](https://www.negativelabpro.com/) pour la partie métadonnées. *Je compte bientôt scanner moi-même comme dit plus haut, ce qui justifie l'usage de NLP (Negative Lab Pro). Si cela ne le justifie pas, c'est mon choix quand même.* Pour en savoir plus sur les métadonnées avec NLP, allez voir sur [ce guide](https://www.negativelabpro.com/guide/film-metadata/). 

Une fois les photos importées dans lightroom, je sélectionne mes favorites et exclus certaines. Je fais quelques ajustements simples, je redresse l'horizon, recadre un rien. Cela ne me prend pas plus d'une minute par photo. Je me suffit du bon scan fait par le labo pour les couleurs bien souvent. Une fois la sélection prête, j'utilise la fonction d'export de Lightroom en laissant NLP écraser les données [EXIF](https://fr.wikipedia.org/wiki/Exchangeable_image_file_format). J'exporte des jpg de 3000px de côté.

### Export vers Photos

Une fois exportée, pour avoir un accès facile à toutes mes photos, je copie les jpeg dans Photos. J'y crée aussi des smart albums par appareil et par film. En plus j'ai un dossier Scans avec des albums par date qui copient un rien les dossiers physiques de mon disque. C'est aussi ici que les données EXIF se montrent importantes. Photos les lit et les indexe. Cela permet de chercher par film, appareil ou tout autre information fournie. Je ne sais pas si ce sont les fields EXIF ou juste les tags qui sont utilisés. Je dois creuser.

Une fois que je les ai dans photos, je peux les poster facilement à gauche, à droite. J'utilise Darkroom sur iOS pour du peaufinement de dernière minute ou pour mettre un cadre blanc avant de poster. Je ne le fais plus pour Instagram car une galerie devient horrible une fois le dark mode activé. J'ai tout en mode système et donc je ne pouvais plus regarder ma grille sans pleurer.

C'est à peu prêt tout je pense. J'adorerais vos retours sur cette recette perso et en savoir un peu plus sur la vôtre. 