import { network } from "hardhat";

// Connects to the currently selected Hardhat network (configure Base in hardhat.config.ts or pass --network)
const { viem } = await network.connect();

const publicClient = await viem.getPublicClient();
const [deployer] = await viem.getWalletClients();

console.log("Network:", await publicClient.getChainId());
console.log("Deployer:", deployer.account.address);

console.log("Deploying IdentityRegistry...");
const identity = await viem.deployContract("IdentityRegistry");
console.log("IdentityRegistry deployed at:", identity.address);

console.log("Deploying ReputationRegistry...");
const reputation = await viem.deployContract("ReputationRegistry", [identity.address]);
console.log("ReputationRegistry deployed at:", reputation.address);

console.log("Deploying ValidationRegistry...");
const validation = await viem.deployContract("ValidationRegistry", [identity.address]);
console.log("ValidationRegistry deployed at:", validation.address);

console.log("Deployment complete:");
console.log(JSON.stringify({
  network: "base",
  chainId: await publicClient.getChainId(),
  deployer: deployer.account.address,
  IdentityRegistry: identity.address,
  ReputationRegistry: reputation.address,
  ValidationRegistry: validation.address,
}, null, 2));
