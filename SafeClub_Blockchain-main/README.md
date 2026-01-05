# SafeClub - Secure Treasury for Student Club on Ethereum

SafeClub is a secure, on-chain treasury management smart contract for student clubs on Ethereum. It enables members to collaboratively manage club funds through transparent governance: creating expense proposals, voting on them, and executing accepted proposals.

## Features

- 🛡️ **Secure**: Built with OpenZeppelin contracts and security best practices
- 👥 **Member Management**: Owner-controlled membership with efficient lookup
- 💰 **ETH Treasury**: Receive and hold ETH deposits
- 📋 **Proposal System**: Create expense proposals with descriptions and deadlines
- 🗳️ **Voting**: One vote per member per proposal (for/against)
- ✅ **Execution**: Execute proposals only if quorum and majority requirements are met
- ⚙️ **Configurable**: Adjustable quorum threshold (default 50%)

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Hardhat installed globally (optional): `npm install -g hardhat`

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Blockhain_Project

# Install dependencies
npm install
```

### Compile

```bash
npm run compile
```

### Test

```bash
npm test
```

### Deploy

Deploy to local Hardhat network:

```bash
npx hardhat run scripts/deploy.ts --network hardhat
```

Deploy to local node (requires running `npx hardhat node`):

```bash
npx hardhat run scripts/deploy.ts --network localhost
```

### Demo Scenario

Run the full demo scenario:

```bash
npm run demo
```

This will:
1. Deploy the contract
2. Add members
3. Deposit funds
4. Create a proposal
5. Cast votes
6. Execute the proposal

## Project Structure

```
/
├── contracts/
│   ├── SafeClub.sol              # Main contract
│   └── ReenteringReceiver.sol    # Test helper for reentrancy tests
├── test/
│   └── SafeClub.test.ts          # Comprehensive test suite
├── scripts/
│   ├── deploy.ts                 # Deployment script
│   └── demoScenario.ts           # Demo scenario script
├── docs/
│   ├── DOCUMENTATION.md          # Detailed documentation
│   ├── SECURITY_REPORT.md        # Security analysis
│   ├── DECISIONS.md              # Design decisions
│   └── SLITHER.md                # Static analysis guide
├── hardhat.config.ts             # Hardhat configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Usage

### Deploying the Contract

```bash
npx hardhat run scripts/deploy.ts --network <network>
```

Set environment variables in `.env`:
```env
PRIVATE_KEY=your_private_key
RPC_URL=your_rpc_url
INITIAL_MEMBERS=0x123...,0x456...  # Optional
```

### Interacting with the Contract

#### Add Members (Owner only)

```javascript
await safeClub.addMember(memberAddress);
```

#### Create Proposal (Members only)

```javascript
const amount = ethers.parseEther("1.0"); // 1 ETH
const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
const tx = await safeClub.createProposal(
  amount,
  recipientAddress,
  "Purchase equipment",
  deadline
);
```

#### Vote (Members only)

```javascript
await safeClub.vote(proposalId, true);  // Vote for
await safeClub.vote(proposalId, false); // Vote against
```

#### Execute Proposal (Members only)

```javascript
await safeClub.executeProposal(proposalId);
```

## Decision Rule

A proposal is **accepted** if:

1. **Quorum**: `totalVotes >= ceil(membersSnapshot * quorumBps / 10000)`
   - `membersSnapshot` is the member count when the proposal was created
   - Default quorum: 50% (5000 basis points)

2. **Majority** (if enabled): `forVotes > againstVotes`
   - Requires strict majority (ties fail)
   - Default: Enabled

See [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) for detailed explanation and examples.

## Security

### Implemented Security Measures

- ✅ Reentrancy protection (OpenZeppelin ReentrancyGuard)
- ✅ Access control (OpenZeppelin Ownable + custom modifiers)
- ✅ Input validation (amounts, addresses, deadlines)
- ✅ State validation (no double voting, no double execution)
- ✅ Checks-Effects-Interactions pattern
- ✅ Member snapshot for quorum calculation
- ✅ Custom errors for gas efficiency

### Security Audit

