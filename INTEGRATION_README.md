# SafeClub - Full Blockchain + UI Integration

This project integrates a Solidity smart contract (SafeClub) with a React/Next.js frontend for a secure student club treasury management system.

## 🚀 Quick Start - Full Integration

### 1. Start the Local Blockchain

```bash
cd Blockhain_Project
npx hardhat node
```

This starts a local Ethereum network on `http://127.0.0.1:8545` with chain ID 1337.

### 2. Deploy the Contract

```bash
cd Blockhain_Project
npx hardhat run scripts/deploy.ts --network hardhat
```

The contract will be deployed to: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

### 3. Add Members (Optional)

```bash
cd Blockhain_Project
npx hardhat run scripts/addMember.ts --network hardhat
```

### 4. Start the UI

```bash
cd safe-club-ui
pnpm install
pnpm dev
```

The UI will be available at `http://localhost:3000`

### 5. Connect MetaMask

1. Install [MetaMask](https://metamask.io/) browser extension
2. Open MetaMask and click the network dropdown
3. Click "Add Network"
4. Fill in:
   - Network Name: `Hardhat Local`
   - New RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - Currency Symbol: `ETH`
5. Switch to the "Hardhat Local" network
6. Import an account using one of the private keys from the Hardhat node output
7. Visit `http://localhost:3000` and click "Connect Wallet"

## 📋 What's Included

### Blockchain (Blockhain_Project/)

- **SafeClub.sol**: Main governance contract
- **ReenteringReceiver.sol**: Test helper for security testing
- Comprehensive test suite (44 tests passing)
- Deployment and demo scripts

### UI (safe-club-ui/)

- **Wallet Connection**: MetaMask integration
- **Treasury Dashboard**: View balance and proposals
- **Proposal Management**: Create, vote, and execute proposals
- **Member Management**: Add/remove members (owner only)
- **Settings**: Configure contract address and network

## 🔧 Configuration

The UI is pre-configured with:

- Contract Address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Chain ID: `1337`
- RPC URL: `http://127.0.0.1:8545`

These are set in `safe-club-ui/.env.local`

## 🧪 Testing

Run the full test suite:

```bash
cd Blockhain_Project
npm test
```

Run a demo scenario:

```bash
cd Blockhain_Project
npm run demo
```

## 📚 Features

- **Secure Treasury**: ETH deposits and withdrawals via governance
- **Member Governance**: Owner-managed membership
- **Proposal System**: Create expense proposals with deadlines
- **Voting**: One vote per member (for/against)
- **Quorum Requirements**: Configurable threshold (default 50%)
- **Reentrancy Protection**: Built with OpenZeppelin
- **Responsive UI**: Modern React interface with Tailwind CSS

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity, OpenZeppelin, Hardhat
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Web3**: Ethers.js, MetaMask
- **UI Components**: Radix UI, Lucide Icons

## 🔒 Security

- Comprehensive test coverage
- Reentrancy protection
- Access control with OpenZeppelin
- Static analysis with Slither
- Security audit documentation included

The integration is now complete and ready for development and testing!
