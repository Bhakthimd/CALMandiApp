import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import NetworkStatusBanner from '../components/NetworkStatusBanner';

export default function RecordArrivalScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    products,
    units,
    customers,
    recordArrival,
    generatePatti,
  } = useMandi();

  const initialProductId = route?.params?.productId;
  const initialProduct = products.find((p) => p.id === initialProductId);

  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProduct?.id || (products.length > 0 ? products[0].id : '')
  );
  const [customProductName, setCustomProductName] = useState<string>('');
  const [isCustomProduct, setIsCustomProduct] = useState<boolean>(false);
  const [quantity, setQuantity] = useState<string>('50');
  const [selectedUnit, setSelectedUnit] = useState<string>(
    initialProduct?.unit || 'Kg'
  );

  // Farmer selection
  const registeredFarmers = customers.filter(
    (c) => (c.customerType || 'Buyer') === 'Farmer'
  );
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>('');
  const [farmerName, setFarmerName] = useState<string>('');
  const [farmerMobile, setFarmerMobile] = useState<string>('');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [lotNumber, setLotNumber] = useState<string>('LOT-A101');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    setIsCustomProduct(false);
    const prod = products.find((p) => p.id === productId);
    if (prod?.unit) {
      setSelectedUnit(prod.unit);
    }
  };

  const handleSelectFarmerChip = (fId: string) => {
    const f = customers.find((c) => c.id === fId);
    if (f) {
      setSelectedFarmerId(f.id);
      setFarmerName(f.name);
      setFarmerMobile(f.mobile);
    }
  };

  const handleStepQuantity = (delta: number) => {
    const current = parseFloat(quantity) || 0;
    const next = Math.max(1, current + delta);
    setQuantity(String(next));
  };

  const handleSave = async () => {
    const cleanFarmer = farmerName.trim();
    const qtyNum = parseFloat(quantity) || 0;

    if (!cleanFarmer) {
      Alert.alert('Missing Detail', 'Please enter the Farmer or Supplier name.');
      return;
    }

    if (qtyNum <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter an arrival quantity greater than 0.');
      return;
    }

    let resolvedProductName = '';
    let resolvedCategory = 'Produce';
    let resolvedProductId = selectedProductId;

    if (isCustomProduct) {
      const cleanCustom = customProductName.trim();
      if (!cleanCustom) {
        Alert.alert('Missing Commodity', 'Please enter the commodity/product name.');
        return;
      }
      resolvedProductName = cleanCustom;
      resolvedProductId = `custom_${Date.now()}`;
    } else {
      const prod = products.find((p) => p.id === selectedProductId);
      if (!prod) {
        Alert.alert('Select Commodity', 'Please select a commodity from the catalog.');
        return;
      }
      resolvedProductName = prod.name;
      resolvedCategory = prod.category;
    }

    setIsSaving(true);

    try {
      const saved = await recordArrival({
        productId: resolvedProductId,
        productName: resolvedProductName,
        category: resolvedCategory,
        quantity: qtyNum,
        unit: selectedUnit,
        farmerName: cleanFarmer,
        farmerMobile: farmerMobile.replace(/\D/g, '') || undefined,
        farmerId: selectedFarmerId || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
        lotNumber: lotNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsSaving(false);

      Alert.alert(
        saved.recordedOffline ? 'Saved Offline 💾' : 'Arrival Recorded 🟢',
        `Arrival of ${qtyNum} ${selectedUnit} ${resolvedProductName} from ${cleanFarmer} saved.\n\nStock updated immediately. What would you like to do next?`,
        [
          {
            text: 'Sort & Grade Lot',
            onPress: () =>
              navigation.replace('GradingWastage', {
                productId: resolvedProductId,
                arrivalId: saved.id,
              }),
          },
          {
            text: 'Generate Patti',
            onPress: async () => {
              const prod = products.find((p) => p.id === resolvedProductId);
              const rate = parseFloat(prod?.price || '20') || 20;
              const gross = qtyNum * rate;
              const comm = gross * 0.05;
              const labor = 30;
              const net = gross - comm - labor;

              const patti = await generatePatti({
                arrivalId: saved.id,
                farmerId: selectedFarmerId || '4',
                farmerName: cleanFarmer,
                farmerMobile: farmerMobile || undefined,
                productName: resolvedProductName,
                gradeName: 'Grade B (Standard)',
                quantity: qtyNum,
                unit: selectedUnit,
                rate,
                grossAmount: gross,
                commissionRate: 5,
                commissionAmount: comm,
                laborCharges: labor,
                netPayable: net,
                paymentStatus: 'Pending',
                date: new Date().toISOString().split('T')[0],
              });

              navigation.replace('PattiReceipt', { pattiId: patti.id, type: 'PATTI' });
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch {
      setIsSaving(false);
      Alert.alert('Error', 'Could not save arrival record. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 25, 30),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>CALMandi</Text>
        </View>

        {/* Title & Badge */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Record Arrival (आवक)</Text>
            <Text style={styles.subtitle}>
              Inward produce from farmers with grading & patti options.
            </Text>
          </View>
        </View>

        {/* Network Status Banner */}
        <NetworkStatusBanner />

        {/* 1. Commodity Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>1. Select Commodity / Product *</Text>
          <View style={styles.chipRow}>
            {products.map((p) => {
              const isSelected = !isCustomProduct && selectedProductId === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.commodityChip,
                    isSelected && styles.commodityChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleProductSelect(p.id)}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'cube-outline'}
                    size={15}
                    color={isSelected ? '#FFFFFF' : '#16834A'}
                  />
                  <Text
                    style={[
                      styles.commodityChipText,
                      isSelected && styles.commodityChipTextSelected,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.commodityChip,
                isCustomProduct && styles.commodityChipSelected,
              ]}
              activeOpacity={0.7}
              onPress={() => setIsCustomProduct(true)}
            >
              <Ionicons
                name={isCustomProduct ? 'checkmark-circle' : 'add'}
                size={15}
                color={isCustomProduct ? '#FFFFFF' : '#16834A'}
              />
              <Text
                style={[
                  styles.commodityChipText,
                  isCustomProduct && styles.commodityChipTextSelected,
                ]}
              >
                + Other Produce
              </Text>
            </TouchableOpacity>
          </View>

          {isCustomProduct && (
            <TextInput
              style={[styles.textInput, { marginTop: 10 }]}
              placeholder="Enter Custom Commodity Name"
              placeholderTextColor="#9CA3AF"
              value={customProductName}
              onChangeText={setCustomProductName}
            />
          )}
        </View>

        {/* 2. Quantity & Unit */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>2. Arrival Quantity & Unit *</Text>
          <View style={styles.qtyControlRow}>
            <TouchableOpacity
              style={styles.stepBtn}
              activeOpacity={0.7}
              onPress={() => handleStepQuantity(-10)}
            >
              <Text style={styles.stepBtnText}>-10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepBtn}
              activeOpacity={0.7}
              onPress={() => handleStepQuantity(-1)}
            >
              <Ionicons name="remove" size={18} color="#16834A" />
            </TouchableOpacity>

            <TextInput
              style={styles.qtyInput}
              keyboardType="numeric"
              value={quantity}
              onChangeText={(t) => setQuantity(t.replace(/[^0-9.]/g, ''))}
              textAlign="center"
              selectTextOnFocus
            />

            <TouchableOpacity
              style={styles.stepBtn}
              activeOpacity={0.7}
              onPress={() => handleStepQuantity(1)}
            >
              <Ionicons name="add" size={18} color="#16834A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stepBtn}
              activeOpacity={0.7}
              onPress={() => handleStepQuantity(10)}
            >
              <Text style={styles.stepBtnText}>+10</Text>
            </TouchableOpacity>
          </View>

          {/* Unit Chips */}
          <Text style={styles.subLabel}>Unit of Measurement</Text>
          <View style={styles.unitChipRow}>
            {units.map((u) => {
              const isSelected = selectedUnit === u;
              return (
                <TouchableOpacity
                  key={u}
                  style={[
                    styles.unitChip,
                    isSelected && styles.unitChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedUnit(u)}
                >
                  <Text
                    style={[
                      styles.unitChipText,
                      isSelected && styles.unitChipTextSelected,
                    ]}
                  >
                    {u}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Farmer / Supplier Info with 1-Tap Chips */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>3. Farmer / Supplier Details *</Text>

          {registeredFarmers.length > 0 && (
            <View style={styles.quickFarmersSection}>
              <Text style={styles.subLabel}>Quick Select Registered Farmer:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.farmerChipsScroll}
              >
                {registeredFarmers.map((f) => {
                  const sel = selectedFarmerId === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      style={[
                        styles.farmerChip,
                        sel && styles.farmerChipActive,
                      ]}
                      onPress={() => handleSelectFarmerChip(f.id)}
                    >
                      <Text
                        style={[
                          styles.farmerChipText,
                          sel && styles.farmerChipTextActive,
                        ]}
                      >
                        🌾 {f.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <TextInput
            style={styles.textInput}
            placeholder="Farmer Name (e.g. Rameshwar Reddy)"
            placeholderTextColor="#9CA3AF"
            value={farmerName}
            onChangeText={(t) => {
              setFarmerName(t);
              setSelectedFarmerId('');
            }}
          />

          <TextInput
            style={[styles.textInput, { marginTop: 10 }]}
            placeholder="Contact Number (10 digits - optional)"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={10}
            value={farmerMobile}
            onChangeText={setFarmerMobile}
          />
        </View>

        {/* 4. Vehicle & Lot Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>4. Vehicle & Lot Number</Text>
          <View style={styles.twoColRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Vehicle Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. KA-04-E-4512"
                placeholderTextColor="#9CA3AF"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Lot Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. LOT-A101"
                placeholderTextColor="#9CA3AF"
                value={lotNumber}
                onChangeText={setLotNumber}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Notes / Produce Quality</Text>
          <TextInput
            style={[styles.textInput, { height: 50 }]}
            placeholder="e.g. Morning fresh harvest, direct orchard delivery"
            placeholderTextColor="#9CA3AF"
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save Arrival Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-down-circle" size={22} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Recording Arrival...' : 'Confirm Arrival & Add to Stock'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F7',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    paddingVertical: 6,
    paddingRight: 10,
  },
  backText: {
    fontSize: 16,
    color: '#16834A',
    fontWeight: '600',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16834A',
  },
  titleRow: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222222',
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 11,
    color: '#666666',
    marginTop: 8,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  commodityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    gap: 4,
  },
  commodityChipSelected: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  commodityChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  commodityChipTextSelected: {
    color: '#FFFFFF',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333333',
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: '#222222',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    height: 44,
  },
  unitChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  unitChipSelected: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555555',
  },
  unitChipTextSelected: {
    color: '#FFFFFF',
  },
  quickFarmersSection: {
    marginBottom: 8,
  },
  farmerChipsScroll: {
    gap: 6,
  },
  farmerChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  farmerChipActive: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  farmerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  farmerChipTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: '#222222',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
  },
  col: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16834A',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    elevation: 3,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
