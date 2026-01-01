# UI Design Decisions

## Proposal Tuple Structure

The UI assumes the `getProposal(uint256)` function returns a tuple in this order:
1. `amount` (uint256) - ETH amount in wei
2. `recipient` (address) - Payment destination
3. `description` (string) - Expense description
4. `deadline` (uint256) - Unix timestamp for voting deadline
5. `executed` (bool) - Whether the proposal has been executed
6. `forVotes` (uint256) - Number of votes in favor
7. `againstVotes` (uint256) - Number of votes against
8. `membersSnapshot` (uint256) - Number of members at proposal creation

If your contract returns fields in a different order, update the destructuring in `src/hooks/useSafeClub.ts`.

## Vote Status Detection

The UI uses the `hasVoted(proposalId, voter)` contract function to check if a user has already voted. 

**Fallback behavior**: If the contract doesn't have this function, the UI will:
1. Fail silently on the check
2. Allow the user to attempt voting
3. The contract will revert if they've already voted
4. Display the revert error message

For better UX, implement `hasVoted` in your contract.

## Quorum Calculation

If `quorumBps()` is available on the contract, the UI calculates acceptance as:
- `quorumRequired = ceil(membersSnapshot * quorumBps / 10000)`
- Accepted if `totalVotes >= quorumRequired AND forVotes > againstVotes`

If `quorumBps()` is not available, the UI displays "Acceptance rule enforced on-chain" without attempting to compute acceptance locally.

## Optional Contract Functions

The following functions gracefully degrade if not present:
- `getMembers()` - Falls back to showing only `memberCount()`
- `quorumBps()` - Hides acceptance calculation
- `hasVoted()` - Allows voting attempts, relies on contract reverts

## Deposit Functionality

Depositing ETH is done by sending a raw transaction to the contract address. This assumes the contract has a `receive()` function or fallback that accepts ETH.

## Settings Persistence

Settings are stored in localStorage under the key `safeclub_settings`. Environment variables serve as defaults but localStorage values take precedence.

## Chain Switching

The UI detects chain changes via MetaMask events but does NOT automatically switch chains. Users must manually switch to the correct network in MetaMask.

## Error Handling

Contract errors are displayed as-is when possible. The UI attempts to extract revert reasons from errors but falls back to generic messages if parsing fails.
