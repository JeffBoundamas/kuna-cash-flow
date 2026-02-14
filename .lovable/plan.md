

# Couleurs personnalisables et separation des categories

## Changements prevus

### 1. Ajout d'une colonne `color` en base de donnees

Ajout d'une colonne `color` (type `text`, valeur par defaut `"blue"`) a la table `categories`. Les categories existantes recevront automatiquement une couleur selon leur nature actuelle (bleu pour Essentiel, orange pour Desir, vert pour Epargne).

Migration SQL :
- `ALTER TABLE categories ADD COLUMN color text NOT NULL DEFAULT 'blue'`
- `UPDATE` des categories existantes pour mapper les natures vers des couleurs initiales
- Mise a jour de la fonction `seed_default_categories()` pour inclure des couleurs par defaut

### 2. Palette de couleurs dans le formulaire de creation/edition

Dans le Sheet d'ajout/modification (`CategoryManager.tsx`), ajout d'un selecteur visuel de couleur sous forme de pastilles cliquables. Palette proposee (10 couleurs) :

- Rouge, Orange, Ambre, Jaune, Vert, Emeraude, Bleu, Indigo, Violet, Rose

L'utilisateur clique sur une pastille pour choisir la couleur. La couleur selectionnee est entouree d'un anneau.

### 3. Mise a jour du type `Category` et des hooks

- Ajout du champ `color: string` dans l'interface `Category` (types.ts)
- Mise a jour des mutations `useAddCategory` et `useUpdateCategory` pour inclure `color`

### 4. Affichage de la couleur choisie partout

Remplacement des couleurs codees en dur par nature (`NATURE_DOT`, `NATURE_COLORS`) par la couleur personnalisee de chaque categorie dans :
- `CategoryManager.tsx` : pastille de couleur a cote du nom
- `CategoryListPicker.tsx` : point colore dans le selecteur de transactions

### 5. Separation dans la page Reglages

Dans `Settings.tsx`, remplacement du bouton unique "Categories" par deux boutons de sous-menu :
- **Categories de depenses** → navigue vers `/categories?type=expense`
- **Categories de revenus** → navigue vers `/categories?type=income`

La page `Categories.tsx` lira le parametre `type` de l'URL pour :
- Afficher le titre correspondant ("Categories de depenses" ou "Categories de revenus")
- Filtrer et n'afficher que les categories du type concerne
- Pre-selectionner le type dans le formulaire d'ajout (et masquer le selecteur de type)

---

## Fichiers concernes

| Fichier | Modification |
|---|---|
| Migration SQL | Ajout colonne `color`, update existants, update seed function |
| `src/lib/types.ts` | Ajout `color: string` dans `Category` |
| `src/hooks/use-categories.ts` | Inclure `color` dans add/update mutations |
| `src/components/categories/CategoryManager.tsx` | Selecteur de couleur (pastilles), utiliser `color` pour l'affichage, accepter prop `filterType` |
| `src/components/transactions/CategoryListPicker.tsx` | Utiliser `cat.color` au lieu de `NATURE_DOT` |
| `src/pages/Settings.tsx` | Deux boutons : depenses et revenus |
| `src/pages/Categories.tsx` | Lire `?type=` depuis l'URL, passer le filtre au manager |

