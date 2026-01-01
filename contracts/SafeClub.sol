// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/**
 * @title SafeClub
 * @dev Secure treasury contract for student club governance on Ethereum
 * @notice Members can create expense proposals, vote on them, and execute accepted proposals
 */
contract SafeClub is Ownable, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

    // ============ Structs ============

    /**
     * @dev Proposal structure storing all proposal data
     */
    struct Proposal {
        uint256 id;
        address proposer;
        uint256 amount;
        address payable recipient;
        string description;
        uint256 deadline;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        uint256 membersSnapshot; // Member count at proposal creation
    }

    // ============ State Variables ============

    /// @dev Set of member addresses
    EnumerableSet.AddressSet private _members;

    /// @dev Mapping from proposal ID to Proposal struct
    mapping(uint256 => Proposal) public proposals;

    /// @dev Mapping from proposal ID => member address => has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @dev Total number of proposals created
    uint256 public proposalCount;

    /// @dev Quorum threshold in basis points (e.g., 5000 = 50%)
    uint256 public quorumBps;

    /// @dev Whether to require simple majority (forVotes > againstVotes)
    bool public requireSimpleMajority;

    // ============ Events ============

    event MemberAdded(address indexed member);
    event MemberRemoved(address indexed member);
    event Deposit(address indexed from, uint256 amount);
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 amount,
        address recipient,
        string description,
        uint256 deadline
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 forVotes,
        uint256 againstVotes
    );
    event ProposalExecuted(
        uint256 indexed proposalId,
        address indexed recipient,
        uint256 amount
    );
    event QuorumUpdated(uint256 oldQuorumBps, uint256 newQuorumBps);

    // ============ Custom Errors ============

    error ZeroAddress();
    error NotMember();
    error AlreadyMember();
    error ProposalNotFound();
    error ProposalAlreadyExecuted();
    error InvalidProposal(uint256 proposalId);
    error InvalidAmount();
    error InvalidDeadline();
    error VotingPeriodEnded();
    error AlreadyVoted();
    error ExecutionFailed();
    error InsufficientBalance();
    error ProposalNotAccepted();

    // ============ Modifiers ============

    /**
     * @dev Modifier to check if caller is a member
     */
    modifier onlyMember() {
        if (!_members.contains(msg.sender)) {
            revert NotMember();
        }
        _;
    }

    // ============ Constructor ============

    /**
     * @dev Constructor initializes the contract with owner and quorum settings
     * @param _quorumBps Initial quorum threshold in basis points (default 5000 = 50%)
     * @param _requireSimpleMajority Whether to require simple majority (default true)
     */
    constructor(
        address _owner,
        uint256 _quorumBps,
        bool _requireSimpleMajority
    ) Ownable(_owner) {
        if (_quorumBps > 10000) {
            revert InvalidProposal(0);
        }
        quorumBps = _quorumBps;
        requireSimpleMajority = _requireSimpleMajority;
    }

    // ============ Receive Function ============

    /**
     * @dev Allows the contract to receive ETH
     */
    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    // ============ Membership Management ============

    /**
     * @dev Add a new member (owner only)
     * @param member Address to add as member
     */
    function addMember(address member) external onlyOwner {
        if (member == address(0)) {
            revert ZeroAddress();
        }
        if (_members.contains(member)) {
            revert AlreadyMember();
        }
        _members.add(member);
        emit MemberAdded(member);
    }

    /**
     * @dev Remove a member (owner only)
     * @param member Address to remove from members
     */
    function removeMember(address member) external onlyOwner {
        if (member == address(0)) {
            revert ZeroAddress();
        }
        if (!_members.contains(member)) {
            revert NotMember();
        }
        _members.remove(member);
        emit MemberRemoved(member);
    }

    /**
     * @dev Check if an address is a member
     * @param member Address to check
     * @return True if member, false otherwise
     */
    function isMember(address member) external view returns (bool) {
        return _members.contains(member);
    }

    /**
     * @dev Get all member addresses
     * @return Array of member addresses
     */
    function getMembers() external view returns (address[] memory) {
        return _members.values();
    }

    /**
     * @dev Get the total number of members
     * @return Number of members
     */
    function memberCount() external view returns (uint256) {
        return _members.length();
    }

    // ============ Proposal Management ============

    /**
     * @dev Create a new expense proposal (members only)
     * @param amount Amount of ETH to transfer
     * @param recipient Address to receive the ETH
     * @param description Description of the proposal
     * @param deadline Timestamp when voting period ends
     * @return proposalId The ID of the created proposal
     */
    function createProposal(
        uint256 amount,
        address payable recipient,
        string calldata description,
        uint256 deadline
    ) external onlyMember returns (uint256) {
        if (amount == 0) {
            revert InvalidAmount();
        }
        if (recipient == address(0)) {
            revert ZeroAddress();
        }
        if (deadline <= block.timestamp) {
            revert InvalidDeadline();
        }
        // Note: Balance check moved to execution time to allow proposing amounts larger than current balance

        uint256 proposalId = proposalCount;
        uint256 membersSnapshot = _members.length();

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            amount: amount,
            recipient: recipient,
            description: description,
            deadline: deadline,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            membersSnapshot: membersSnapshot
        });

        proposalCount++;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            amount,
            recipient,
            description,
            deadline
        );

        return proposalId;
    }

    /**
     * @dev Get proposal details
     * @param proposalId ID of the proposal
     * @return Proposal struct with all fields
     */
    function getProposal(
        uint256 proposalId
    ) external view returns (Proposal memory) {
        if (proposalId >= proposalCount) {
            revert ProposalNotFound();
        }
        return proposals[proposalId];
    }

    // ============ Voting ============

    /**
     * @dev Vote on a proposal (members only)
     * @param proposalId ID of the proposal
     * @param support True for "for", false for "against"
     */
    function vote(uint256 proposalId, bool support) external onlyMember {
        if (proposalId >= proposalCount) {
            revert ProposalNotFound();
        }

        Proposal storage proposal = proposals[proposalId];

        if (proposal.executed) {
            revert ProposalAlreadyExecuted();
        }
        if (block.timestamp >= proposal.deadline) {
            revert VotingPeriodEnded();
        }
        if (hasVoted[proposalId][msg.sender]) {
            revert AlreadyVoted();
        }

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            proposal.forVotes++;
        } else {
            proposal.againstVotes++;
        }

        emit VoteCast(
            proposalId,
            msg.sender,
            support,
            proposal.forVotes,
            proposal.againstVotes
        );
    }

    // ============ Execution ============

    /**
     * @dev Execute an accepted proposal (members only)
     * @param proposalId ID of the proposal to execute
     */
    function executeProposal(
        uint256 proposalId
    ) external onlyMember nonReentrant {
        if (proposalId >= proposalCount) {
            revert ProposalNotFound();
        }

        Proposal storage proposal = proposals[proposalId];

        if (proposal.executed) {
            revert ProposalAlreadyExecuted();
        }
        if (block.timestamp < proposal.deadline) {
            revert InvalidDeadline(); // Voting period not ended
        }

        // Check if proposal is accepted
        if (!_isProposalAccepted(proposal)) {
            revert ProposalNotAccepted();
        }

        // Check balance at execution time
        if (proposal.amount > address(this).balance) {
            revert InsufficientBalance();
        }

        // Mark as executed BEFORE external call (Checks-Effects-Interactions)
        proposal.executed = true;

        // Transfer ETH to recipient
        (bool success, ) = proposal.recipient.call{value: proposal.amount}("");
        if (!success) {
            revert ExecutionFailed();
        }

        emit ProposalExecuted(proposalId, proposal.recipient, proposal.amount);
    }

    /**
     * @dev Internal function to check if a proposal is accepted
     * @param proposal Proposal to check
     * @return True if accepted, false otherwise
     */
    function _isProposalAccepted(
        Proposal memory proposal
    ) internal view returns (bool) {
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 quorumRequired = (proposal.membersSnapshot * quorumBps + 9999) /
            10000; // Ceiling division

        // Check quorum
        if (totalVotes < quorumRequired) {
            return false;
        }

        // Check simple majority if required
        if (requireSimpleMajority) {
            return proposal.forVotes > proposal.againstVotes;
        }

        // If simple majority not required, any quorum-passing proposal is accepted
        return true;
    }

    /**
     * @dev Check if a proposal would be accepted (view function)
     * @param proposalId ID of the proposal
     * @return True if proposal would be accepted, false otherwise
     */
    function isProposalAccepted(
        uint256 proposalId
    ) external view returns (bool) {
        if (proposalId >= proposalCount) {
            revert ProposalNotFound();
        }
        return _isProposalAccepted(proposals[proposalId]);
    }

    // ============ Configuration ============

    /**
     * @dev Update quorum threshold (owner only)
     * @param newQuorumBps New quorum threshold in basis points (0-10000)
     */
    function setQuorumBps(uint256 newQuorumBps) external onlyOwner {
        if (newQuorumBps > 10000) {
            revert InvalidProposal(0);
        }
        uint256 oldQuorumBps = quorumBps;
        quorumBps = newQuorumBps;
        emit QuorumUpdated(oldQuorumBps, newQuorumBps);
    }

    // ============ Utility Functions ============

    /**
     * @dev Get contract balance
     * @return Balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
