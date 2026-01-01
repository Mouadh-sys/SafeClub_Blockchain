// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./SafeClub.sol";

/**
 * @title ReenteringReceiver
 * @dev Test helper contract that attempts reentrancy on SafeClub
 * @notice Used in tests to verify reentrancy protection
 */
contract ReenteringReceiver {
    SafeClub public safeClub;
    uint256 public proposalId;
    bool public reentered;

    constructor(address _safeClub) {
        safeClub = SafeClub(payable(_safeClub));
    }

    /**
     * @dev Set the proposal ID to reenter on
     */
    function setProposalId(uint256 _proposalId) external {
        proposalId = _proposalId;
    }

    /**
     * @dev Receive function that attempts reentrancy
     */
    receive() external payable {
        if (!reentered && proposalId != 0) {
            reentered = true;
            // Attempt to reenter - this should be blocked by ReentrancyGuard
            try safeClub.executeProposal(proposalId) {} catch {}
        }
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        if (!reentered && proposalId != 0) {
            reentered = true;
            try safeClub.executeProposal(proposalId) {} catch {}
        }
    }
}
