// scripts/deploy.js - Compatible with Hardhat & modern ethers.js
const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting HabitStaking contract deployment...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deployment Details:");
  console.log("Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. Make sure you have enough ETH for gas fees.");
  }

  console.log("Network:", hre.network.name);
  const network = await hre.ethers.provider.getNetwork();
  console.log("Chain ID:", network.chainId.toString());
  console.log("─".repeat(50));

  try {
    // Deploy HabitStaking contract
    console.log("\n📦 Deploying HabitStaking contract...");
    
    const HabitStaking = await hre.ethers.getContractFactory("HabitStaking");
    
    // Get current gas price
    const feeData = await hre.ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice;
    
    console.log("Gas price:", hre.ethers.formatUnits(gasPrice, "gwei"), "gwei");

    // Deploy the contract
    const habitStaking = await HabitStaking.deploy();
    
    console.log("⏳ Waiting for deployment transaction...");
    await habitStaking.waitForDeployment();

    const contractAddress = await habitStaking.getAddress();
    console.log("\n✅ Contract deployed successfully!");
    console.log("Contract address:", contractAddress);
    console.log("Transaction hash:", habitStaking.deploymentTransaction().hash);
    
    // Get deployment receipt for gas used
    const receipt = await habitStaking.deploymentTransaction().wait();
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("Actual cost:", hre.ethers.formatEther(receipt.gasUsed * gasPrice), "ETH");

    // Verify contract constants
    console.log("\n📊 Contract Constants Verification:");
    const maxStake = await habitStaking.MAX_STAKE_AMOUNT();
    const minSessionFee = await habitStaking.MIN_SESSION_FEE();
    const maxHabitReward = await habitStaking.MAX_HABIT_REWARD();

    console.log("Max stake amount:", hre.ethers.formatEther(maxStake), "tokens");
    console.log("Min session fee:", hre.ethers.formatEther(minSessionFee), "tokens");
    console.log("Max habit reward:", hre.ethers.formatEther(maxHabitReward), "tokens");

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      chainId: network.chainId.toString(),
      contractAddress: contractAddress,
      deployer: deployer.address,
      deployedAt: new Date().toISOString(),
      transactionHash: habitStaking.deploymentTransaction().hash,
      gasUsed: receipt.gasUsed.toString(),
      constants: {
        maxStakeAmount: maxStake.toString(),
        minSessionFee: minSessionFee.toString(),
        maxHabitReward: maxHabitReward.toString()
      }
    };

    // Write deployment info to file
    const fs = require('fs');
    const path = require('path');
    
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}-deployment.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

    // Contract verification reminder
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("\n🔍 Contract Verification:");
      console.log("To verify the contract on block explorer, run:");
      console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("─".repeat(50));

    return {
      contract: habitStaking,
      address: contractAddress,
      deploymentInfo
    };

  } catch (error) {
    console.error("\n❌ Deployment failed:");
    console.error("Error message:", error.message);
    
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error("💡 Solution: Add more ETH to your deployer account");
    }
    
    if (error.message.includes("HH404")) {
      console.error("💡 Solution: Install OpenZeppelin contracts:");
      console.error("npm install @openzeppelin/contracts");
    }
    
    console.error("\nFull error details:");
    console.error(error);
    
    process.exit(1);
  }
}

// Function to setup initial data (optional)
async function setupInitialData(contractAddress) {
  console.log("\n🔧 Setting up initial data...");
  
  const habitStaking = await hre.ethers.getContractAt("HabitStaking", contractAddress);
  
  // You can add initial setup here, such as:
  // - Registering initial therapists
  // - Setting up test data for development
  
  console.log("✅ Initial setup completed!");
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main, setupInitialData };