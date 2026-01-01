# SafeClub UI

A web interface for the SafeClub Ethereum smart contract - a secure treasury management system for student clubs.

## Features

- **Wallet Connection**: Connect via MetaMask
- **Treasury View**: See current ETH balance
- **Deposit ETH**: Send ETH to the contract treasury
- **Proposals**: Create, view, and manage expense proposals
- **Voting**: Vote for/against active proposals (members only)
- **Execution**: Execute accepted proposals after deadline
- **Member Management**: Add/remove members (owner only)

## Prerequisites

- Node.js 18+
- MetaMask browser extension
- A deployed SafeClub contract

## Setup

1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment (optional):
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your contract details:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_CHAIN_ID=31337
   NEXT_PUBLIC_RPC_URL=http://localhost:8545
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Configuration

### Environment Variables
- `NEXT_PUBLIC_CONTRACT_ADDRESS` - Deployed SafeClub contract address
- `NEXT_PUBLIC_CHAIN_ID` - Network chain ID (31337 for local, 11155111 for Sepolia, etc.)
- `NEXT_PUBLIC_RPC_URL` - (Optional) RPC URL for read-only mode

### In-App Settings
Click the **Settings** button to configure:
- Contract Address (with checksum validation)
- Chain ID
- RPC URL

Settings are stored in localStorage and override environment variables.

## Usage

### Connect Wallet
1. Click "Connect Wallet"
2. Approve the connection in MetaMask
3. Ensure you're on the correct network

### Deposit ETH
1. Click "Deposit ETH" on the balance card
2. Enter amount in ETH
3. Confirm transaction in MetaMask

### Create Proposal (Members Only)
1. Click "Create Proposal"
2. Fill in:
   - Recipient address
   - Amount in ETH
   - Description
   - Voting deadline (date/time or duration)
3. Submit and confirm transaction

### Vote on Proposals (Members Only)
1. Find an active proposal
2. Click "Vote For" or "Vote Against"
3. Confirm transaction in MetaMask

### Execute Proposals (Members Only)
1. After deadline passes, "Execute" button appears
2. Click "Execute Proposal"
3. Confirm transaction - ETH transfers to recipient

### Manage Members (Owner Only)
1. Scroll to "Members Management" section
2. Enter address to add/remove
3. Confirm transaction

## Contract Integration

### Expected ABI

The UI expects these contract functions:

**Read Functions:**
- `getBalance() → uint256`
- `isMember(address) → bool`
- `owner() → address`
- `memberCount() → uint256`
- `proposalCount() → uint256`
- `getProposal(uint256) → (amount, recipient, description, deadline, executed, forVotes, againstVotes, membersSnapshot)`

**Optional Read Functions:**
- `getMembers() → address[]`
- `hasVoted(uint256, address) → bool`
- `quorumBps() → uint256`

**Write Functions:**
- `createProposal(uint256 amount, address recipient, string description, uint256 deadline)`
- `vote(uint256 proposalId, bool support)`
- `executeProposal(uint256 proposalId)`
- `addMember(address)` (owner only)
- `removeMember(address)` (owner only)

### Replacing the ABI

1. Export ABI from your compiled contract
2. Replace contents of `src/abi/SafeClub.json`
3. Restart the development server

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- ethers.js v6
- Tailwind CSS
- shadcn/ui components

## Troubleshooting

### "MetaMask not detected"
Install MetaMask browser extension and refresh the page.

### "Contract not available"
1. Check Settings - ensure contract address is correct
2. Verify you're on the correct network (chain ID)
3. Confirm the contract is deployed

### "Transaction failed"
- Check you have enough ETH for gas
- Verify you have the required role (member/owner)
- Check the contract isn't paused

### "Wrong network"
Switch to the correct network in MetaMask. The expected chain ID is shown in the Settings panel.
