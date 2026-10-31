import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';

export default function ProductsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    products,
    updateProductQuantity,
    deleteProduct,
    isOwner,
    isOperator,
    canDeleteProduct,
  } = useMandi();

  const handleIncrement = (id: string, currentQty: string, step = 1) => {
    const num = parseInt(currentQty, 10) || 0;
    updateProductQuantity(id, (num + step).toString());
  };

  const handleDecrement = (id: string, currentQty: string) => {
    const num = parseInt(currentQty, 10) || 0;
    if (num > 0) {
      updateProductQuantity(id, (num - 1).toString());
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!canDeleteProduct) {
      Alert.alert(
        'Owner Privilege Required',
        `Only the Mandi Owner has permission to delete "${name}" from the product catalog.\n\nAs an operator, you can adjust daily arrival and dispatch quantities.`
      );
      return;
    }

    Alert.alert(
      'Delete Product',
      `Are you sure you want to remove "${name}" from your product catalog?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteProduct(id);
          },
        },
      ]
    );
  };

  const handleAddProductPress = () => {
    if (isOperator) {
      Alert.alert(
        'Owner Privilege Required',
        'Adding new commodities to the master catalog requires Mandi Owner authorization.\n\nPlease contact your Mandi Owner to add new commodities.'
      );
      return;
    }
    navigation.navigate('AddProduct');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 20, 30),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹ Home</Text>
          </TouchableOpacity>

          <Text style={styles.logo}>CALMandi</Text>
        </View>

        <Text style={styles.title}>Products</Text>

        <Text style={styles.subtitle}>
          {isOwner
            ? 'Full catalog control: Add, price, and manage mandi inventory.'
            : 'Counter operations desk: Record arrivals, dispatches, and daily counts.'}
        </Text>

        {/* Role Mode Banner */}
        <View
          style={[
            styles.roleBanner,
            isOwner ? styles.ownerBannerBg : styles.operatorBannerBg,
          ]}
        >
          <Ionicons
            name={isOwner ? 'shield-checkmark' : 'briefcase'}
            size={18}
            color={isOwner ? '#16834A' : '#0284C7'}
          />
          <View style={styles.roleBannerTextWrap}>
            <Text
              style={[
                styles.roleBannerTitle,
                { color: isOwner ? '#16834A' : '#0284C7' },
              ]}
            >
              {isOwner
                ? '👑 Owner Mode: Full Catalog & Price Control'
                : '👷 Operator Mode: Real-Time Stock Count Desk'}
            </Text>
            <Text style={styles.roleBannerDesc}>
              {isOwner
                ? 'Add new commodities, adjust prices, or remove products'
                : 'Stock adjustments (+/-) enabled. Master deletions locked by Owner'}
            </Text>
          </View>
        </View>

        {/* Add Product Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            isOperator && styles.addButtonOperatorLocked,
          ]}
          activeOpacity={0.7}
          onPress={handleAddProductPress}
        >
          <Ionicons
            name={isOperator ? 'lock-closed-outline' : 'add-circle-outline'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.addButtonText}>
            {isOperator ? 'Add Product (Owner Locked)' : 'Add New Product'}
          </Text>
        </TouchableOpacity>

        {/* Products List Header with Quick Add */}
        <View style={styles.listHeader}>
          <View style={styles.listTitleContainer}>
            <Text style={styles.listTitle}>Product Catalog</Text>
            <View style={styles.countBadge}>
              <Text style={styles.count}>
                {products.length} {products.length === 1 ? 'Item' : 'Items'}
              </Text>
            </View>
          </View>

          {isOwner && (
            <TouchableOpacity
              style={styles.headerAddBtn}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AddProduct')}
            >
              <Ionicons name="add" size={17} color="#16834A" />
              <Text style={styles.headerAddBtnText}>Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Products List */}
        {products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyText}>No products in catalog.</Text>
            <Text style={styles.emptySubtext}>
              Tap "Add New Product" to list your fruits, vegetables, and commodities.
            </Text>
            {isOwner && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text style={styles.emptyAddBtnText}>+ Add First Product</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          products.map((product) => {
            const currentQty =
              product.quantity !== undefined ? String(product.quantity) : '0';
            const qtyNum = parseFloat(currentQty) || 0;
            const priceNum = parseFloat(product.price || '0') || 0;
            const itemTotalVal = qtyNum * priceNum;

            return (
              <View key={product.id} style={styles.productCard}>
                {/* Top Info Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="cube-outline" size={24} color="#16834A" />
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>

                    <View style={styles.badgesRow}>
                      <View style={styles.categoryBadge}>
                        <Ionicons
                          name="pricetag-outline"
                          size={12}
                          color="#16834A"
                        />
                        <Text style={styles.categoryBadgeText}>
                          {product.category}
                        </Text>
                      </View>

                      {product.price ? (
                        <View style={styles.priceBadge}>
                          <Text style={styles.priceBadgeText}>
                            ₹{product.price} / {product.unit}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Owner Financial Value Tag */}
                    {isOwner && itemTotalVal > 0 && (
                      <Text style={styles.valuationText}>
                        Stock Value: ₹{itemTotalVal.toLocaleString('en-IN')}
                      </Text>
                    )}
                  </View>

                  {/* Delete / Lock Button */}
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      !canDeleteProduct && styles.lockButton,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleDelete(product.id, product.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={canDeleteProduct ? 'trash-outline' : 'lock-closed'}
                      size={17}
                      color={canDeleteProduct ? '#DC2626' : '#94A3B8'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Number Input & Unit Display Section */}
                <View style={styles.quantitySection}>
                  <View style={styles.quantityHeader}>
                    <Text style={styles.quantityLabel}>Stock / Quantity</Text>
                    <Text style={styles.unitTag}>Unit: {product.unit}</Text>
                  </View>

                  <View style={styles.quantityInputRow}>
                    <TouchableOpacity
                      style={styles.stepButton}
                      activeOpacity={0.7}
                      onPress={() => handleDecrement(product.id, currentQty)}
                    >
                      <Ionicons name="remove" size={18} color="#16834A" />
                    </TouchableOpacity>

                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.numberInput}
                        keyboardType="number-pad"
                        value={currentQty}
                        onChangeText={(val) =>
                          updateProductQuantity(
                            product.id,
                            val.replace(/\D/g, '')
                          )
                        }
                        selectTextOnFocus
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.stepButton}
                      activeOpacity={0.7}
                      onPress={() => handleIncrement(product.id, currentQty, 1)}
                    >
                      <Ionicons name="add" size={18} color="#16834A" />
                    </TouchableOpacity>

                    {/* Fast Batch Add +10 for Operator Floor Counting */}
                    {isOperator && (
                      <TouchableOpacity
                        style={styles.batchStepBtn}
                        activeOpacity={0.7}
                        onPress={() => handleIncrement(product.id, currentQty, 10)}
                      >
                        <Text style={styles.batchStepText}>+10</Text>
                      </TouchableOpacity>
                    )}

                    <View style={styles.unitDisplayBadge}>
                      <Text style={styles.unitDisplayText}>{product.unit}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 10,
  },
  backText: {
    fontSize: 18,
    color: '#16834A',
    fontWeight: '600',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#16834A',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222222',
  },
  subtitle: {
    fontSize: 15,
    color: '#777777',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 21,
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  ownerBannerBg: {
    backgroundColor: '#E8F5EC',
    borderColor: '#C7E8D3',
  },
  operatorBannerBg: {
    backgroundColor: '#F0F9FF',
    borderColor: '#BAE6FD',
  },
  roleBannerTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  roleBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  roleBannerDesc: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 16,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#16834A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonOperatorLocked: {
    backgroundColor: '#64748B',
    shadowColor: '#64748B',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  listTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333333',
  },
  countBadge: {
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 10,
  },
  count: {
    fontSize: 13,
    color: '#16834A',
    fontWeight: '600',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerAddBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16834A',
    marginLeft: 2,
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555555',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
    lineHeight: 20,
  },
  emptyAddBtn: {
    backgroundColor: '#16834A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: '#E8F4EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  productName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222222',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#555555',
    marginLeft: 4,
  },
  priceBadge: {
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priceBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16834A',
  },
  valuationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16834A',
    marginTop: 4,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockButton: {
    backgroundColor: '#F1F5F9',
  },
  quantitySection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  unitTag: {
    fontSize: 12,
    color: '#6B7280',
  },
  quantityInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  batchStepBtn: {
    paddingHorizontal: 8,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  batchStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 8,
  },
  numberInput: {
    height: 38,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  unitDisplayBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  unitDisplayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
});
