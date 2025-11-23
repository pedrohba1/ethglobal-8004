import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("ERC8004Module", (m) => {
  const identityRegistry = m.contract("IdentityRegistry");

  const reputationRegistry = m.contract("ReputationRegistry", [identityRegistry]);
  const validationRegistry = m.contract("ValidationRegistry", [identityRegistry]);

  return { identityRegistry, reputationRegistry, validationRegistry };
});
