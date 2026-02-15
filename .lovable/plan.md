
# Taux d'epargne base sur l'action reelle

## Probleme actuel

Le taux d'epargne est calcule avec la formule theorique `(Revenus - Depenses) / Revenus x 100`. Ce chiffre ne reflete pas l'effort reel de mise de cote : un utilisateur peut avoir un "bon" taux simplement parce qu'il n'a pas encore depense, sans avoir reellement epargne.

De plus, les versements vers les objectifs d'epargne ne sont pas traces — on met a jour `current_amount` directement sans garder d'historique.

## Solution proposee

Creer une table `goal_contributions` qui enregistre chaque versement vers un objectif, puis baser le taux d'epargne sur la somme reelle des contributions du mois en cours.

### Nouvelle formule

```
Taux d'epargne = (Total des contributions du mois / Revenus du mois) x 100
```

Cela mesure combien l'utilisateur a **concretement** mis de cote, pas simplement ce qu'il n'a pas depense.

## Etapes techniques

### 1. Nouvelle table `goal_contributions`

Migration SQL pour creer la table :

- `id` (UUID, cle primaire)
- `user_id` (UUID, non-null)
- `goal_id` (UUID, reference vers `goals`)
- `account_id` (UUID, reference vers `accounts`)
- `amount` (bigint, non-null)
- `created_at` (timestamp, defaut now())

Avec politiques RLS : l'utilisateur ne voit/cree que ses propres contributions.

### 2. Modifier `useAddFundsToGoal`

En plus de mettre a jour `goals.current_amount` et `accounts.balance`, inserer une ligne dans `goal_contributions` pour tracer le versement.

### 3. Nouveau hook `useMonthlySavings`

Un hook qui recupere la somme des contributions du mois en cours depuis `goal_contributions`, pour alimenter le calcul du taux.

### 4. Mettre a jour `SavingsRate.tsx`

- Recevoir les contributions reelles en props (en plus des revenus)
- Nouvelle formule : `contributions du mois / revenus du mois x 100`
- Afficher un sous-texte explicatif : "Base sur vos versements reels vers vos objectifs"

### 5. Mettre a jour `Dashboard.tsx`

- Utiliser le nouveau hook `useMonthlySavings` pour passer les donnees au composant `SavingsRate`

## Resultat attendu

- Le taux d'epargne reflete l'effort reel de l'utilisateur
- Chaque versement est trace et peut servir plus tard pour un historique detaille
- L'indicateur visuel (vert/orange/rouge) reste le meme mais base sur des donnees concretes
