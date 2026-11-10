import { runAllVerificationTests } from './scenarioVerification';

async function main() {
  try {
    const results = await runAllVerificationTests();
    if (results.passedCount === results.totalCount) {
      console.log(`\nSUCCESS: ALL ${results.totalCount} USER SCENARIOS VERIFIED AND PASSED! 🚀`);
      process.exit(0);
    } else {
      console.error(`\nFAILURE: Only ${results.passedCount}/${results.totalCount} tests passed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal execution error:', err);
    process.exit(1);
  }
}

main();
