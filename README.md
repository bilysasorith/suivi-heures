# ⏱️ Suivi des heures — Infogreffe

Petit site statique pour suivre mes heures de prestation freelance :
combien j'ai fait cette semaine, si je suis **en avance ou en retard**, et le montant gagné.

**Objectif : 10 h / semaine · 30 € / heure.**

## ✍️ Ajouter mes heures

1. J'ouvre le fichier [`data.js`](data.js).
2. J'ajoute une ligne dans la liste `heures`, par exemple :
   ```js
   { date: "2026-09-03", heures: 2.5, note: "Traitement des données" },
   ```
   - `date` : le jour travaillé, au format `AAAA-MM-JJ`
   - `heures` : nombre d'heures (`1.5` = 1h30)
   - `note` : courte description (facultatif)
3. J'enregistre, puis je **commit + push** (voir plus bas). Le site se met à jour tout seul.

La config (date de début, objectif hebdo, tarif) se règle en haut de `data.js`.

## 🚀 Mettre à jour le site

Depuis ce dossier :

```bash
git add data.js && git commit -m "Ajout des heures" && git push
```

GitHub Pages republie automatiquement en ~1 minute.

## 🌐 Adresse du site

Une fois GitHub Pages activé : `https://<utilisateur>.github.io/<repo>/`

*(Réglage : GitHub → repo → Settings → Pages → Branch `main` / dossier `/root`.)*

## 🔒 Note

Le dépôt est **public** : n'y mets aucune donnée sensible. Il ne contient que
tes heures, les descriptions de tâches et les montants.
