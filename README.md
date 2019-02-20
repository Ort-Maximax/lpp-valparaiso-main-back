[![forthebadge](https://forthebadge.com/images/badges/fo-shizzle.svg)](https://forthebadge.com)


[![Codacy Badge](https://api.codacy.com/project/badge/Grade/03accaf06b9a473ba460bf122b519cd2)](https://www.codacy.com/app/EISAWESOME/lpp-valparaiso-main-back?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Ort-Maximax/lpp-valparaiso-main-back&amp;utm_campaign=Badge_Grade) [![Build Status](https://travis-ci.org/Ort-Maximax/lpp-valparaiso-main-back.svg?branch=master)](https://travis-ci.org/Ort-Maximax/lpp-valparaiso-main-back)

# Main back

Point d'entrée de toute les requete du client. S'interface avec la MQ pour interagir avec les micro-services

# REFONTES DES API EN COURS
---

## /getData
Retourne un objet représentant le dossier Valparaiso d'un utilisateur

---

## /streamFile
Retourne un stream du path fournis en parametre

---

## /removeFile
Supprime le fichier au path fournis

---

## /downloadFile
Télécharge le fichier au path fournis

---

## /uploadFile
Sauvegarde les fichiers sur le serveur au path fournis

---

## /ffmpegAction
Effectue les actions suivante sur des vidéo et images : hflip (rotation horizontale), vflip (rotation verticale), convert_mp4_h264 (conversion de la vidéo en mp4 avec un codec h264).
