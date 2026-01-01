import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEtherSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { SafeClub, ReenteringReceiver } from "../typechain-types";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("SafeClub", function () {
  let safeClub: SafeClub;
  let owner: HardhatEtherSigner;
  let member1: HardhatEtherSigner;
  let member2: HardhatEtherSigner;
  let member3: HardhatEtherSigner;
  let nonMember: HardhatEtherSigner;
  let recipient: HardhatEtherSigner;

  const DEFAULT_QUORUM_BPS = 5000; // 50%
  const DEFAULT_AMOUNT = ethers.parseEther("1.0");
  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days

  beforeEach(async function () {
    [owner, member1, member2, member3, nonMember, recipient] =
      await ethers.getSigners();

    const SafeClubFactory = await ethers.getContractFactory("SafeClub");
    safeClub = await SafeClubFactory.deploy(
      owner.address,
      DEFAULT_QUORUM_BPS,
      true
    );
    await safeClub.waitForDeployment();

    // Add initial members
    await safeClub.connect(owner).addMember(member1.address);
    await safeClub.connect(owner).addMember(member2.address);
    await safeClub.connect(owner).addMember(member3.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await safeClub.owner()).to.equal(owner.address);
    });

    it("Should set correct quorum", async function () {
      expect(await safeClub.quorumBps()).to.equal(DEFAULT_QUORUM_BPS);
    });

    it("Should set requireSimpleMajority", async function () {
      expect(await safeClub.requireSimpleMajority()).to.equal(true);
    });
  });

  describe("Membership Management", function () {
    describe("addMember", function () {
      it("Should allow owner to add a member", async function () {
        await expect(safeClub.connect(owner).addMember(nonMember.address))
          .to.emit(safeClub, "MemberAdded")
          .withArgs(nonMember.address);

        expect(await safeClub.isMember(nonMember.address)).to.equal(true);
        expect(await safeClub.memberCount()).to.equal(4);
      });

      it("Should not allow non-owner to add a member", async function () {
        await expect(
          safeClub.connect(member1).addMember(nonMember.address)
        ).to.be.revertedWithCustomError(safeClub, "OwnableUnauthorizedAccount");
      });

      it("Should not allow adding zero address", async function () {
        await expect(
          safeClub.connect(owner).addMember(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(safeClub, "ZeroAddress");
      });

      it("Should not allow adding duplicate member", async function () {
        await expect(
          safeClub.connect(owner).addMember(member1.address)
        ).to.be.revertedWithCustomError(safeClub, "AlreadyMember");
      });
    });

    describe("removeMember", function () {
      it("Should allow owner to remove a member", async function () {
        await expect(safeClub.connect(owner).removeMember(member1.address))
          .to.emit(safeClub, "MemberRemoved")
          .withArgs(member1.address);

        expect(await safeClub.isMember(member1.address)).to.equal(false);
        expect(await safeClub.memberCount()).to.equal(2);
      });

      it("Should not allow non-owner to remove a member", async function () {
        await expect(
          safeClub.connect(member1).removeMember(member2.address)
        ).to.be.revertedWithCustomError(safeClub, "OwnableUnauthorizedAccount");
      });

      it("Should not allow removing zero address", async function () {
        await expect(
          safeClub.connect(owner).removeMember(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(safeClub, "ZeroAddress");
      });

      it("Should not allow removing non-member", async function () {
        await expect(
          safeClub.connect(owner).removeMember(nonMember.address)
        ).to.be.revertedWithCustomError(safeClub, "NotMember");
      });
    });

    describe("getMembers", function () {
      it("Should return all members", async function () {
        const members = await safeClub.getMembers();
        expect(members.length).to.equal(3);
        expect(members).to.include(member1.address);
        expect(members).to.include(member2.address);
        expect(members).to.include(member3.address);
      });
    });
  });

  describe("ETH Vault", function () {
    it("Should receive ETH via receive function", async function () {
      const depositAmount = ethers.parseEther("2.0");
      await expect(
        member1.sendTransaction({
          to: await safeClub.getAddress(),
          value: depositAmount,
        })
      )
        .to.emit(safeClub, "Deposit")
        .withArgs(member1.address, depositAmount);

      expect(await safeClub.getBalance()).to.equal(depositAmount);
    });

    it("Should track balance correctly after multiple deposits", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("0.5");

      await member1.sendTransaction({
        to: await safeClub.getAddress(),
        value: amount1,
      });
      await member2.sendTransaction({
        to: await safeClub.getAddress(),
        value: amount2,
      });

      expect(await safeClub.getBalance()).to.equal(
        amount1 + amount2
      );
    });
  });

  describe("Proposal Creation", function () {
    beforeEach(async function () {
      await member1.sendTransaction({
        to: await safeClub.getAddress(),
        value: DEFAULT_AMOUNT * 2n,
      });
    });

    it("Should allow member to create proposal", async function () {
      const deadline = Number(await time.latest()) + VOTING_PERIOD;
      const description = "Test proposal";

      await expect(
        safeClub
          .connect(member1)
          .createProposal(
            DEFAULT_AMOUNT,
            recipient.address,
            description,
            deadline
          )
      )
        .to.emit(safeClub, "ProposalCreated")
        .withArgs(
          0,
          member1.address,
          DEFAULT_AMOUNT,
          recipient.address,
          description,
          deadline
        );

      const proposal = await safeClub.getProposal(0);
      expect(proposal.id).to.equal(0);
      expect(proposal.proposer).to.equal(member1.address);
      expect(proposal.amount).to.equal(DEFAULT_AMOUNT);
      expect(proposal.recipient).to.equal(recipient.address);
      expect(proposal.description).to.equal(description);
      expect(proposal.deadline).to.equal(deadline);
      expect(proposal.executed).to.equal(false);
      expect(proposal.membersSnapshot).to.equal(3);
    });

    it("Should not allow non-member to create proposal", async function () {
      const deadline = Number(await time.latest()) + VOTING_PERIOD;
      await expect(
        safeClub
          .connect(nonMember)
          .createProposal(
            DEFAULT_AMOUNT,
            recipient.address,
            "Test",
            deadline
          )
      ).to.be.revertedWithCustomError(safeClub, "NotMember");
    });

    it("Should not allow creating proposal with zero amount", async function () {
      const deadline = Number(await time.latest()) + VOTING_PERIOD;
      await expect(
        safeClub
          .connect(member1)
          .createProposal(0, recipient.address, "Test", deadline)
      ).to.be.revertedWithCustomError(safeClub, "InvalidAmount");
    });

    it("Should not allow creating proposal with zero address recipient", async function () {
      const deadline = Number(await time.latest()) + VOTING_PERIOD;
      await expect(
        safeClub
          .connect(member1)
          .createProposal(
            DEFAULT_AMOUNT,
            ethers.ZeroAddress,
            "Test",
            deadline
          )
      ).to.be.revertedWithCustomError(safeClub, "ZeroAddress");
    });

    it("Should not allow creating proposal with past deadline", async function () {
      const pastDeadline = (await time.latest()) - 1;
      await expect(
        safeClub
          .connect(member1)
          .createProposal(
            DEFAULT_AMOUNT,
            recipient.address,
            "Test",
            pastDeadline
          )
      ).to.be.revertedWithCustomError(safeClub, "InvalidDeadline");
    });

    it("Should increment proposalCount", async function () {
      const deadline = Number(await time.latest()) + VOTING_PERIOD;
      await safeClub
        .connect(member1)
        .createProposal(
          DEFAULT_AMOUNT,
          recipient.address,
          "Proposal 1",
          deadline
        );
      await safeClub
        .connect(member2)
        .createProposal(
          DEFAULT_AMOUNT,
          recipient.address,
          "Proposal 2",
          deadline
        );

      expect(await safeClub.proposalCount()).to.equal(2);
    });
  });

  describe("Voting", function () {
    let proposalId: number;
    let deadline: number;

    beforeEach(async function () {
      await member1.sendTransaction({
        to: await safeClub.getAddress(),
        value: DEFAULT_AMOUNT * 2n,
      });
      deadline = Number(await time.latest()) + VOTING_PERIOD;
      const tx = await safeClub
        .connect(member1)
        .createProposal(
          DEFAULT_AMOUNT,
          recipient.address,
          "Test proposal",
          deadline
        );
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) =>
          safeClub.interface.parseLog(log)?.name === "ProposalCreated"
      );
      proposalId = Number(await safeClub.proposalCount()) - 1;
    });

    it("Should allow member to vote for", async function () {
      await expect(safeClub.connect(member1).vote(proposalId, true))
        .to.emit(safeClub, "VoteCast")
        .withArgs(proposalId, member1.address, true, 1, 0);

      const proposal = await safeClub.getProposal(proposalId);
      expect(proposal.forVotes).to.equal(1);
      expect(proposal.againstVotes).to.equal(0);
      expect(await safeClub.hasVoted(proposalId, member1.address)).to.equal(
        true
      );
    });

    it("Should allow member to vote against", async function () {
      await expect(safeClub.connect(member2).vote(proposalId, false))
        .to.emit(safeClub, "VoteCast")
        .withArgs(proposalId, member2.address, false, 0, 1);

      const proposal = await safeClub.getProposal(proposalId);
      expect(proposal.forVotes).to.equal(0);
      expect(proposal.againstVotes).to.equal(1);
    });

    it("Should not allow non-member to vote", async function () {
      await expect(
        safeClub.connect(nonMember).vote(proposalId, true)
      ).to.be.revertedWithCustomError(safeClub, "NotMember");
    });

    it("Should not allow voting twice", async function () {
      await safeClub.connect(member1).vote(proposalId, true);
      await expect(
        safeClub.connect(member1).vote(proposalId, false)
      ).to.be.revertedWithCustomError(safeClub, "AlreadyVoted");
    });

    it("Should not allow voting after deadline", async function () {
      await time.increaseTo(deadline + 1);
      await expect(
        safeClub.connect(member1).vote(proposalId, true)
      ).to.be.revertedWithCustomError(safeClub, "VotingPeriodEnded");
    });

    it("Should not allow voting on executed proposal", async function () {
      // Vote to reach quorum and majority
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);
      await safeClub.connect(member3).vote(proposalId, true);

      // Wait past deadline
      await time.increaseTo(deadline + 1);

      // Execute
      await safeClub.connect(member1).executeProposal(proposalId);

      // Try to vote on executed proposal
      await expect(
        safeClub.connect(member1).vote(proposalId, true)
      ).to.be.revertedWithCustomError(safeClub, "ProposalAlreadyExecuted");
    });

    it("Should track vote counts correctly", async function () {
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);
      await safeClub.connect(member3).vote(proposalId, false);

      const proposal = await safeClub.getProposal(proposalId);
      expect(proposal.forVotes).to.equal(2);
      expect(proposal.againstVotes).to.equal(1);
    });
  });

  describe("Proposal Execution", function () {
    let proposalId: number;
    let deadline: number;

    beforeEach(async function () {
      await member1.sendTransaction({
        to: await safeClub.getAddress(),
        value: DEFAULT_AMOUNT * 2n,
      });
      deadline = Number(await time.latest()) + VOTING_PERIOD;
      const tx = await safeClub
        .connect(member1)
        .createProposal(
          DEFAULT_AMOUNT,
          recipient.address,
          "Test proposal",
          deadline
        );
      proposalId = Number(await safeClub.proposalCount()) - 1;
    });

    it("Should execute accepted proposal after deadline", async function () {
      // Vote to reach quorum and majority (2 for, 1 against = majority)
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);

      // Wait past deadline
      await time.increaseTo(deadline + 1);

      const recipientBalanceBefore = await ethers.provider.getBalance(
        recipient.address
      );
      const contractBalanceBefore = await safeClub.getBalance();

      await expect(
        safeClub.connect(member1).executeProposal(proposalId)
      )
        .to.emit(safeClub, "ProposalExecuted")
        .withArgs(proposalId, recipient.address, DEFAULT_AMOUNT);

      const proposal = await safeClub.getProposal(proposalId);
      expect(proposal.executed).to.equal(true);

      const recipientBalanceAfter = await ethers.provider.getBalance(
        recipient.address
      );
      const contractBalanceAfter = await safeClub.getBalance();

      expect(recipientBalanceAfter - recipientBalanceBefore).to.equal(
        DEFAULT_AMOUNT
      );
      expect(contractBalanceBefore - contractBalanceAfter).to.equal(
        DEFAULT_AMOUNT
      );
    });

    it("Should not execute before deadline", async function () {
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);

      // Try to execute before deadline
      await expect(
        safeClub.connect(member1).executeProposal(proposalId)
      ).to.be.revertedWithCustomError(safeClub, "InvalidDeadline");
    });

    it("Should not execute if not accepted (insufficient quorum)", async function () {
      // Only 1 vote, quorum requires 2 (50% of 3)
      await safeClub.connect(member1).vote(proposalId, true);

      await time.increaseTo(deadline + 1);

      await expect(
        safeClub.connect(member1).executeProposal(proposalId)
      ).to.be.revertedWithCustomError(safeClub, "ProposalNotAccepted");
    });

    it("Should not execute if not accepted (no majority)", async function () {
      // 1 for, 1 against - no majority
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, false);

      await time.increaseTo(deadline + 1);

      await expect(
        safeClub.connect(member1).executeProposal(proposalId)
      ).to.be.revertedWithCustomError(safeClub, "ProposalNotAccepted");
    });

    it("Should not execute twice", async function () {
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);

      await time.increaseTo(deadline + 1);

      await safeClub.connect(member1).executeProposal(proposalId);

      await expect(
        safeClub.connect(member1).executeProposal(proposalId)
      ).to.be.revertedWithCustomError(safeClub, "ProposalAlreadyExecuted");
    });

    it("Should not execute if insufficient balance", async function () {
      // Create proposal with amount exceeding current balance
      const excessAmount = DEFAULT_AMOUNT * 3n;
      const deadline = Number(await time.latest()) + VOTING_PERIOD;
      await safeClub
        .connect(member1)
        .createProposal(excessAmount, recipient.address, "Excess proposal", deadline);
      const proposalId = Number(await safeClub.proposalCount()) - 1;

      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);

      await time.increaseTo(deadline + 1);

      await expect(
        safeClub.connect(member1).executeProposal(proposalId)
      ).to.be.revertedWithCustomError(safeClub, "InsufficientBalance");
    });

    it("Should not allow non-member to execute", async function () {
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);

      await time.increaseTo(deadline + 1);

      await expect(
        safeClub.connect(nonMember).executeProposal(proposalId)
      ).to.be.revertedWithCustomError(safeClub, "NotMember");
    });
  });

  describe("Reentrancy Protection", function () {
    let proposalId: number;
    let deadline: number;
    let reenteringReceiver: ReenteringReceiver;

    beforeEach(async function () {
      // Deploy reentering receiver
      const ReenteringReceiverFactory =
        await ethers.getContractFactory("ReenteringReceiver");
      reenteringReceiver = await ReenteringReceiverFactory.deploy(
        await safeClub.getAddress()
      );
      await reenteringReceiver.waitForDeployment();

      await member1.sendTransaction({
        to: await safeClub.getAddress(),
        value: DEFAULT_AMOUNT * 2n,
      });
      deadline = Number(await time.latest()) + VOTING_PERIOD;
      const tx = await safeClub
        .connect(member1)
        .createProposal(
          DEFAULT_AMOUNT,
          await reenteringReceiver.getAddress(),
          "Reentrancy test",
          deadline
        );
      proposalId = Number(await safeClub.proposalCount()) - 1;
      await reenteringReceiver.setProposalId(Number(proposalId));

      // Vote to accept
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);
      await time.increaseTo(deadline + 1);
    });

    it("Should prevent reentrancy attack", async function () {
      const contractBalanceBefore = await safeClub.getBalance();
      const receiverBalanceBefore = await ethers.provider.getBalance(
        await reenteringReceiver.getAddress()
      );

      // Execute proposal - should succeed once
      await safeClub.connect(member1).executeProposal(proposalId);

      const contractBalanceAfter = await safeClub.getBalance();
      const receiverBalanceAfter = await ethers.provider.getBalance(
        await reenteringReceiver.getAddress()
      );

      // Should have transferred exactly the proposal amount
      expect(receiverBalanceAfter - receiverBalanceBefore).to.equal(
        DEFAULT_AMOUNT
      );
      expect(contractBalanceBefore - contractBalanceAfter).to.equal(
        DEFAULT_AMOUNT
      );

      // Verify proposal is executed (reentrancy was blocked)
      const proposal = await safeClub.getProposal(proposalId);
      expect(proposal.executed).to.equal(true);
    });
  });

  describe("Decision Rule", function () {
    let proposalId: number;
    let deadline: number;

    beforeEach(async function () {
      await member1.sendTransaction({
        to: await safeClub.getAddress(),
        value: DEFAULT_AMOUNT * 2n,
      });
      deadline = Number(await time.latest()) + VOTING_PERIOD;
      const tx = await safeClub
        .connect(member1)
        .createProposal(
          DEFAULT_AMOUNT,
          recipient.address,
          "Quorum test",
          deadline
        );
      proposalId = Number(await safeClub.proposalCount()) - 1;
    });

    it("Should accept proposal with quorum and majority", async function () {
      // 2 votes for, 1 against = quorum (2 >= 2) and majority
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);
      await safeClub.connect(member3).vote(proposalId, false);

      await time.increaseTo(deadline + 1);

      expect(await safeClub.isProposalAccepted(proposalId)).to.equal(true);
    });

    it("Should reject proposal without quorum", async function () {
      // Only 1 vote, quorum requires 2
      await safeClub.connect(member1).vote(proposalId, true);

      await time.increaseTo(deadline + 1);

      expect(await safeClub.isProposalAccepted(proposalId)).to.equal(false);
    });

    it("Should reject proposal without majority (tie)", async function () {
      // 1 for, 1 against = quorum but no majority
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, false);

      await time.increaseTo(deadline + 1);

      expect(await safeClub.isProposalAccepted(proposalId)).to.equal(false);
    });

    it("Should use snapshot member count for quorum calculation", async function () {
      // Create proposal with 3 members
      const proposal = await safeClub.getProposal(proposalId);
      expect(proposal.membersSnapshot).to.equal(3);

      // Remove a member
      await safeClub.connect(owner).removeMember(member3.address);

      // Quorum should still be based on snapshot (2 votes needed)
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);

      await time.increaseTo(deadline + 1);

      expect(await safeClub.isProposalAccepted(proposalId)).to.equal(true);
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to update quorum", async function () {
      const newQuorumBps = 6000; // 60%
      await expect(safeClub.connect(owner).setQuorumBps(newQuorumBps))
        .to.emit(safeClub, "QuorumUpdated")
        .withArgs(DEFAULT_QUORUM_BPS, newQuorumBps);

      expect(await safeClub.quorumBps()).to.equal(newQuorumBps);
    });

    it("Should not allow non-owner to update quorum", async function () {
      await expect(
        safeClub.connect(member1).setQuorumBps(6000)
      ).to.be.revertedWithCustomError(safeClub, "OwnableUnauthorizedAccount");
    });

    it("Should not allow quorum > 100%", async function () {
      await expect(
        safeClub.connect(owner).setQuorumBps(10001)
      ).to.be.revertedWithCustomError(safeClub, "InvalidProposal");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple proposals correctly", async function () {
      await member1.sendTransaction({
        to: await safeClub.getAddress(),
        value: DEFAULT_AMOUNT * 5n,
      });

      const deadline = Number(await time.latest()) + VOTING_PERIOD;

      // Create multiple proposals
      await safeClub
        .connect(member1)
        .createProposal(
          DEFAULT_AMOUNT,
          recipient.address,
          "Proposal 1",
          deadline
        );
      await safeClub
        .connect(member2)
        .createProposal(
          DEFAULT_AMOUNT,
          recipient.address,
          "Proposal 2",
          deadline
        );

      expect(await safeClub.proposalCount()).to.equal(2);

      const proposal0 = await safeClub.getProposal(0);
      const proposal1 = await safeClub.getProposal(1);

      expect(proposal0.id).to.equal(0);
      expect(proposal1.id).to.equal(1);
      expect(proposal0.proposer).to.equal(member1.address);
      expect(proposal1.proposer).to.equal(member2.address);
    });

    it("Should handle member removal during voting period", async function () {
      await member1.sendTransaction({
        to: await safeClub.getAddress(),
        value: DEFAULT_AMOUNT * 2n,
      });

      const deadline = Number(await time.latest()) + VOTING_PERIOD;
      await safeClub
        .connect(member1)
        .createProposal(
          DEFAULT_AMOUNT,
          recipient.address,
          "Test",
          deadline
        );
      const proposalId = Number(await safeClub.proposalCount()) - 1;

      // Member3 votes
      await safeClub.connect(member3).vote(proposalId, true);

      // Owner removes member3
      await safeClub.connect(owner).removeMember(member3.address);

      // Member3 cannot vote anymore since they were removed (existing vote still counts)
      await expect(
        safeClub.connect(member3).vote(proposalId, false)
      ).to.be.revertedWithCustomError(safeClub, "NotMember");

      // Remaining members can still vote
      await safeClub.connect(member1).vote(proposalId, true);
      await safeClub.connect(member2).vote(proposalId, true);

      await time.increaseTo(deadline + 1);

      // Proposal should execute (3 votes total, 3 for)
      await safeClub.connect(member1).executeProposal(proposalId);
    });
  });
});





