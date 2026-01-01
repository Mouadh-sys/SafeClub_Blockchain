# SafeClub Documentation

## Overview

SafeClub is a secure treasury management smart contract for student clubs on Ethereum. It enables members to collaboratively manage club funds through a transparent, on-chain governance process. Members can create expense proposals, vote on them, and execute accepted proposals to transfer ETH from the club treasury.

### Key Features

- **Member Management**: Owner-controlled membership with efficient lookup and enumeration
- **ETH Treasury**: Contract can receive and hold ETH deposits
- **Proposal System**: Members can create expense proposals with descriptions and deadlines
- **Voting Mechanism**: One vote per member per proposal, with for/against options
- **Secure Execution**: Proposals execute only if quorum and majority requirements are met
- **Configurable Governance**: Adjustable quorum threshold (default 50%)

## Architecture

### Roles

#### Owner
- Deploys and owns the contract
- Adds and removes members
- Updates quorum threshold
- Does NOT have special execution privileges

#### Members
- Create expense proposals
- Vote on proposals (for/against)
- Execute accepted proposals
- Do NOT have access to member management

### Data Structures

#### Proposal
```solidity
struct Proposal {
    uint256 id;              // Sequential proposal ID
    address proposer;        // Member who created the proposal
    uint256 amount;          // ETH amount to transfer (in wei)
    address payable recipient; // Address to receive the ETH
    string description;      // Human-readable description
    uint256 deadline;        // Timestamp when voting ends
    uint256 forVotes;        // Number of "for" votes
    uint256 againstVotes;    // Number of "against" votes
    bool executed;           // Whether proposal has been executed
    uint256 membersSnapshot; // Member count at proposal creation
}
```

### State Variables

- `_members`: EnumerableSet of member addresses
- `proposals`: Mapping from proposal ID to Proposal struct
- `hasVoted`: Mapping from (proposalId, member) to voting status
- `proposalCount`: Total number of proposals created
- `quorumBps`: Quorum threshold in basis points (0-10000)
- `requireSimpleMajority`: Whether to require forVotes > againstVotes

## Core Functions

### Membership Management

#### `addMember(address member)`
**Access**: Owner only  
**Purpose**: Add a new member to the club  
**Events**: `MemberAdded(address indexed member)`  
**Reverts if**: Member is zero address or already a member

#### `removeMember(address member)`
**Access**: Owner only  
**Purpose**: Remove a member from the club  
**Events**: `MemberRemoved(address indexed member)`  
**Reverts if**: Member is zero address or not a member

#### `isMember(address member) → bool`
**Access**: View, public  
**Purpose**: Check if an address is a member

#### `getMembers() → address[]`
**Access**: View, public  
**Purpose**: Get array of all member addresses

#### `memberCount() → uint256`
**Access**: View, public  
**Purpose**: Get total number of members

### Treasury

#### `receive()`
**Access**: External, payable  
**Purpose**: Receive ETH deposits  
**Events**: `Deposit(address indexed from, uint256 amount)`

#### `getBalance() → uint256`
**Access**: View, public  
**Purpose**: Get contract's ETH balance in wei

### Proposal Management

#### `createProposal(uint256 amount, address payable recipient, string description, uint256 deadline) → uint256`
**Access**: Members only  
**Purpose**: Create a new expense proposal  
**Events**: `ProposalCreated(uint256 indexed proposalId, address indexed proposer, uint256 amount, address recipient, string description, uint256 deadline)`  
**Returns**: Proposal ID  
**Reverts if**:
- Caller is not a member
- Amount is zero
- Recipient is zero address
- Deadline is in the past
- Amount exceeds contract balance

**Notes**:
- Proposal ID is sequential (starts at 0)
- Member count is snapshotted at creation time for quorum calculation

#### `getProposal(uint256 proposalId) → Proposal`
**Access**: View, public  
**Purpose**: Get complete proposal details  
**Reverts if**: Proposal ID doesn't exist

#### `proposalCount() → uint256`
**Access**: View, public  
**Purpose**: Get total number of proposals

### Voting

#### `vote(uint256 proposalId, bool support)`
**Access**: Members only  
**Purpose**: Cast a vote on a proposal (true = for, false = against)  
**Events**: `VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 forVotes, uint256 againstVotes)`  
**Reverts if**:
- Caller is not a member
- Proposal doesn't exist
- Proposal already executed
- Voting period has ended
- Member already voted

**Notes**:
- One vote per member per proposal
- Voting ends at the proposal deadline
- Votes cannot be changed once cast

### Execution

#### `executeProposal(uint256 proposalId)`
**Access**: Members only, nonReentrant  
**Purpose**: Execute an accepted proposal, transferring ETH to recipient  
**Events**: `ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount)`  
**Reverts if**:
- Caller is not a member
- Proposal doesn't exist
- Proposal already executed
- Voting period hasn't ended
- Proposal not accepted (quorum/majority)
- Insufficient contract balance

