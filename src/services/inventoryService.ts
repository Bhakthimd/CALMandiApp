import {
  Product,
  ProductGrade,
  ArrivalRecord,
  ArrivalLot,
  WastageRecord,
  StockLedgerEntry,
} from '../types';
import {
  saveArrivalToStorage,
  saveArrivalLotToStorage,
  saveProductToStorage,
  saveProductGradesToStorage,
  saveWastageRecordToStorage,
  saveStockLedgerEntryToStorage,
  runInTransaction,
} from './offlineStorage';

export interface GradingAllocationInput {
  lotId?: string;
  arrivalId?: string;
  productId: string;
  productName: string;
  originalQuantity: number;
  gradeQuantities: Record<string, number>; // gradeId -> qty
  wastageQuantity: number;
  wastageReason: string;
  notes?: string;
  recordedBy?: string;
}

export interface StockDeductionItem {
  productId: string;
  productName: string;
  gradeId?: string;
  gradeName?: string;
  quantity: number;
  unit: string;
}

/**
 * Calculates current total graded stock for a product across active grades
 */
export function calculateTotalGradedStock(grades: ProductGrade[]): number {
  return grades.reduce((sum, g) => sum + (g.isActive ? g.stockQuantity : 0), 0);
}

/**
 * Process a new Arrival:
 * - Creates an individual arrival lot
 * - Adds received quantity strictly into UNGRADED stock
 * - Does NOT allocate directly to Grade A/B/C
 * - Records stock ledger entry for UNGRADED arrival
 */
export async function processArrivalInventory(params: {
  arrival: ArrivalRecord;
  product: Product;
  currentProductGrades: ProductGrade[];
}): Promise<{
  arrivalLot: ArrivalLot;
  updatedProduct: Product;
  ledgerEntry: StockLedgerEntry;
}> {
  const { arrival, product, currentProductGrades } = params;

  if (arrival.quantity <= 0) {
    throw new Error('Arrival quantity must be greater than zero.');
  }

  const nowIso = new Date().toISOString();
  const lotId = `lot_${arrival.id || Date.now()}`;
  const lotNumber = arrival.lotNumber || `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

  const arrivalLot: ArrivalLot = {
    id: lotId,
    arrivalId: arrival.id,
    lotNumber,
    productId: product.id,
    productName: product.name,
    supplierId: arrival.farmerId,
    supplierName: arrival.farmerName,
    initialQuantity: arrival.quantity,
    ungradedQuantity: arrival.quantity,
    unit: arrival.unit,
    timestamp: nowIso,
    isFullyGraded: false,
    notes: arrival.notes,
  };

  const newUngradedStock = (product.ungradedStock || 0) + arrival.quantity;
  const gradedStock = calculateTotalGradedStock(currentProductGrades);

  const updatedProduct: Product = {
    ...product,
    ungradedStock: newUngradedStock,
    quantity: String(gradedStock + newUngradedStock),
  };

  const ledgerEntry: StockLedgerEntry = {
    id: `stk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productName: product.name,
    action: 'ARRIVAL_UNGRADED',
    quantityDelta: arrival.quantity,
    unit: arrival.unit,
    sourceReferenceType: 'ARRIVAL',
    sourceReferenceId: arrival.id,
    stockAfter: newUngradedStock,
    timestamp: nowIso,
    notes: `Arrival Lot ${lotNumber} received from ${arrival.farmerName} placed in Ungraded Stock`,
  };

  runInTransaction(() => {
    saveArrivalToStorage(arrival);
    saveArrivalLotToStorage(arrivalLot);
    saveProductToStorage(updatedProduct);
    saveStockLedgerEntryToStorage(ledgerEntry);
  });

  return { arrivalLot, updatedProduct, ledgerEntry };
}

/**
 * Process Grading and Wastage Allocation:
 * - Validates: sum(grades) + wastage <= originalQuantity
 * - Deducts from lot's ungraded quantity and product's ungraded stock
 * - Increases grade stock for each graded allocation
 * - Records wastage
 * - Writes immutable stock ledger records for each allocation
 */
