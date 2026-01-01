import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Deploying SafeClub contract...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Configuration
  const owner = deployer.address;
  const quorumBps = 5000; // 50%
  const requireSimpleMajority = true;

  // Deploy contract
  const SafeClubFactory = await ethers.getContractFactory("SafeClub");
  const safeClub = await SafeClubFactory.deploy(owner, quorumBps, requireSimpleMajority);
  await safeClub.waitForDeployment();

  const address = await safeClub.getAddress();
  console.log("SafeClub deployed to:", address);
  console.log("Owner:", owner);
  console.log("Quorum:", quorumBps, "bps (", quorumBps / 100, "%)");
  console.log("Require Simple Majority:", requireSimpleMajority, "\n");

  // Optionally add initial members from env
  const initialMembersEnv = process.env.INITIAL_MEMBERS;
  if (initialMembersEnv) {
    const initialMembers = initialMembersEnv.split(",").map((addr) => addr.trim());
    console.log("Adding initial members:", initialMembers.length);
    
    for (const member of initialMembers) {
      if (ethers.isAddress(member)) {
        try {
          const tx = await safeClub.addMember(member);
          await tx.wait();
          console.log("  ✓ Added member:", member);
        } catch (error) {
          console.log("  ✗ Failed to add member:", member, error);
        }
      } else {
        console.log("  ✗ Invalid address:", member);
      }
    }
    console.log();
  }

  console.log("Deployment complete!");
  console.log("\nNext steps:");
  console.log("  1. Fund the contract: send ETH to", address);
  console.log("  2. Add members: safeClub.addMember(address)");
  console.log("  3. Create proposals: safeClub.createProposal(...)");
  console.log("  4. Run demo: npm run demo");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
