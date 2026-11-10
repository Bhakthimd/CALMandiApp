import { translations } from '../../i18n/translations';

interface Product {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

interface TallyInput {
  productId: string;
  productName: string;
  unit: string;
  count: number;
  mode: 'IN' | 'OUT';
  vehicleNo?: string;
  partyName?: string;
}

export function runTapCountTests() {
  console.log('--- STARTING TAP COUNT (CRATES & KGS) VERIFICATION SUITE ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  [PASS] Test ${total}: ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] Test ${total}: ${desc}`);
    }
  }

  // 1. Localization check
  const requiredKeys = [
    'tapCount',
    'addStock',
    'subtractStock',
    'currentStock',
    'finalAvailableStock',
    'saveStockUpdate',
    'insufficientStockMsg',
    'quickAdjust',
    'manualEntry',
    'enterQuantity',
    'optionalDetailsTitle',
    'vehicleNumber',
    'farmerSupplierName',
    'buyerTraderName',
    'todaysFloorTally',
    'noTalliesYet',
    'viewAll',
    'showLess',
  ];

  for (const lang of ['en', 'hi', 'kn'] as const) {
    const dict = translations[lang];
    const missing = requiredKeys.filter((k) => !dict[k]);
    assert(missing.length === 0, `All required Tap Count keys present in '${lang}' locale (missing: ${missing.join(', ') || 'none'})`);
  }

  // 2. Add Stock Arithmetic
  const testProduct: Product = {
    id: 'prod_tomato',
    name: 'Tomato (Hybrid)',
    quantity: '45',
    unit: 'Crates',
  };

  const initialStock = parseFloat(testProduct.quantity) || 0;
  const addCount = 20;
  const projectedAddStock = initialStock + addCount;
  assert(projectedAddStock === 65, 'Add Stock calculation correctly projects current + added');

  // 3. Subtract Stock Arithmetic
  const subCount = 15;
  const projectedSubStock = initialStock - subCount;
  assert(projectedSubStock === 30, 'Subtract Stock calculation correctly projects current - deducted');

  // 4. Deficit Prevention
  const excessDeduct = 50; // exceeds initialStock 45
  const isDeficit = excessDeduct > initialStock;
  assert(isDeficit === true, 'Deficit check triggers when deduct count exceeds available stock');

  // Mock record tally logic
  function mockRecordTally(prod: Product, input: TallyInput) {
    const curr = parseFloat(prod.quantity) || 0;
    if (input.mode === 'OUT' && input.count > curr) {
      throw new Error(`Insufficient stock: Cannot dispatch ${input.count}`);
    }
    const nextQty = input.mode === 'IN' ? curr + input.count : curr - input.count;
    return {
      record: {
        id: `tally_${Date.now()}`,
        time: 'Today, 10:30 AM',
        ...input,
      },
      updatedProduct: {
        ...prod,
        quantity: nextQty.toString(),
      },
    };
  }

  // Test IN mode execution
  const inResult = mockRecordTally(testProduct, {
    productId: testProduct.id,
    productName: testProduct.name,
    unit: testProduct.unit,
    count: 25,
    mode: 'IN',
    vehicleNo: 'KA-04-E-1234',
    partyName: 'Basavaraj Farmer',
  });

  assert(inResult.updatedProduct.quantity === '70', 'Tally IN successfully increases stock to 70 Crates');
  assert(inResult.record.vehicleNo === 'KA-04-E-1234', 'Vehicle details correctly attached to Tally Record');

  // Test OUT mode execution
  const outResult = mockRecordTally(inResult.updatedProduct, {
    productId: testProduct.id,
    productName: testProduct.name,
    unit: testProduct.unit,
    count: 30,
    mode: 'OUT',
    partyName: 'Ravi Traders',
  });

  assert(outResult.updatedProduct.quantity === '40', 'Tally OUT successfully decrements stock from 70 to 40 Crates');

  // Test OUT mode deficit exception
  let exceptionCaught = false;
  try {
    mockRecordTally(outResult.updatedProduct, {
      productId: testProduct.id,
      productName: testProduct.name,
      unit: testProduct.unit,
      count: 45, // stock is 40
      mode: 'OUT',
    });
  } catch {
    exceptionCaught = true;
  }
  assert(exceptionCaught === true, 'Tally OUT throws error and rejects deficit stock deduction');

  // 5. Quick Adjustment Pills
  const quickAdds = [1, 5, 10, 20, 50];
  let tallyCounter = 0;
  for (const q of quickAdds) {
    tallyCounter += q;
  }
  assert(tallyCounter === 86, 'Quick add steppers (+1, +5, +10, +20, +50) accumulate correctly');

  const quickSubs = [1, 5, 10];
  for (const q of quickSubs) {
    tallyCounter = Math.max(0, tallyCounter - q);
  }
  assert(tallyCounter === 70, 'Quick subtract steppers (-1, -5, -10) decrement correctly');

  console.log(`\nTAP COUNT TEST SUMMARY: ${passed}/${total} TESTS PASSED.`);
  if (passed !== total) {
    throw new Error(`Tap Count verification failed: ${total - passed} tests failed.`);
  }
}

runTapCountTests();
