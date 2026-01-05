# 🚀 Guide Complet d'Utilisation de SafeClub

## 📋 Table des Matières
1. [Prérequis](#prérequis)
2. [Installation de MetaMask](#installation-de-metamask)
3. [Configuration de l'environnement](#configuration-de-lenvironnement)
4. [Déploiement du contrat](#déploiement-du-contrat)
5. [Configuration de MetaMask](#configuration-de-metamask)
6. [Utilisation de l'interface](#utilisation-de-linterface)
7. [Test complet du système](#test-complet-du-système)

---

## 1. Prérequis ✅

- **Node.js** installé (version 16 ou supérieure)
- **Navigateur** : Chrome, Firefox, Brave ou Edge
- **Extension MetaMask** installée

---

## 2. Installation de MetaMask 🦊

### Étape 1 : Télécharger MetaMask
1. Allez sur [metamask.io](https://metamask.io)
2. Cliquez sur "Download"
3. Sélectionnez votre navigateur
4. Installez l'extension

### Étape 2 : Créer un portefeuille
1. Ouvrez MetaMask
2. Cliquez sur "Get Started"
3. Sélectionnez "Create a Wallet"
4. Acceptez les conditions
5. Créez un mot de passe fort
6. **IMPORTANT** : Sauvegardez votre phrase de récupération (12 mots)
7. Confirmez la phrase de récupération

---

## 3. Configuration de l'environnement 🛠️

### Étape 1 : Démarrer le serveur web
Ouvrez PowerShell dans le dossier du projet et exécutez :
```powershell
# Démarrer le serveur web sur le port 8000
python -m http.server 8000
```

**OU** si vous avez Node.js :
```powershell
npx http-server -p 8000
```

### Étape 2 : Démarrer le nœud Hardhat
Ouvrez un **nouveau terminal PowerShell** et exécutez :
```powershell
cd "c:\Users\mejri\Downloads\SafeClub_Blockchain-main\SafeClub_Blockchain-main"
npx hardhat node
```

✅ **Résultat attendu** : Vous devriez voir 20 comptes de test avec 10000 ETH chacun

**IMPORTANT** : Notez les informations suivantes :
- **Account #0 Address** : `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Account #0 Private Key** : `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**⚠️ GARDEZ CE TERMINAL OUVERT** - C'est votre blockchain locale

---

## 4. Déploiement du contrat 🚀

### Étape 1 : Déployer SafeClub
Ouvrez un **troisième terminal PowerShell** et exécutez :
```powershell
cd "c:\Users\mejri\Downloads\SafeClub_Blockchain-main\SafeClub_Blockchain-main"
npx hardhat run scripts/deploy.ts --network localhost
```

✅ **Résultat attendu** :
```
SafeClub deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Owner: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**📝 NOTEZ L'ADRESSE DU CONTRAT** : `0x5FbDB2315678afecb367f032d93F642f64180aa3`

---

## 5. Configuration de MetaMask 🦊

### Étape 1 : Ajouter le réseau Hardhat Local

1. Ouvrez MetaMask
2. Cliquez sur le **sélecteur de réseau** en haut
3. Cliquez sur **"Add network"**
4. Cliquez sur **"Add a network manually"**
5. Remplissez les champs :

```
Network Name:       Hardhat Local
RPC URL:           http://127.0.0.1:8545
Chain ID:          31337
Currency Symbol:   ETH
Block Explorer:    (laissez vide)
```

6. Cliquez sur **"Save"**
7. **Changez le réseau actif** vers "Hardhat Local"

### Étape 2 : Importer un compte de test

1. Dans MetaMask, cliquez sur l'**icône du compte** (en haut à droite)
2. Sélectionnez **"Import Account"**
3. Dans "Select Type", choisissez **"Private Key"**
4. Collez la clé privée du Account #0 :
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
5. Cliquez sur **"Import"**

✅ **Résultat attendu** : Vous devriez voir un nouveau compte avec **10000 ETH**

### Étape 3 : Renommer le compte (optionnel)
1. Cliquez sur les 3 points à côté du compte
2. Sélectionnez "Account details"
3. Cliquez sur le crayon pour modifier le nom
4. Renommez en "Hardhat Test Account"

---

## 6. Utilisation de l'interface 🖥️

### Étape 1 : Ouvrir l'interface
1. Ouvrez votre navigateur
2. Allez à **http://localhost:8000**
3. Vous devriez voir l'interface SafeClub

### Étape 2 : Connecter MetaMask
1. Cliquez sur le bouton **"Connecter MetaMask"**
2. MetaMask va s'ouvrir
3. Sélectionnez le compte "Hardhat Test Account"
4. Cliquez sur **"Next"** puis **"Connect"**

✅ **Résultat** : Le bouton devient "✅ Connecté" et votre adresse s'affiche

### Étape 3 : Configurer l'adresse du contrat
1. Dans la section **"Configuration"**
2. Collez l'adresse du contrat déployé :
```
0x5FbDB2315678afecb367f032d93F642f64180aa3
```
3. Cliquez sur **"Définir l'Adresse"**
4. Cliquez sur **"🔄 Actualiser"**

✅ **Résultat** : Le solde du contrat s'affiche (initialement 0 ETH)

---

## 7. Test complet du système 🧪

### Test 1 : Déposer des fonds 💰

1. Dans la section **"Configuration"**, sous "Déposer des Fonds"
2. Entrez **10** dans le champ "Montant (ETH)"
3. Cliquez sur **"Déposer"**
4. MetaMask s'ouvre → Vérifiez les détails
5. Cliquez sur **"Confirm"**
6. Attendez la confirmation (~2 secondes)

✅ **Résultat** : Le solde du contrat passe à **10 ETH**

---

### Test 2 : Ajouter des membres 👥

**Note** : Seul le propriétaire (owner) peut ajouter des membres.

Ouvrez un terminal PowerShell et exécutez :
```powershell
# Ajouter le compte #1 comme membre
npx hardhat console --network localhost
```

Puis dans la console Hardhat :
```javascript
const SafeClub = await ethers.getContractFactory("SafeClub");
const safeClub = SafeClub.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

// Ajouter des membres (utilisez les adresses des comptes de test)
await safeClub.addMember("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"); // Owner
await safeClub.addMember("0x70997970C51812dc3A010C7d01b50e0d17dc79C8"); // Account #1
await safeClub.addMember("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"); // Account #2

// Vérifier les membres
console.log("Nombre de membres:", (await safeClub.memberCount()).toString());
```

---

### Test 3 : Créer une proposition 📝

1. Dans la section **"Créer une Proposition"**
2. Remplissez les champs :
   - **Montant** : `2`
   - **Adresse du Bénéficiaire** : `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - **Description** : `Achat de matériel informatique pour le club`
   - **Date Limite** : `7` (7 jours)
3. Cliquez sur **"Créer la Proposition"**
4. Confirmez dans MetaMask
5. Attendez la confirmation

✅ **Résultat** : La proposition apparaît dans la liste avec le statut "EN COURS"

---

### Test 4 : Voter sur une proposition 🗳️

1. Dans la liste des propositions, trouvez la proposition #0
2. Vous verrez deux boutons : **"👍 Voter Pour"** et **"👎 Voter Contre"**
3. Cliquez sur **"👍 Voter Pour"**
4. Confirmez dans MetaMask
5. Attendez la confirmation

✅ **Résultat** : 
- Le compteur "Pour" passe à **1**
- Les boutons disparaissent et affichent "✅ Vous avez déjà voté"

### Test 5 : Voter avec plusieurs comptes 👥

Pour tester le vote avec plusieurs comptes :

1. **Importer le Account #1** dans MetaMask :
   ```
   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```
2. **Changer de compte** dans MetaMask
3. **Actualisez la page** (F5)
4. **Reconnectez-vous** avec le nouveau compte
5. **Votez** sur la proposition

Répétez pour le Account #2 :
```
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

---

### Test 6 : Exécuter une proposition ⚡

**Note** : Vous devez attendre la date limite OU la modifier pour tester immédiatement.

#### Option A : Attendre la date limite (7 jours)
Pas pratique pour un test...

#### Option B : Créer une proposition avec deadline court
1. Créez une nouvelle proposition avec **Date Limite : 1 minute**
2. Votez rapidement
3. Attendez 1 minute
4. Actualisez la page
5. Le statut devient "TERMINÉE"
6. Si acceptée, le bouton **"⚡ Exécuter la Proposition"** apparaît
7. Cliquez dessus
8. Confirmez dans MetaMask

✅ **Résultat** : 
- La proposition passe au statut "EXÉCUTÉE"
- Les fonds sont transférés au bénéficiaire
- Le solde du contrat diminue

#### Option C : Modifier la deadline manuellement (pour les tests)
Créez un script de test rapide :

```javascript
// Dans la console Hardhat
const SafeClub = await ethers.getContractFactory("SafeClub");
const safeClub = SafeClub.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

// Créer une proposition avec deadline de 1 minute
const deadline = Math.floor(Date.now() / 1000) + 60; // +1 minute
await safeClub.createProposal(
    ethers.utils.parseEther("2"),
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "Test rapide",
    deadline
);
```

---

## 🎯 Checklist de Test Complet

- [ ] Serveur web démarré (port 8000)
- [ ] Nœud Hardhat démarré (port 8545)
- [ ] Contrat déployé
- [ ] Réseau "Hardhat Local" ajouté à MetaMask
- [ ] Compte de test importé dans MetaMask
- [ ] Interface web accessible
- [ ] MetaMask connecté à l'interface
- [ ] Adresse du contrat configurée
- [ ] Fonds déposés dans le contrat
- [ ] Membres ajoutés
- [ ] Proposition créée
- [ ] Votes enregistrés
- [ ] Proposition exécutée

---

## ❓ Dépannage

### Problème : "insufficient funds"
**Solution** : Assurez-vous d'utiliser un compte de test importé avec la clé privée fournie

### Problème : "Cannot connect to the network"
**Solution** : Vérifiez que le nœud Hardhat est en cours d'exécution

### Problème : "User rejected the request"
**Solution** : Confirmez la transaction dans MetaMask

### Problème : "Nonce too high"
**Solution** : Réinitialisez MetaMask :
1. Paramètres → Avancé → Effacer les données d'activité

### Problème : Le solde ne s'affiche pas
**Solution** : 
1. Vérifiez l'adresse du contrat
2. Cliquez sur "🔄 Actualiser"
3. Vérifiez la console du navigateur (F12)

---

## 🔐 Sécurité - IMPORTANT

⚠️ **LES CLÉS PRIVÉES DE TEST NE DOIVENT JAMAIS ÊTRE UTILISÉES SUR UN RÉSEAU RÉEL**

Ces comptes sont publics et connus. N'envoyez JAMAIS de vrais ETH à ces adresses.

Pour un déploiement en production :
1. Créez un nouveau portefeuille
2. Utilisez un réseau de test (Sepolia, Goerli)
3. Ne partagez JAMAIS vos clés privées réelles
4. Utilisez un hardware wallet pour la production

---

## 🎉 Félicitations !

Vous avez configuré et testé avec succès votre application SafeClub !

Pour aller plus loin :
- Déployez sur un testnet public (Sepolia)
- Ajoutez plus de membres
- Testez différents scénarios de vote
- Explorez le code du contrat intelligent

---

**Bon développement ! 🚀**
