import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { SafeClub } from "../typechain-types";

/**
 * Demo scenario script that demonstrates the full SafeClub workflow:
 * 1. Deposit funds
 * 2. Create proposal
 * 3. Multiple member votes (for/against)
 * 4. Wait/advance time past deadline
 * 5. Execute accepted proposal
 */
async function main() {
  console.log("=== SafeClub Demo Scenario ===\n");

  const [owner, member1, member2, member3, recipient] = await ethers.getSigners();

  console.log("Accounts:");
  console.log("  Owner:", owner.address);
  console.log("  Member 1:", member1.address);
  console.log("  Member 2:", member2.address);
  console.log("  Member 3:", member3.address);
  console.log("  Recipient:", recipient.address);
  console.log();

  // Deploy contract
  console.log("1. Deploying SafeClub contract...");
  const SafeClubFactory = await ethers.getContractFactory("SafeClub");
  const safeClub: SafeClub = await SafeClubFactory.deploy(
    owner.address,
    5000, // 50% quorum
    true  // require simple majority
  );
  await safeClub.waitForDeployment();
  const contractAddress = await safeClub.getAddress();
  console.log("   ✓ Contract deployed at:", contractAddress);
  console.log();

  // Add members
  console.log("2. Adding members...");
  let tx = await safeClub.connect(owner).addMember(member1.address);
  await tx.wait();
  console.log("   ✓ Added member 1");
  
  tx = await safeClub.connect(owner).addMember(member2.address);
  await tx.wait();
  console.log("   ✓ Added member 2");
  
  tx = await safeClub.connect(owner).addMember(member3.address);
  await tx.wait();
  console.log("   ✓ Added member 3");
  
  const memberCount = await safeClub.memberCount();
  console.log("   Total members:", memberCount.toString());
  console.log();

  // Deposit funds
  console.log("3. Depositing funds to contract...");
  const depositAmount = ethers.parseEther("10.0");
  tx = await owner.sendTransaction({
    to: contractAddress,
    value: depositAmount,
  });
  await tx.wait();
  console.log("   ✓ Deposited:", ethers.formatEther(depositAmount), "ETH");
  
  const balance = await safeClub.getBalance();
  console.log("   Contract balance:", ethers.formatEther(balance), "ETH");
  console.log();

  // Create proposal
  console.log("4. Creating expense proposal...");
  const proposalAmount = ethers.parseEther("2.5");
  const description = "Purchase equipment for club activities";
  const votingPeriod = 7 * 24 * 60 * 60; // 7 days
  const deadline = (await time.latest()) + BigInt(votingPeriod);

  tx = await safeClub
    .connect(member1)
    .createProposal(proposalAmount, recipient.address, description, deadline);
  const receipt = await tx.wait();

  // Extract proposal ID from event
  const proposalCreatedEvent = receipt?.logs.find(
    (log) => safeClub.interface.parseLog(log as any)?.name === "ProposalCreated"
  );
  const parsedEvent = safeClub.interface.parseLog(proposalCreatedEvent as any);
  const proposalId = parsedEvent?.args[0];
  
  console.log("   ✓ Proposal created with ID:", proposalId?.toString());
  console.log("   Amount:", ethers.formatEther(proposalAmount), "ETH");
  console.log("   Recipient:", recipient.address);
  console.log("   Description:", description);
  console.log("   Deadline:", new Date(Number(deadline) * 1000).toLocaleString());
  console.log("   Tx hash:", receipt?.hash);
  console.log();

  // Get proposal details
  const proposal = await safeClub.getProposal(proposalId);
  console.log("   Proposal details:");
  console.log("     Members snapshot:", proposal.membersSnapshot.toString());
  console.log("     For votes:", proposal.forVotes.toString());
  console.log("     Against votes:", proposal.againstVotes.toString());
  console.log("     Executed:", proposal.executed);
  console.log();

  // Voting
  console.log("5. Voting on proposal...");
  
  console.log("   Member 1 voting FOR...");
  tx = await safeClub.connect(member1).vote(proposalId, true);
  receipt = await tx.wait();
  console.log("     ✓ Vote cast, tx hash:", receipt?.hash);
  
  console.log("   Member 2 voting FOR...");
  tx = await safeClub.connect(member2).vote(proposalId, true);
  receipt = await tx.wait();
  console.log("     ✓ Vote cast, tx hash:", receipt?.hash);
  
  console.log("   Member 3 voting AGAINST...");
  tx = await safeClub.connect(member3).vote(proposalId, false);
  receipt = await tx.wait();
  console.log("     ✓ Vote cast, tx hash:", receipt?.hash);
  
  // Check vote counts
  const proposalAfterVoting = await safeClub.getProposal(proposalId);
  console.log();
  console.log("   Vote summary:");
  console.log("     For votes:", proposalAfterVoting.forVotes.toString());
  console.log("     Against votes:", proposalAfterVoting.againstVotes.toString());
  console.log("     Total votes:", (proposalAfterVoting.forVotes + proposalAfterVoting.againstVotes).toString());
  
  // Check if proposal is accepted
  const isAccepted = await safeClub.isProposalAccepted(proposalId);
  console.log("     Proposal accepted:", isAccepted);
  console.log();

  // Advance time past deadline
  console.log("6. Advancing time past deadline...");
  const currentTime = await time.latest();
  console.log("   Current time:", new Date(Number(currentTime) * 1000).toLocaleString());
  await time.increaseTo(deadline + 1n);
  const newTime = await time.latest();
  console.log("   New time:", new Date(Number(newTime) * 1000).toLocaleString());
  console.log("   ✓ Time advanced");
  console.log();

  // Execute proposal
  console.log("7. Executing proposal...");
  const recipientBalanceBefore = await ethers.provider.getBalance(recipient.address);
  const contractBalanceBefore = await safeClub.getBalance();
  
  console.log("   Recipient balance before:", ethers.formatEther(recipientBalanceBefore), "ETH");
  console.log("   Contract balance before:", ethers.formatEther(contractBalanceBefore), "ETH");
  
  tx = await safeClub.connect(member1).executeProposal(proposalId);
  receipt = await tx.wait();
  console.log("   ✓ Proposal executed, tx hash:", receipt?.hash);
  
  const recipientBalanceAfter = await ethers.provider.getBalance(recipient.address);
  const contractBalanceAfter = await safeClub.getBalance();
  
  console.log("   Recipient balance after:", ethers.formatEther(recipientBalanceAfter), "ETH");
  console.log("   Contract balance after:", ethers.formatEther(contractBalanceAfter), "ETH");
  
  const transferred = recipientBalanceAfter - recipientBalanceBefore;
  console.log("   ✓ Transferred:", ethers.formatEther(transferred), "ETH");
  console.log();

  // Final state
  const finalProposal = await safeClub.getProposal(proposalId);
  console.log("8. Final proposal state:");
  console.log("   Executed:", finalProposal.executed);
  console.log("   For votes:", finalProposal.forVotes.toString());
  console.log("   Against votes:", finalProposal.againstVotes.toString());
  console.log();

  console.log("=== Demo Scenario Complete ===");
  console.log("\nSummary:");
  console.log("  ✓ Contract deployed");
  console.log("  ✓ Members added");
  console.log("  ✓ Funds deposited");
  console.log("  ✓ Proposal created");
  console.log("  ✓ Votes cast (2 for, 1 against)");
  console.log("  ✓ Proposal executed successfully");
  console.log("  ✓ Funds transferred to recipient");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
