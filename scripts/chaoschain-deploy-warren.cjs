/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv/config');

const {
  ChaosChainSDK,
  NetworkConfig,
  AgentRole,
  PinataStorage,
} = require('@chaoschain/sdk');

// ---- utils ----
const mask = (v) => (typeof v === 'string' && v.length > 10 ? `${v.slice(0, 4)}…${v.slice(-6)}` : (v ? '<set>' : '<unset>'));
const toJSON = (v) => {
  try {
    return JSON.stringify(v, (k, val) => (typeof val === 'bigint' ? val.toString() : val), 2);
  } catch (_) {
    return String(v);
  }
};
function logError(err) {
  console.error('Error name:', err?.name);
  console.error('Error message:', err?.message);
  if (err?.code) console.error('Error code:', err.code);
  if (err?.reason) console.error('Reason:', err.reason);
  if (err?.shortMessage) console.error('Short message:', err.shortMessage);
  if (err?.data) console.error('Data:', toJSON(err.data));
  if (err?.cause) console.error('Cause:', toJSON(err.cause));
  if (err?.transactionHash) console.error('Tx hash:', err.transactionHash);
  if (err?.transaction?.hash) console.error('Tx hash:', err.transaction.hash);
  if (err?.receipt) console.error('Receipt:', toJSON(err.receipt));
  // common viem/ethers fields
  if (err?.metaMessages) console.error('Meta:', toJSON(err.metaMessages));
}
async function step(label, fn) {
  const t0 = Date.now();
  console.log(`\n=== ${label}: start ===`);
  try {
    const res = await fn();
    const dt = Date.now() - t0;
    console.log(`=== ${label}: success in ${dt}ms ===`);
    return res;
  } catch (err) {
    console.error(`=== ${label}: FAILED ===`);
    logError(err);
    throw err;
  }
}

async function main() {
  // Env overview (masked)
  console.log('ENV: PRIVATE_KEY:', mask(process.env.PRIVATE_KEY));
  console.log('ENV: PINATA_JWT:', process.env.PINATA_JWT ? '<set>' : '<unset>');
  console.log('ENV: IDENTITY_REGISTRY:', process.env.IDENTITY_REGISTRY || '<unset>');

  if (!process.env.PRIVATE_KEY) {
    throw new Error('Missing PRIVATE_KEY env var');
  }

  const storageProvider = process.env.PINATA_JWT
    ? new PinataStorage({ jwt: process.env.PINATA_JWT, gatewayUrl: 'https://gateway.pinata.cloud' })
    : undefined;
  console.log('Storage provider:', storageProvider ? 'Pinata' : 'None');

  const config = {
    agentName: 'warrenbuefet',
    agentDomain: 'https://ethglobalhackaton.vercel.app/agents/warrenbuefet/agent.json',
    agentRole: AgentRole.SERVER,
    network: NetworkConfig.BASE_SEPOLIA,
    privateKey: process.env.PRIVATE_KEY,
    storageProvider,
    enablePayments: true,
    enableStorage: true,
  };
  console.log('SDK config:', {
    agentName: config.agentName,
    agentDomain: config.agentDomain,
    agentRole: 'SERVER',
    network: 'BASE_SEPOLIA',
    enablePayments: config.enablePayments,
    enableStorage: config.enableStorage,
  });

  const sdk = await step('SDK init', async () => new ChaosChainSDK(config));

  // Try to print derived address and chain
  try {
    const addr = sdk.getAddress ? sdk.getAddress() : '<unknown>';
    console.log('SDK address:', addr);
  } catch (e) {
    console.log('Could not read SDK address');
  }

  const { agentId, txHash } = await step('registerIdentity', async () => sdk.registerIdentity());
  console.log('registerIdentity -> agentId:', agentId, 'tx:', txHash);


  const evidence = {
    agentId: agentId.toString(),
    timestamp: Date.now(),
    analysis: { trend: 'bullish', confidence: 0.87 },
  };
  console.log('evidence preview:', toJSON(evidence));

  const cid = await step('storeEvidence', async () => sdk.storeEvidence(evidence));
  console.log(`📦 Evidence stored: ipfs://${cid}`);

  // const toAgent = (sdk.getAddress && sdk.getAddress()) || undefined;
  // console.log('Payment params:', { toAgent, amount: '15.0', currency: 'USDC', serviceType: 'analysis' });
  // const payment = await step('executeX402Payment', async () =>
  //   sdk.executeX402Payment({ toAgent, amount: '15.0', currency: 'USDC', serviceType: 'analysis' })
  // );
  // console.log('Payment result:', toJSON(payment));
  //
  // await step('giveFeedback', async () =>
  //   sdk.giveFeedback({ agentId, rating: 95, feedbackUri: `ipfs://${cid}` })
  // );
  // console.log('⭐ Feedback submitted');
  //
  const stats = await step('getAgentStats', async () => sdk.getAgentStats(agentId));
  console.log(`📊 Stats: ${stats.totalFeedback} feedbacks, avg rating: ${stats.averageRating}`);
}

main().catch((err) => {
  console.error('FATAL: Unhandled error');
  logError(err);
  process.exit(1);
});
