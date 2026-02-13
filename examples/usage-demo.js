/**
 * ServiceVerified — Usage demo
 *
 * Run: node examples/usage-demo.js
 * See examples/usage-demo-improved.js for more patterns.
 */

const { createCredential, generateDid, extractUuid } = require("../dist/lib");

const did = generateDid();
const cred = createCredential(extractUuid(did))
  .withStatus("approved")
  .withSource("servicepath.compliance.iso27001")
  .withEvidence({
    type: "iso27001_attestation",
    payload: { scope: "AI" },
  })
  .build();

console.log("Generated DID:", did);
console.log("Credential DID:", cred.did);
console.log("DIDs match:", did === cred.did);
console.log("\nCredential:", JSON.stringify(cred, null, 2));
