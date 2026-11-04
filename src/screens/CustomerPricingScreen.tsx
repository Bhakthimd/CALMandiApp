import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { CustomerPricingRule } from '../types';

export default function CustomerPricingScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { customerId: initialCustomerId } = route.params || {};
  const {
    customers,
    products,
    productGrades,
    pricingRules,
    addPricingRule,
    updatePricingRule,
    deletePricingRule,
    togglePricingRule,
    isOwner,
  } = useMandi();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    initialCustomerId || 'ALL'
  );
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomerPricingRule | null>(null);

  // Form state
  const [formCustId, setFormCustId] = useState<string>(customers[0]?.id ?? '');
  const [formProdId, setFormProdId] = useState<string>(products[0]?.id ?? '');
  const [formGradeId, setFormGradeId] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  const filteredRules = useMemo(() => {
    return pricingRules.filter((r) => {
      const matchCust = selectedCustomerId === 'ALL' || r.customerId === selectedCustomerId;
      const matchProd = selectedProductId === 'ALL' || r.productId === selectedProductId;
      return matchCust && matchProd;
    });
  }, [pricingRules, selectedCustomerId, selectedProductId]);

  const formProduct = useMemo(() => {
    return products.find((p) => p.id === formProdId);
  }, [products, formProdId]);

  const formGrades = useMemo(() => {
    return productGrades.filter((g) => g.productId === formProdId && g.isActive);
  }, [productGrades, formProdId]);

  const handleOpenAddModal = () => {
    setEditingRule(null);
    const initialCust = customers[0]?.id || '';
    const initialProd = products[0]?.id || '';
    setFormCustId(initialCust);
    setFormProdId(initialProd);

    const firstGrade = productGrades.find((g) => g.productId === initialProd);
    setFormGradeId(firstGrade ? firstGrade.id : '');
    setFormPrice(firstGrade ? String(firstGrade.defaultPrice) : '25');
    setFormNotes('');
    setModalVisible(true);
  };

  const handleOpenEditModal = (rule: CustomerPricingRule) => {
    setEditingRule(rule);
    setFormCustId(rule.customerId);
    setFormProdId(rule.productId);
    setFormGradeId(rule.gradeId || '');
    setFormPrice(String(rule.price));
    setFormNotes(rule.notes || '');
    setModalVisible(true);
  };

  const handleSaveRule = async () => {
    const cust = customers.find((c) => c.id === formCustId);
    const prod = products.find((p) => p.id === formProdId);
    const grade = productGrades.find((g) => g.id === formGradeId);
    const priceNum = parseFloat(formPrice) || 0;

    if (!cust || !prod) {
      Alert.alert('Required Fields', 'Please select a customer and product.');
      return;
    }

    if (priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price greater than zero.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    if (editingRule) {
      await updatePricingRule(editingRule.id, {
        price: priceNum,
        notes: formNotes.trim() || undefined,
      });
      Alert.alert('Pricing Updated', `Custom rate for ${cust.name} updated to ₹${priceNum}/${prod.unit}.`);
    } else {
      await addPricingRule({
        customerId: cust.id,
        customerName: cust.name,
        productId: prod.id,
        productName: prod.name,
        gradeId: grade?.id,
        gradeName: grade?.name || 'All Grades',
        price: priceNum,
        effectiveDate: todayStr,
        isActive: true,
        notes: formNotes.trim() || undefined,
      });
      Alert.alert('Rule Created', `Custom rate of ₹${priceNum}/${prod.unit} configured for ${cust.name}.`);
    }

    setModalVisible(false);
  };

  const handleDeleteRule = (ruleId: string, custName: string) => {
    Alert.alert(
      'Delete Pricing Rule',
      `Are you sure you want to remove customer price for ${custName}? The system will fall back to default grade pricing.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePricingRule(ruleId);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 36) }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#222222" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Customer-Specific Pricing</Text>
          <Text style={styles.headerSubtitle}>ग्राहक विशेष दर सूची (कस्टम रेट)</Text>
        </View>
        {isOwner && (
          <TouchableOpacity
            style={styles.addBtnHeader}
            onPress={handleOpenAddModal}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color="#16834A" />
            <Text style={styles.addBtnHeaderText}>+ Add Rate</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom + 40, 50) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#16834A" />
          <Text style={styles.infoBannerText}>
            Custom prices set here are auto-applied during sales. If no rule is configured, the standard grade price is used as default.
          </Text>
        </View>

        {/* Customer Filter Chips */}
        <Text style={styles.filterTitle}>Filter by Customer (ग्राहक चुनें):</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedCustomerId === 'ALL' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedCustomerId('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedCustomerId === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              All Customers
            </Text>
          </TouchableOpacity>
          {customers.map((c) => {
            const isSelected = selectedCustomerId === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedCustomerId(c.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Product Filter Chips */}
        <Text style={styles.filterTitle}>Filter by Product (उत्पाद चुनें):</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipScroll}
        >
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedProductId === 'ALL' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedProductId('ALL')}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedProductId === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              All Products
            </Text>
          </TouchableOpacity>
          {products.map((p) => {
            const isSelected = selectedProductId === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedProductId(p.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Rules Count Header */}
        <View style={styles.rulesListHeader}>
          <Text style={styles.rulesListTitle}>
            Configured Rates ({filteredRules.length})
          </Text>
          {isOwner && (
            <TouchableOpacity onPress={handleOpenAddModal}>
              <Text style={styles.rulesListAddLink}>+ New Custom Price</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Rules List */}
        {filteredRules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="pricetag-outline" size={40} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No Custom Pricing Rules</Text>
            <Text style={styles.emptySub}>
              {"Tap '+ Add Rate' above to assign custom product or grade prices for specific customers."}
            </Text>
          </View>
        ) : (
          filteredRules.map((rule) => {
            // Find default price for comparison
            const prod = products.find((p) => p.id === rule.productId);
            const grade = productGrades.find((g) => g.id === rule.gradeId);
            const defaultPrice = grade
              ? grade.defaultPrice
              : parseFloat(prod?.price || '0') || 0;

            const diff = rule.price - defaultPrice;
            const isActive = rule.isActive;

            return (
              <View
                key={rule.id}
                style={[styles.ruleCard, !isActive && styles.ruleCardInactive]}
              >
                <View style={styles.ruleTopRow}>
                  <View style={styles.ruleCustWrap}>
                    <Text style={styles.ruleCustName}>{rule.customerName}</Text>
                    <View style={styles.productBadge}>
                      <Text style={styles.productBadgeText}>
                        {rule.productName} • {rule.gradeName || 'All Grades'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.rulePriceCol}>
                    <Text style={styles.rulePriceValue}>
                      ₹ {rule.price}{' '}
                      <Text style={styles.rulePriceUnit}>/ {prod?.unit || 'unit'}</Text>
                    </Text>
                    <Text
                      style={[
                        styles.diffBadge,
                        diff < 0
                          ? { color: '#16834A' }
                          : diff > 0
                          ? { color: '#DC2626' }
                          : { color: '#666666' },
                      ]}
                    >
                      {diff < 0
                        ? `₹ ${Math.abs(diff)} Discount vs standard`
                        : diff > 0
                        ? `₹ ${diff} Premium vs standard`
                        : 'Matches default rate'}
                    </Text>
                  </View>
                </View>

                {rule.notes && (
                  <View style={styles.ruleNotesBox}>
                    <Text style={styles.ruleNotesText}>📝 {rule.notes}</Text>
                  </View>
                )}

                {/* Card Controls */}
                <View style={styles.ruleBottomRow}>
                  <Text style={styles.ruleEffectiveText}>
                    Effective: {rule.effectiveDate || 'Always'}
                  </Text>

                  {isOwner && (
                    <View style={styles.ruleActions}>
                      <TouchableOpacity
                        style={styles.ruleActionBtn}
                        onPress={() => handleOpenEditModal(rule)}
                      >
                        <Ionicons name="pencil-outline" size={14} color="#16834A" />
                        <Text style={styles.ruleActionText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.ruleActionBtn}
                        onPress={() => togglePricingRule(rule.id)}
                      >
                        <Ionicons
                          name={isActive ? 'eye-off-outline' : 'eye-outline'}
                          size={14}
                          color={isActive ? '#D97706' : '#16834A'}
                        />
                        <Text
                          style={[
                            styles.ruleActionText,
                            isActive && { color: '#D97706' },
                          ]}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.ruleActionBtn}
                        onPress={() => handleDeleteRule(rule.id, rule.customerName)}
                      >
                        <Ionicons name="trash-outline" size={14} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add / Edit Pricing Rule Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRule ? 'Edit Customer Price' : 'Add Customer Price Rule'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Select Customer */}
              <Text style={styles.formLabel}>Customer (खरीदार / व्यापारी)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.formChipsScroll}
              >
                {customers.map((c) => {
                  const sel = formCustId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.formSelectChip, sel && styles.formSelectChipActive]}
                      onPress={() => setFormCustId(c.id)}
                    >
                      <Text
                        style={[
                          styles.formSelectChipText,
                          sel && styles.formSelectChipTextActive,
                        ]}
                      >
                        {c.name} ({c.business})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Select Product */}
              <Text style={styles.formLabel}>Product (उत्पाद)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.formChipsScroll}
              >
                {products.map((p) => {
                  const sel = formProdId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.formSelectChip, sel && styles.formSelectChipActive]}
                      onPress={() => {
                        setFormProdId(p.id);
                        const fGrade = productGrades.find((g) => g.productId === p.id);
                        setFormGradeId(fGrade ? fGrade.id : '');
                      }}
                    >
                      <Text
                        style={[
                          styles.formSelectChipText,
                          sel && styles.formSelectChipTextActive,
                        ]}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Select Grade */}
              <Text style={styles.formLabel}>Grade (गुणवत्ता स्तर)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.formChipsScroll}
              >
                {formGrades.map((g) => {
                  const sel = formGradeId === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.formSelectChip, sel && styles.formSelectChipActive]}
                      onPress={() => {
                        setFormGradeId(g.id);
                        setFormPrice(String(g.defaultPrice));
                      }}
                    >
                      <Text
                        style={[
                          styles.formSelectChipText,
                          sel && styles.formSelectChipTextActive,
                        ]}
                      >
                        {g.name} (Def: ₹{g.defaultPrice})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Customer Custom Price */}
              <Text style={styles.formLabel}>
                Customer-Specific Price (₹ per {formProduct?.unit || 'unit'})
              </Text>
              <View style={styles.modalInputWrap}>
                <Text style={styles.modalRupee}>₹</Text>
                <TextInput
                  style={styles.modalPriceInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#AAAAAA"
                  value={formPrice}
                  onChangeText={setFormPrice}
                />
              </View>

              {/* Notes */}
              <Text style={styles.formLabel}>Pricing Reason / Agreement Notes</Text>
              <TextInput
                style={styles.modalNotesInput}
                placeholder="e.g. Volume order margin discount"
                placeholderTextColor="#888888"
                value={formNotes}
                onChangeText={setFormNotes}
              />

              {/* Submit Button */}
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveRule}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.modalSubmitBtnText}>
                  {editingRule ? 'Save Changes' : 'Confirm & Set Custom Rate'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  addBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addBtnHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16834A',
  },
  content: {
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4EC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#065F46',
    lineHeight: 17,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444444',
    marginBottom: 6,
  },
  filterChipScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  filterChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  rulesListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  rulesListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  rulesListAddLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16834A',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#444444',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 4,
  },
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 10,
  },
  ruleCardInactive: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  ruleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ruleCustWrap: {
    flex: 1,
    marginRight: 10,
  },
  ruleCustName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222222',
  },
  productBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  productBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  rulePriceCol: {
    alignItems: 'flex-end',
  },
  rulePriceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16834A',
  },
  rulePriceUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  diffBadge: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  ruleNotesBox: {
    marginTop: 8,
    backgroundColor: '#F9FAFB',
    padding: 6,
    borderRadius: 6,
  },
  ruleNotesText: {
    fontSize: 11,
    color: '#555555',
  },
  ruleBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  ruleEffectiveText: {
    fontSize: 11,
    color: '#777777',
  },
  ruleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  ruleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F7F9F7',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 4,
  },
  ruleActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16834A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222222',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444444',
    marginTop: 8,
    marginBottom: 4,
  },
  formChipsScroll: {
    gap: 6,
    paddingBottom: 6,
  },
  formSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  formSelectChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  formSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  formSelectChipTextActive: {
    color: '#FFFFFF',
  },
  modalInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 46,
    marginBottom: 8,
  },
  modalRupee: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
    marginRight: 6,
  },
  modalPriceInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  modalNotesInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#222222',
    marginBottom: 12,
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16834A',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
    marginTop: 6,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