- **Static Analysis**: See [docs/SLITHER.md](docs/SLITHER.md)
- **Security Report**: See [docs/SECURITY_REPORT.md](docs/SECURITY_REPORT.md)

⚠️ **Warning**: This contract has not undergone a professional security audit. Do not deploy to mainnet with significant funds without an external audit.

## Testing

Run the test suite:

```bash
npm test
```

Test coverage includes:
- Membership management
- ETH deposits
- Proposal creation and validation
- Voting (including edge cases)
- Proposal execution
- Reentrancy protection
- Access control
- Decision rule logic
- Edge cases

## Documentation

- **[Documentation](docs/DOCUMENTATION.md)**: Complete contract documentation
- **[Security Report](docs/SECURITY_REPORT.md)**: Security analysis and threat model
- **[Design Decisions](docs/DECISIONS.md)**: Assumptions and design choices
- **[Slither Guide](docs/SLITHER.md)**: Static analysis setup and results

## Scripts

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Run demo scenario
npm run demo

# Deploy to localhost
npm run deploy:local

# Run Slither (requires Python)
slither .
```

## Configuration

### Environment Variables

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key
RPC_URL=http://127.0.0.1:8545
INITIAL_MEMBERS=0x123...,0x456...  # Optional
REPORT_GAS=true  # Optional, for gas reporting
```

### Hardhat Configuration

Edit `hardhat.config.ts` to add networks, configure compiler settings, etc.

## Gas Costs

Estimated gas costs (approximate):

- **Add Member**: ~50,000 - 70,000 gas
- **Create Proposal**: ~100,000 - 150,000 gas
- **Vote**: ~60,000 - 80,000 gas
- **Execute Proposal**: ~80,000 - 100,000 gas

## Limitations

1. **ETH Only**: Currently supports only ETH, not ERC20 tokens
2. **No Proposal Cancellation**: Proposals cannot be cancelled once created
3. **No Time-Lock**: No delay between acceptance and execution
4. **No Emergency Pause**: No pause functionality (by design)
5. **Fixed Majority Requirement**: `requireSimpleMajority` cannot be changed after deployment

See [docs/DECISIONS.md](docs/DECISIONS.md) for rationale.

## Future Enhancements

Potential improvements (not implemented):

- ERC20 token support
- Proposal cancellation
- Time-lock between acceptance and execution
- Emergency pause functionality
- Delegate voting
- Multi-signature owner
- Proposal updating before voting starts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run tests and linters
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This software is provided "as is" without warranty of any kind. Use at your own risk. Always conduct thorough testing and security audits before deploying to mainnet with significant funds.

## UI Plan (Optional)

If implementing a web UI, consider:

### Frontend Stack
- **Framework**: React + TypeScript
- **Build Tool**: Vite
- **Web3**: ethers.js v6 or wagmi + viem
- **Styling**: Tailwind CSS or Material-UI

### Key Features
1. **Connection**: MetaMask wallet connection
2. **Dashboard**: 
   - Contract balance
   - Member list
   - Proposal list with status
3. **Create Proposal**: Form with amount, recipient, description, deadline
4. **Voting**: Vote buttons (for/against) on active proposals
5. **Execution**: Execute button for accepted proposals (after deadline)
6. **Events**: Display recent events (deposits, proposals, votes, executions)

### Contract Interaction Points
- `getBalance()` - Display treasury balance
- `getMembers()` - List all members
- `proposalCount()` - Get total proposals
- `getProposal(id)` - Get proposal details
- `vote(proposalId, support)` - Cast vote
- `executeProposal(proposalId)` - Execute proposal
- Event listeners for real-time updates

### Example Integration

```javascript
// Connect to contract
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const safeClub = new ethers.Contract(contractAddress, abi, signer);

// Get balance
const balance = await safeClub.getBalance();

// Create proposal
const tx = await safeClub.createProposal(
  ethers.parseEther("1.0"),
  recipientAddress,
  "Description",
  deadline
);

// Vote
await safeClub.vote(proposalId, true);

// Execute
await safeClub.executeProposal(proposalId);
```

---

**Built with ❤️ using Hardhat, Solidity, and OpenZeppelin**

