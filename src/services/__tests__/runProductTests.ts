import { runProductCatalogueTests } from './productCatalogueVerification';

async function main() {
  const { passed, results } = await runProductCatalogueTests();
  const passedCount = results.filter((r) => r.passed).length;
  console.log('\n========================================');
  console.log(`Product Catalogue Workflows: ${passedCount}/${results.length} PASSED`);
  console.log('========================================\n');
  if (!passed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
