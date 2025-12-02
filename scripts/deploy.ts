import { ethers } from "hardhat";

async function main() {
  console.log("Deploying CeloColombiaFaucet...");

  // cCOP token address on Alfajores
  const CCOP_TOKEN_ADDRESS = "0x5F8d55c3627d2dc0a2B4afa798f877242F382F67";

  // Get the deployer address
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get the verifier address from env or use deployer
  const verifierAddress = process.env.VERIFIER_ADDRESS || deployer.address;
  console.log("Verifier address:", verifierAddress);

  // Deploy the contract
  const CeloFaucet = await ethers.getContractFactory("CeloColombiaFaucet");
  const faucet = await CeloFaucet.deploy(CCOP_TOKEN_ADDRESS, verifierAddress);

  await faucet.waitForDeployment();

  const faucetAddress = await faucet.getAddress();
  console.log("CeloColombiaFaucet deployed to:", faucetAddress);

  console.log("\nNext steps:");
  console.log("1. Fund the faucet with CELO:");
  console.log(`   Send CELO to: ${faucetAddress}`);
  console.log("\n2. Fund the faucet with cCOP tokens:");
  console.log(`   Transfer cCOP to: ${faucetAddress}`);
  console.log("\n3. Update .env.local with:");
  console.log(`   NEXT_PUBLIC_FAUCET_CONTRACT_ADDRESS=${faucetAddress}`);
  console.log(`   VERIFIER_PRIVATE_KEY=<your_verifier_private_key>`);
  console.log("\n4. Verify the contract (optional):");
  console.log(`   npx hardhat verify --network alfajores ${faucetAddress} "${CCOP_TOKEN_ADDRESS}" "${verifierAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
