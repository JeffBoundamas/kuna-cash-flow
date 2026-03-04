

## Diagnostic : Logo et page Auth

### Constat

Apres verification complete via le navigateur automatise, la page `/auth` affiche correctement :

1. **Le logo Kuna** (plante + pieces) -- present et visible
2. **"Mot de passe oublie ?"** -- present sous le bouton "Se connecter"
3. **"Continuer avec Google"** -- present en bas avec l'icone Google

Le fichier `src/assets/logo.png` existe, contient bien l'image du logo, et est importe correctement dans tous les composants (Auth, SplashScreen, BottomNav, DesktopSidebar, OnboardingFlow, ResetPassword).

### Cause probable

Le probleme semble etre lie a un cache navigateur ou un rechargement incomplet de la preview. L'asset est correctement bundle par Vite.

### Action recommandee

Aucune modification de code n'est necessaire -- tout fonctionne. Essayez un rechargement force de la preview (Ctrl+Shift+R / Cmd+Shift+R) pour forcer le navigateur a re-telecharger tous les assets.

Si le probleme persiste malgre le rechargement force, une solution de robustesse serait de dupliquer le logo dans `/public/logo.png` (deja present) et d'utiliser un chemin absolu (`/logo.png`) au lieu d'un import Vite, ce qui eliminerait toute dependance au bundling pour cet asset critique.