**Security**:
- Protected by ReentrancyGuard
- State updated before external call (Checks-Effects-Interactions)
- Uses low-level call with error checking

#### `isProposalAccepted(uint256 proposalId) → bool`
**Access**: View, public  
**Purpose**: Check if a proposal would be accepted according to current voting  
**Returns**: True if proposal meets quorum and majority requirements

### Configuration

#### `setQuorumBps(uint256 newQuorumBps)`
**Access**: Owner only  
**Purpose**: Update the quorum threshold  
**Events**: `QuorumUpdated(uint256 oldQuorumBps, uint256 newQuorumBps)`  
**Reverts if**: newQuorumBps > 10000

## Decision Rule

A proposal is **accepted** and can be executed if both conditions are met:

1. **Quorum**: `totalVotes >= ceil(membersSnapshot * quorumBps / 10000)`
   - `totalVotes = forVotes + againstVotes`
   - `membersSnapshot` is the member count when the proposal was created
   - Quorum uses ceiling division to round up

2. **Majority** (if `requireSimpleMajority` is true): `forVotes > againstVotes`
   - Requires strict majority (tie fails)
   - If `requireSimpleMajority` is false, any quorum-passing proposal is accepted

### Example

With 10 members, 50% quorum (5000 bps), and simple majority required:
- Quorum required: `ceil(10 * 5000 / 10000) = ceil(5.0) = 5` votes
- If 6 votes are cast (4 for, 2 against):
  - Quorum: ✓ (6 >= 5)
  - Majority: ✓ (4 > 2)
  - **Accepted**

- If 5 votes are cast (3 for, 2 against):
  - Quorum: ✓ (5 >= 5)
  - Majority: ✓ (3 > 2)
  - **Accepted**

- If 5 votes are cast (2 for, 3 against):
  - Quorum: ✓ (5 >= 5)
  - Majority: ✗ (2 > 3 is false)
  - **Rejected**

- If 4 votes are cast (3 for, 1 against):
  - Quorum: ✗ (4 < 5)
  - **Rejected** (regardless of majority)

## Typical Workflows

### 1. Initial Setup

```
1. Deploy contract (owner)
2. Add initial members (owner)
3. Deposit ETH to contract
```

### 2. Creating and Executing a Proposal

```
1. Member creates proposal:
   - Specify amount, recipient, description, deadline
   - Proposal ID is assigned

2. Voting period:
   - Members vote for/against
   - Voting ends at deadline

3. Execution:
   - After deadline, any member can execute if accepted
   - ETH is transferred to recipient
   - Proposal marked as executed
```

### 3. Member Management

```
Owner operations:
- addMember(address) - Add new member
- removeMember(address) - Remove member
- setQuorumBps(uint256) - Update quorum threshold
```

## Events

All major actions emit events for off-chain monitoring:

- `MemberAdded(address indexed member)`
- `MemberRemoved(address indexed member)`
- `Deposit(address indexed from, uint256 amount)`
- `ProposalCreated(uint256 indexed proposalId, address indexed proposer, uint256 amount, address recipient, string description, uint256 deadline)`
- `VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 forVotes, uint256 againstVotes)`
- `ProposalExecuted(uint256 indexed proposalId, address indexed recipient, uint256 amount)`
- `QuorumUpdated(uint256 oldQuorumBps, uint256 newQuorumBps)`

## Gas Considerations

- **Creating a proposal**: ~100,000 - 150,000 gas
- **Voting**: ~60,000 - 80,000 gas
- **Executing proposal**: ~80,000 - 100,000 gas (depending on recipient)
- **Adding/removing member**: ~50,000 - 70,000 gas

Gas costs vary based on:
- Number of existing members/proposals
- String length in descriptions
- Network conditions

## Integration Example

```javascript
// Connect to contract
const safeClub = await ethers.getContractAt("SafeClub", contractAddress);

// Create proposal
const amount = ethers.parseEther("1.0");
const deadline = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days
const tx = await safeClub.createProposal(
  amount,
  recipientAddress,
  "Purchase equipment",
  deadline
);
await tx.wait();

// Vote
await safeClub.vote(proposalId, true); // Vote for

// Execute (after deadline)
await safeClub.executeProposal(proposalId);
```

## Best Practices

1. **Proposal Deadlines**: Set reasonable deadlines (e.g., 7 days) to allow all members time to vote
2. **Proposal Amounts**: Ensure contract has sufficient balance before creating proposals
3. **Member Management**: Regularly review and update membership list
4. **Quorum Settings**: Adjust quorum based on club size and activity level
5. **Event Monitoring**: Use events for off-chain indexing and notifications
6. **Testing**: Test proposals on testnet before mainnet deployment

