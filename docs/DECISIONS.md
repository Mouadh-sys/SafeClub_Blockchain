# Design Decisions and Assumptions

This document outlines the key design decisions and assumptions made during the implementation of SafeClub.

## Assumptions

### 1. Proposal Amount Validation at Creation
**Decision**: Proposals must have `amount <= address(this).balance` at creation time.

**Rationale**: This prevents proposals that cannot be executed due to insufficient funds, improving UX and avoiding frustration. It also prevents gaming where proposals are created expecting future deposits.

**Alternative Considered**: Allow proposals with amounts > balance, then check only at execution. This was rejected to prevent orphaned proposals.

### 2. Quorum Calculation Method
**Decision**: Quorum is calculated using ceiling division: `ceil(membersSnapshot * quorumBps / 10000)`

**Rationale**: This ensures that fractional quorum requirements round up, preventing edge cases where quorum requirements are effectively lowered due to rounding down.

**Implementation**: `(membersSnapshot * quorumBps + 9999) / 10000` provides ceiling division.

### 3. Member Snapshot at Proposal Creation
**Decision**: The member count is snapshotted when a proposal is created (`membersSnapshot`).

**Rationale**: This ensures fairness - the quorum requirement is fixed based on the membership at proposal time, preventing manipulation where members are added/removed to affect quorum calculations.

**Impact**: If a member is removed after voting on a proposal, their vote still counts, but they cannot vote on new proposals. This is the expected behavior.

### 4. Proposal IDs Start at 0
**Decision**: Proposal IDs are sequential starting from 0.

**Rationale**: Simple, predictable, and easy to iterate. First proposal is ID 0, second is ID 1, etc.

### 5. Default Quorum and Majority Settings
**Decision**: Default quorum is 50% (5000 basis points), with simple majority required.

**Rationale**: 50% quorum is a common governance standard, and requiring simple majority ensures proposals have clear support. These can be changed by the owner after deployment.

### 6. Execution Access Control
**Decision**: Any member can execute an accepted proposal (not just the proposer).

**Rationale**: This prevents griefing where a proposer creates a proposal but refuses to execute it. Any member can execute once the proposal is accepted.

### 7. Voting Deadline Enforcement
**Decision**: Proposals cannot be voted on after the deadline, even if not yet executed.

**Rationale**: This provides clear separation between voting period and execution period. Once voting ends, the outcome is determined and cannot be changed by additional votes.

### 8. Reentrancy Protection Implementation
**Decision**: Use OpenZeppelin's `ReentrancyGuard` on `executeProposal` function.

**Rationale**: Standard, battle-tested protection against reentrancy attacks. The contract follows Checks-Effects-Interactions pattern regardless, but the guard provides an additional safety layer.

### 9. Custom Errors Instead of Revert Strings
**Decision**: Use Solidity custom errors throughout the contract.

**Rationale**: Custom errors save gas (no string storage) and provide clearer error handling for frontends. They are the modern best practice for Solidity 0.8.4+.

### 10. EnumerableSet for Members
**Decision**: Use OpenZeppelin's `EnumerableSet` to manage members.

**Rationale**: Provides efficient membership checks, iteration, and prevents duplicates automatically. More gas-efficient than manual array management.

## Configurable Parameters

### quorumBps
- **Type**: `uint256` (0-10000)
- **Default**: 5000 (50%)
- **Updateable**: Yes, by owner only
- **Purpose**: Determines the minimum percentage of members that must vote for a proposal to be valid.

### requireSimpleMajority
- **Type**: `bool`
- **Default**: `true`
- **Updateable**: No (set at deployment)
- **Purpose**: Whether proposals require `forVotes > againstVotes` (not just quorum).

**Note**: This parameter is not updateable after deployment. If different behavior is needed, deploy a new contract. This was a design choice to prevent governance manipulation during active proposals.

## Gas Optimization Considerations

1. **EnumerableSet Usage**: More efficient than arrays for membership checks and iteration.
2. **Custom Errors**: Save gas compared to string error messages.
3. **Packed Structs**: Proposal struct uses standard types (no packing benefit available here).
4. **View Functions**: `getProposal`, `isProposalAccepted`, etc. are view functions to save gas when reading state.

## Security Considerations

1. **No Flash Loan Attacks**: Proposals require quorum and majority, which cannot be manipulated in a single transaction.
2. **Member Snapshot**: Prevents adding/removing members to manipulate quorum on existing proposals.
3. **Balance Checks**: Both at creation and execution prevent insufficient balance scenarios.
4. **Deadline Enforcement**: Prevents execution before voting period ends and voting after deadline.

## Future Considerations

If this contract were to be extended, consider:

1. **Proposal Cancellation**: Allow proposer or owner to cancel proposals before execution.
2. **Emergency Pause**: Add pause functionality for emergency situations.
3. **Proposal Updating**: Allow proposers to update proposals before voting starts.
4. **Time-Lock**: Add a timelock between proposal acceptance and execution.
5. **Delegate Voting**: Allow members to delegate their voting power.
6. **Multi-token Support**: Extend to support ERC20 tokens in addition to ETH.

