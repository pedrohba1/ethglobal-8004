import { network } from "hardhat";
import { parseEther } from "viem";
import { readFile } from "node:fs/promises";
import path from "node:path";

async function resolveIdentityFromIgnition(chainId: number): Promise<string | undefined> {
  try {
    const p = path.join(
      process.cwd(),
      "ignition",
      "deployments",
      `chain-${chainId}`,
      "deployed_addresses.json",
    );
    const raw = await readFile(p, "utf8");
    const json = JSON.parse(raw) as Record<string, string>;
    return json["ERC8004Module#IdentityRegistry"];
  } catch {
    return undefined;
  }
}

function isHexAddress(v: string | undefined): v is `0x${string}` {
  return !!v && /^0x[0-9a-fA-F]{40}$/.test(v);
}

// Usage:
//   npx hardhat run scripts/register-agent.ts -- <agentDomain> <agentAddress>
// Notes:
//   - Network is forced to base_sepolia inside the script
//   - IdentityRegistry is auto-resolved from Ignition for the connected chain
//   - Or set env: IDENTITY_REGISTRY=0x...
const argv = process.argv.slice(2);
const ddIndex = argv.indexOf("--");
const pos = ddIndex >= 0 ? argv.slice(ddIndex + 1) : argv;

const agentDomain = pos[0];
const agentAddress = pos[1];

if (!agentDomain || !isHexAddress(agentAddress)) {
  console.error(
    "Usage: npx hardhat run scripts/register-agent.ts -- <agentDomain> <agentAddress>",
  );
  process.exit(1);
}

// Connect specifically to base_sepolia
const { viem } = await network.connect({ network: "base_sepolia" });
const publicClient = await viem.getPublicClient();
const [signer] = await viem.getWalletClients();

const chainId = await publicClient.getChainId();

let identityAddress: string | undefined = process.env.IDENTITY_REGISTRY;
if (!identityAddress) {
  identityAddress = await resolveIdentityFromIgnition(chainId);
}

if (!identityAddress) {
  console.error(
    "IdentityRegistry not found. Set IDENTITY_REGISTRY env var or ensure Ignition deployment exists for this chain.",
  );
  process.exit(1);
}

console.log("Network:", chainId);
console.log("Deployer:", signer.account.address);
console.log("IdentityRegistry:", identityAddress);
console.log("Registering agent:", { agentDomain, agentAddress });

const identity = await viem.getContractAt("IdentityRegistry", identityAddress as `0x${string}`);

const REGISTRATION_FEE = parseEther("0.005");

const txHash = await identity.write.newAgent([agentDomain, agentAddress as `0x${string}`], { value: REGISTRATION_FEE });
console.log("Submitted tx:", txHash);

const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
console.log("Mined in block:", receipt.blockNumber);

try {
  const info = await identity.read.resolveByAddress([agentAddress as `0x${string}`]);
  console.log("Registered agent info:", info);
} catch {
  console.log("Registered. Could not resolve agent info immediately.");
}
