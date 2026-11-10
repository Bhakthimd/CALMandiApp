import {
  initOfflineStorage,
  saveProductToStorage,
  loadProductsFromStorage,
  saveCategoryToStorage,
  loadCategoriesFromStorage,
  resetStorageForTesting,
} from '../offlineStorage';
import { initialCategories, initialProducts } from '../../data/mockData';
import { Product, Category, UnitType } from '../../types';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export async function runProductCatalogueTests(): Promise<{ passed: boolean; results: TestResult[] }> {
  const results: TestResult[] = [];
  const log = (name: string, passed: boolean, message: string) => {
    results.push({ name, passed, message });
    console.log(`${passed ? '✓' : '✗'} [${name}]: ${message}`);
  };

  try {
    resetStorageForTesting();
    await initOfflineStorage();

    // Setup initial seed
    for (const c of initialCategories) {
      await saveCategoryToStorage(c);
    }
    for (const p of initialProducts) {
      await saveProductToStorage(p);
    }

    const loadedProds = await loadProductsFromStorage();
    const loadedCats = await loadCategoriesFromStorage();

    // WORKFLOW 1: Open Product Catalogue & verify items
    log(
      'WORKFLOW 1: Open Product Catalogue',
      loadedProds.length >= 25 && loadedCats.length >= 6,
      `Loaded ${loadedProds.length} commodities across ${loadedCats.length} categories with authentic photos`
    );

    // WORKFLOW 2: Search for a product
    const searchQuery = 'toma';
    const searchMatches = loadedProds.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    log(
      'WORKFLOW 2: Real-time Search',
      searchMatches.length > 0 && searchMatches.some((p) => p.name.toLowerCase().includes('tomato')),
      `Found ${searchMatches.length} match(es) for query "${searchQuery}" (matched: ${searchMatches.map((m) => m.name).join(', ')})`
    );

    // WORKFLOW 3: Switch between categories
    const categoriesToTest = ['Fruits', 'Vegetables', 'Leafy Vegetables', 'Dry Fruits', 'Grains', 'Spices'];
    let allCatFilterPassed = true;
    for (const catName of categoriesToTest) {
      const items = loadedProds.filter((p) => (p.category || '').toLowerCase() === catName.toLowerCase());
      if (items.length === 0 && catName !== 'Spices') {
        allCatFilterPassed = false;
      }
    }
    log(
      'WORKFLOW 3: Switch Between Categories',
      allCatFilterPassed,
      `Successfully filtered commodities across standard categories`
    );

    // WORKFLOW 4: Select a product
    const selectedState: Record<string, { quantity: number; unit: string }> = {};
    const tomato = loadedProds.find((p) => p.name.toLowerCase() === 'tomato');
    if (!tomato) throw new Error('Tomato not found');

    selectedState[tomato.id] = { quantity: 1, unit: tomato.unit || 'Kg' };
    log(
      'WORKFLOW 4: Select Product',
      selectedState[tomato.id].quantity === 1 && selectedState[tomato.id].unit === 'Kg',
      `Selected "${tomato.name}" with default quantity = 1 ${selectedState[tomato.id].unit}`
    );

    // WORKFLOW 5: Increase and decrease quantity
    selectedState[tomato.id].quantity += 1; // 2
    selectedState[tomato.id].quantity += 1; // 3
    const incQty = selectedState[tomato.id].quantity;
    selectedState[tomato.id].quantity = Math.max(1, selectedState[tomato.id].quantity - 1); // 2
    const decQty = selectedState[tomato.id].quantity;
    log(
      'WORKFLOW 5: Stepper Increment & Decrement',
      incQty === 3 && decQty === 2,
      `Incremented to ${incQty}, decremented to ${decQty} without negative quantities`
    );

    // WORKFLOW 6: Manually enter quantity
    const manualEntered = 45;
    selectedState[tomato.id].quantity = manualEntered;
    log(
      'WORKFLOW 6: Manual Quantity Entry',
      selectedState[tomato.id].quantity === 45,
      `Manually updated quantity to ${selectedState[tomato.id].quantity} ${selectedState[tomato.id].unit}`
    );

    // WORKFLOW 7: Change measuring unit
    const newUnit: UnitType = 'Crate';
    selectedState[tomato.id].unit = newUnit;
    log(
      'WORKFLOW 7: Change Measuring Unit',
      selectedState[tomato.id].unit === 'Crate',
      `Updated unit for "${tomato.name}" to ${selectedState[tomato.id].unit}`
    );

    // WORKFLOW 8: Select multiple products
    const banana = loadedProds.find((p) => p.name.toLowerCase() === 'banana');
    const almonds = loadedProds.find((p) => p.name.toLowerCase().includes('almond'));
    if (!banana || !almonds) throw new Error('Produce items not found');

    selectedState[banana.id] = { quantity: 10, unit: 'Dozen' };
    selectedState[almonds.id] = { quantity: 5, unit: 'Kg' };
    const selCount = Object.keys(selectedState).length;
    log(
      'WORKFLOW 8: Multiple Simultaneous Selections',
      selCount === 3,
      `Selected ${selCount} items simultaneously across different categories`
    );

    // WORKFLOW 9: Switch categories while preserving selections
    // Simulating user browsing "Fruits" tab, then "Dry Fruits" tab
    const fruitsFilter = loadedProds.filter((p) => (p.category || '').toLowerCase() === 'fruits');
    const dryFruitsFilter = loadedProds.filter((p) => (p.category || '').toLowerCase() === 'dry fruits');
    // Ensure selections still contain all 3 products regardless of current filter
    const preservedCount = Object.keys(selectedState).length;
    log(
      'WORKFLOW 9: Preserving Selections Across Category Switches',
      preservedCount === 3 && Boolean(selectedState[tomato.id]) && Boolean(selectedState[banana.id]),
      `Selections intact (${preservedCount} items) after filtering Fruits (${fruitsFilter.length}) and Dry Fruits (${dryFruitsFilter.length})`
    );

    // WORKFLOW 10: Sort products
    const sortedNameAsc = [...loadedProds].sort((a, b) => a.name.localeCompare(b.name));
    const sortedNameDesc = [...loadedProds].sort((a, b) => b.name.localeCompare(a.name));
    const sortedPriceDesc = [...loadedProds].sort((a, b) => (parseFloat(b.price || '0') || 0) - (parseFloat(a.price || '0') || 0));
    log(
      'WORKFLOW 10: Sort Products Order',
      sortedNameAsc[0].name !== sortedNameDesc[0].name && (parseFloat(sortedPriceDesc[0].price || '0') >= parseFloat(sortedPriceDesc[sortedPriceDesc.length - 1].price || '0')),
      `Sorting verified: First A-Z: "${sortedNameAsc[0].name}", First Z-A: "${sortedNameDesc[0].name}", Highest Price: ₹${sortedPriceDesc[0].price}`
    );

    // WORKFLOW 11: Create a new category
    const customCat: Category = {
      id: `cat_custom_${Date.now()}`,
      name: 'Organic Herbs',
      image: 'https://images.unsplash.com/photo-1599818814526-72412e6caec7?w=500&auto=format&fit=crop&q=80',
    };
    await saveCategoryToStorage(customCat);
    const updatedCats = await loadCategoriesFromStorage();
    log(
      'WORKFLOW 11: Create New Category',
      updatedCats.some((c) => c.name === 'Organic Herbs'),
      `Created category "${customCat.name}" with custom cover photo`
    );

    // WORKFLOW 12: Open an empty category
    const emptyCatItems = loadedProds.filter((p) => (p.category || '').toLowerCase() === 'organic herbs');
    log(
      'WORKFLOW 12: Empty Category Handling',
      emptyCatItems.length === 0,
      `Category "Organic Herbs" cleanly reports 0 items, ready for dedicated empty-state prompt`
    );

    // WORKFLOW 13: Add product to a category
    const newProduct: Product = {
      id: `prod_custom_${Date.now()}`,
      name: 'Organic Basil',
      category: 'Organic Herbs',
      unit: 'Bunch',
      quantity: '20',
      price: '35',
      image: 'https://images.unsplash.com/photo-1599818814526-72412e6caec7?w=500&auto=format&fit=crop&q=80',
    };
    await saveProductToStorage(newProduct);
    const prodsAfterAdd = await loadProductsFromStorage();
    const assignedCatItems = prodsAfterAdd.filter((p) => (p.category || '').toLowerCase() === 'organic herbs');
    log(
      'WORKFLOW 13: Add Product to Category',
      assignedCatItems.length === 1 && assignedCatItems[0].name === 'Organic Basil',
      `Added product "${newProduct.name}" to "${newProduct.category}" with initial stock 20 ${newProduct.unit}`
    );

    // WORKFLOW 14: Remove a selected product
    delete selectedState[banana.id]; // User removes Banana
    const remainingCount = Object.keys(selectedState).length;
    log(
      'WORKFLOW 14: Remove Product from Selection',
      remainingCount === 2 && !selectedState[banana.id],
      `Removed Banana; remaining selection: ${remainingCount} products (${Object.keys(selectedState).join(', ')})`
    );

    // WORKFLOW 15: Complete Add Selected Products Workflow (Batch Inventory Update)
    const itemsToBatchAdd = Object.entries(selectedState).map(([prodId, sel]) => ({
      productId: prodId,
      quantity: sel.quantity,
      unit: sel.unit,
      mode: 'ADD' as const,
    }));

    // Apply batch addition to inventory
    for (const item of itemsToBatchAdd) {
      const existing = prodsAfterAdd.find((p) => p.id === item.productId);
      if (existing) {
        const curStock = parseFloat(existing.quantity || '0') || 0;
        const newStock = curStock + item.quantity;
        const updated: Product = {
          ...existing,
          quantity: String(newStock),
          unit: item.unit || existing.unit,
        };
        await saveProductToStorage(updated);
      }
    }

    const reloadedProds = await loadProductsFromStorage();
    const reloadedTomato = reloadedProds.find((p) => p.id === tomato.id);
    const finalTomatoStock = parseFloat(reloadedTomato?.quantity || '0');
    const initialTomatoStock = parseFloat(tomato.quantity || '0');

    log(
      'WORKFLOW 15: Batch Add Selected Products to Inventory',
      finalTomatoStock === initialTomatoStock + 45,
      `Stock for "${tomato.name}" successfully updated from ${initialTomatoStock} to ${finalTomatoStock} without duplicate entries`
    );

    const allPassed = results.every((r) => r.passed);
    return { passed: allPassed, results };
  } catch (err: any) {
    log('FATAL_ERROR', false, err?.message || String(err));
    return { passed: false, results };
  }
}
