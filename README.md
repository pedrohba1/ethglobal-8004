# ERC‑8004 Agent Registries (Base Sepolia)

This repo contains a minimal ERC‑8004 setup with three on‑chain registries and a script to register agents:

- IdentityRegistry: agent ids, domain, and address; 0.005 ETH anti‑spam fee
- ReputationRegistry: server authorizes client feedback; query auth ids
- ValidationRegistry: request/response validation with expiry slots

Built with Hardhat 3 + viem + Ignition.

## Layout

- contracts/: IdentityRegistry, ReputationRegistry, ValidationRegistry
- ignition/modules/ERC8004.ts: deploys the three registries
- ignition/deployments/: saved addresses per chain (e.g. Base Sepolia 84532)
- scripts/register-agent.ts: register an agent on IdentityRegistry
- registration-files/: example 8004 agent metadata (for off‑chain hosting)

## Environment

Set RPC and keys in `.env` (Hardhat reads them via config variables):

```bash
# Base Sepolia
BASE_SEPOLIA_RPC_URL=...
SEPOLIA_PRIVATE_KEY=0x...
# Optional override for IdentityRegistry address
IDENTITY_REGISTRY=0x...

# specific for running chaoschain SDK for deploying 
# to the 8004:
PRIVATE_KEY=
PINATA_JWT=

```




## Deploy (Ignition)

Deploy the ERC‑8004 module locally or to Base Sepolia:

```bash
# Local (simulated)
npx hardhat ignition deploy ignition/modules/ERC8004.ts

# Base Sepolia
auth npx hardhat ignition deploy --network base_sepolia ignition/modules/ERC8004.ts
```

Deployed addresses are saved to `ignition/deployments/chain-<chainId>/deployed_addresses.json` and are auto‑discovered by the scripts.

Current Base Sepolia (84532) addresses in this repo:

- IdentityRegistry: 0xE6b26308a835F02D23b5bD8De69Cda1D3b05c320
- ReputationRegistry: 0x15D7Ba71AEd52e021A9BE50B57c02dA49A108A58
- ValidationRegistry: 0xFc9d2d3E7A84bc05387F1Ac683976b727D675D8C

## Register an Agent

The script registers a new agent in IdentityRegistry on Base Sepolia. It resolves the registry address from Ignition for the connected chain, or you can pass `IDENTITY_REGISTRY`.

Fee: 0.005 ETH (burned by the contract).

```bash
npx hardhat run scripts/register-agent.ts -- <agentDomain> <agentAddress>
# Example:
# npx hardhat run scripts/register-agent.ts -- https://example.com/.well-known/agent.json 0xYourAgentEOA
```

Notes:

- Network is forced to `base_sepolia` inside the script
- Requires the signer in `SEPOLIA_PRIVATE_KEY` to have ETH on Base Sepolia
- Looks for `ignition/deployments/chain-84532/deployed_addresses.json` by default

## 8004 Contract Link

Add your block explorer link for the live 8004 IdentityRegistry here:

- TODO: link to IdentityRegistry on Base Sepolia explorer

## Tests

```bash
npx hardhat test
```

## Extras

- `scripts/chaoschain-deploy-warren.ts`: example end‑to‑end flow using @chaoschain/sdk (optional, requires PRIVATE_KEY and optional PINATA_JWT)
- `scripts/send-op-tx.ts`: example of sending a tx on an OP‑typed simulated network