export async function processGradingAndWastage(params: {
  input: GradingAllocationInput;
  product: Product;
  productGrades: ProductGrade[];
  lot?: ArrivalLot;
}): Promise<{
  updatedProduct: Product;
  updatedGrades: ProductGrade[];
  updatedLot?: ArrivalLot;
  wastageRecord: WastageRecord;
  ledgerEntries: StockLedgerEntry[];
}> {
  const { input, product, productGrades, lot } = params;

  let totalGraded = 0;
  for (const qty of Object.values(input.gradeQuantities)) {
    if (qty < 0) {
      throw new Error('Grade allocation quantity cannot be negative.');
    }
    totalGraded += qty;
  }

  const wastageQty = Math.max(0, input.wastageQuantity || 0);
  const totalAllocated = totalGraded + wastageQty;

  const availableUngraded = lot ? lot.ungradedQuantity : (product.ungradedStock || 0);

  if (totalAllocated > availableUngraded) {
    throw new Error(
      `Total allocated quantity (${totalAllocated} ${product.unit}) exceeds available ungraded quantity (${availableUngraded} ${product.unit}).`
    );
  }

  if (totalAllocated <= 0) {
    throw new Error('Total processed quantity must be greater than zero.');
  }

  const nowIso = new Date().toISOString();
  const remainingUngraded = availableUngraded - totalAllocated;
  const wastagePercentage = input.originalQuantity > 0 ? (wastageQty / input.originalQuantity) * 100 : 0;

  const wastageRecord: WastageRecord = {
    id: `wst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productName: product.name,
    originalQuantity: input.originalQuantity,
    gradeQuantities: input.gradeQuantities,
    wastageQuantity: wastageQty,
    wastageReason: input.wastageReason || 'Culled / Sorting Residue',
    wastagePercentage: parseFloat(wastagePercentage.toFixed(2)),
    remainingUngradedQuantity: remainingUngraded,
    timestamp: nowIso,
    recordedBy: input.recordedBy,
    notes: input.notes,
  };

  const updatedGrades = productGrades.map((g) => {
    if (g.productId === product.id && input.gradeQuantities[g.id] !== undefined) {
      const added = input.gradeQuantities[g.id] || 0;
      return {
        ...g,
        stockQuantity: g.stockQuantity + added,
      };
    }
    return g;
  });

  const nextUngradedStock = Math.max(0, (product.ungradedStock || 0) - totalAllocated);
  const nextGradedTotal = calculateTotalGradedStock(updatedGrades.filter((g) => g.productId === product.id));

  const updatedProduct: Product = {
    ...product,
    ungradedStock: nextUngradedStock,
    quantity: String(nextGradedTotal + nextUngradedStock),
    wastageQuantity: (product.wastageQuantity || 0) + wastageQty,
    wastageReason: input.wastageReason || product.wastageReason,
    grades: updatedGrades.filter((g) => g.productId === product.id),
  };

  let updatedLot: ArrivalLot | undefined;
  if (lot) {
    updatedLot = {
      ...lot,
      ungradedQuantity: remainingUngraded,
      isFullyGraded: remainingUngraded <= 0,
    };
  }

  const ledgerEntries: StockLedgerEntry[] = [];

  // Deduct from Ungraded Stock
  ledgerEntries.push({
    id: `stk_${Date.now()}_ungraded_${Math.random().toString(36).substring(2, 6)}`,
    productId: product.id,
    productName: product.name,
    action: 'GRADING_ALLOCATION',
    quantityDelta: -totalAllocated,
    unit: product.unit,
    sourceReferenceType: 'GRADING',
    sourceReferenceId: wastageRecord.id,
    stockAfter: nextUngradedStock,
    timestamp: nowIso,
    notes: `Allocated ${totalAllocated} from ungraded lot ${lot?.lotNumber || 'floor'} into grades and wastage`,
    createdBy: input.recordedBy,
  });

  // Credit each graded allocation
  for (const [gradeId, qty] of Object.entries(input.gradeQuantities)) {
    if (qty > 0) {
      const grade = updatedGrades.find((g) => g.id === gradeId);
      ledgerEntries.push({
        id: `stk_${Date.now()}_${gradeId}_${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        gradeId,
        gradeName: grade?.name,
        action: 'GRADING_ALLOCATION',
        quantityDelta: qty,
        unit: product.unit,
        sourceReferenceType: 'GRADING',
        sourceReferenceId: wastageRecord.id,
        stockAfter: grade?.stockQuantity || qty,
        timestamp: nowIso,
        notes: `Graded +${qty} ${product.unit} as ${grade?.name || 'Grade'}`,
        createdBy: input.recordedBy,
      });
    }
  }

  // Record wastage movement
  if (wastageQty > 0) {
    ledgerEntries.push({
      id: `stk_${Date.now()}_wst_${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      action: 'WASTAGE',
      quantityDelta: -wastageQty,
      unit: product.unit,
      sourceReferenceType: 'WASTAGE',
      sourceReferenceId: wastageRecord.id,
      stockAfter: 0,
      timestamp: nowIso,
      notes: `Culled wastage: ${wastageQty} ${product.unit} (${input.wastageReason})`,
      createdBy: input.recordedBy,
    });
  }

  runInTransaction(() => {
    saveWastageRecordToStorage(wastageRecord);
    saveProductToStorage(updatedProduct);
    saveProductGradesToStorage(updatedGrades);
    if (updatedLot) {
      saveArrivalLotToStorage(updatedLot);
    }
    for (const entry of ledgerEntries) {
      saveStockLedgerEntryToStorage(entry);
    }
  });

  return {
    updatedProduct,
    updatedGrades,
    updatedLot,
    wastageRecord,
    ledgerEntries,
  };
}

/**
 * Validates and deducts stock for dispatch items:
 * - Strictly prevents negative stock
 * - Blocks dispatch exceeding available grade stock
 * - Generates audit stock ledger entries
 */
export async function deductDispatchStock(params: {
  items: StockDeductionItem[];
  products: Product[];
  productGrades: ProductGrade[];
  invoiceId: string;
  recordedBy?: string;
}): Promise<{
  updatedProducts: Product[];
  updatedGrades: ProductGrade[];
  ledgerEntries: StockLedgerEntry[];
}> {
  const { items, products, productGrades, invoiceId, recordedBy } = params;

  // First pass: Validate all stock availability before making any changes
  for (const item of items) {
    if (item.quantity <= 0) {
      throw new Error(`Dispatch quantity for ${item.productName} must be greater than zero.`);
    }

    if (item.gradeId) {
      const grade = productGrades.find((g) => g.id === item.gradeId);
      if (!grade) {
        throw new Error(`Grade not found for product ${item.productName}.`);
      }
      if (item.quantity > grade.stockQuantity) {
        throw new Error(
          `Insufficient stock for ${item.productName} (${grade.name}). Available: ${grade.stockQuantity} ${item.unit}, Requested: ${item.quantity} ${item.unit}.`
        );
      }
    } else {
      const prod = products.find((p) => p.id === item.productId);
      const availableTotal = parseFloat(prod?.quantity || '0') || 0;
      if (item.quantity > availableTotal) {
        throw new Error(
          `Insufficient stock for ${item.productName}. Available: ${availableTotal} ${item.unit}, Requested: ${item.quantity} ${item.unit}.`
        );
      }
    }
  }

  // Second pass: Apply deductions
  const nowIso = new Date().toISOString();
  let nextGrades = [...productGrades];
  let nextProducts = [...products];
  const ledgerEntries: StockLedgerEntry[] = [];

  for (const item of items) {
    if (item.gradeId) {
      nextGrades = nextGrades.map((g) => {
        if (g.id === item.gradeId) {
          const nextStock = g.stockQuantity - item.quantity;
          if (nextStock < 0) {
            throw new Error(`Negative stock prevented for grade ${g.name}.`);
          }
          ledgerEntries.push({
            id: `stk_${Date.now()}_disp_${Math.random().toString(36).substring(2, 6)}`,
            productId: item.productId,
            productName: item.productName,
            gradeId: g.id,
            gradeName: g.name,
            action: 'DISPATCH',
            quantityDelta: -item.quantity,
            unit: item.unit,
            sourceReferenceType: 'DISPATCH',
            sourceReferenceId: invoiceId,
            stockAfter: nextStock,
            timestamp: nowIso,
            notes: `Dispatched ${item.quantity} ${item.unit} (${g.name})`,
            createdBy: recordedBy,
          });
          return { ...g, stockQuantity: nextStock };
        }
        return g;
      });
    }

    // Update parent product quantity
    nextProducts = nextProducts.map((p) => {
      if (p.id === item.productId) {
        const prodGrades = nextGrades.filter((g) => g.productId === p.id);
        const gradedTotal = calculateTotalGradedStock(prodGrades);
        const ungraded = p.ungradedStock || 0;
        return {
          ...p,
          grades: prodGrades,
          quantity: String(gradedTotal + ungraded),
        };
      }
      return p;
    });
  }

  runInTransaction(() => {
    saveProductGradesToStorage(nextGrades);
    for (const p of nextProducts) {
      saveProductToStorage(p);
    }
    for (const entry of ledgerEntries) {
      saveStockLedgerEntryToStorage(entry);
    }
  });

  return {
    updatedProducts: nextProducts,
    updatedGrades: nextGrades,
    ledgerEntries,
  };
}

/**
 * Reverses dispatch stock deduction upon cancellation:
 * - Adds stock back to the original grade
 * - Creates DISPATCH_REVERSAL ledger entry
 */
export async function reverseDispatchStock(params: {
  items: StockDeductionItem[];
  products: Product[];
  productGrades: ProductGrade[];
  invoiceId: string;
  reason?: string;
  recordedBy?: string;
}): Promise<{
  updatedProducts: Product[];
  updatedGrades: ProductGrade[];
  ledgerEntries: StockLedgerEntry[];
}> {
  const { items, products, productGrades, invoiceId, reason, recordedBy } = params;
  const nowIso = new Date().toISOString();

  let nextGrades = [...productGrades];
  let nextProducts = [...products];
  const ledgerEntries: StockLedgerEntry[] = [];

  for (const item of items) {
    if (item.gradeId) {
      nextGrades = nextGrades.map((g) => {
        if (g.id === item.gradeId) {
          const nextStock = g.stockQuantity + item.quantity;
          ledgerEntries.push({
            id: `stk_${Date.now()}_rev_${Math.random().toString(36).substring(2, 6)}`,
            productId: item.productId,
            productName: item.productName,
            gradeId: g.id,
            gradeName: g.name,
            action: 'DISPATCH_REVERSAL',
            quantityDelta: item.quantity,
            unit: item.unit,
            sourceReferenceType: 'DISPATCH',
            sourceReferenceId: invoiceId,
            stockAfter: nextStock,
            timestamp: nowIso,
            notes: `Dispatch cancelled: Recredited ${item.quantity} ${item.unit} (${reason || 'Order Cancelled'})`,
            createdBy: recordedBy,
          });
          return { ...g, stockQuantity: nextStock };
        }
        return g;
      });
    }

    nextProducts = nextProducts.map((p) => {
      if (p.id === item.productId) {
        const prodGrades = nextGrades.filter((g) => g.productId === p.id);
        const gradedTotal = calculateTotalGradedStock(prodGrades);
        const ungraded = p.ungradedStock || 0;
        return {
          ...p,
          grades: prodGrades,
          quantity: String(gradedTotal + ungraded),
        };
      }
      return p;
    });
  }

  runInTransaction(() => {
    saveProductGradesToStorage(nextGrades);
    for (const p of nextProducts) {
      saveProductToStorage(p);
    }
    for (const entry of ledgerEntries) {
      saveStockLedgerEntryToStorage(entry);
    }
  });

  return {
    updatedProducts: nextProducts,
    updatedGrades: nextGrades,
    ledgerEntries,
  };
}
