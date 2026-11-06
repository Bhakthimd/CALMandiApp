import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  Linking,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { StockMovementType } from '../types';
import { getProductImage } from '../utils/productImages';

export default function CrateTallyScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { products, recordTally, tallyRecords, currentUser } = useMandi();

  const initialProductId = route?.params?.productId || (products[0] ? products[0].id : '');
  const initialMode: StockMovementType = route?.params?.initialMode || 'IN';

  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [mode, setMode] = useState<StockMovementType>(initialMode);
  const [count, setCount] = useState<number>(0);
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [partyName, setPartyName] = useState<string>('');
  const [showPartyInput, setShowPartyInput] = useState<boolean>(false);

  // Selected product object
  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const currentStock = selectedProduct ? parseFloat(selectedProduct.quantity || '0') || 0 : 0;
  const unitLabel = selectedProduct?.unit || 'Crates';

  // Projected final total available stock after this count is applied
  const projectedStock =
    mode === 'IN'
      ? currentStock + count
      : Math.max(0, currentStock - count);

  // Tap counter handlers
  const handleTapCount = () => {
    setCount((prev) => prev + 1);
  };

  const handleAdjustCount = (amount: number) => {
    setCount((prev) => Math.max(0, prev + amount));
  };

  const handleReset = () => {
    if (count === 0) return;
    Alert.alert('Reset Counter', 'Are you sure you want to reset current count to 0?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => setCount(0) },
    ]);
  };

  // Commit and save tally to live stock
  const handleSaveTally = () => {
    if (!selectedProduct) {
      Alert.alert('Error', 'Please select a commodity first.');
      return;
    }

    if (count <= 0) {
      Alert.alert(
        'Zero Count',
        `Please tap to count ${unitLabel.toLowerCase()} before saving.`
      );
      return;
    }

    if (mode === 'OUT' && count > currentStock) {
      Alert.alert(
        'Insufficient Stock',
        `Current available stock is only ${currentStock} ${unitLabel}. You are attempting to dispatch ${count} ${unitLabel}.\n\nFinal available stock will be 0 ${unitLabel}.\n\nDo you want to proceed anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Proceed Anyway',
            style: 'destructive',
            onPress: () => performSave(),
          },
        ]
      );
      return;
    }

    performSave();
  };

  const performSave = () => {
    const savedRecord = recordTally({
      productName: selectedProduct.name,
      productId: selectedProduct.id,
      unit: unitLabel,
      count,
      mode,
      vehicleNo: vehicleNo.trim().toUpperCase() || undefined,
      partyName: partyName.trim() || undefined,
    });

    const actionText =
      mode === 'IN'
        ? `Added to Stock (+${count} ${unitLabel})`
        : `Deducted from Stock (-${count} ${unitLabel})`;

    Alert.alert(
      '✅ Stock Count Updated',
      `${selectedProduct.name}: ${actionText}\n\n🎯 FINAL TOTAL AVAILABLE COUNT: ${projectedStock} ${unitLabel}\nOperator: ${currentUser?.name || 'Suresh Kumar'}`,
      [
        {
          text: 'Share WhatsApp Slip',
          onPress: () =>
            shareWhatsAppSlip(savedRecord.count, savedRecord.vehicleNo, savedRecord.partyName),
        },
        {
          text: 'Done (Count Next)',
          style: 'default',
          onPress: () => {
            setCount(0);
            setVehicleNo('');
            setPartyName('');
          },
        },
      ]
    );
  };

  // WhatsApp Tally Slip Sharing
  const shareWhatsAppSlip = async (
    tallyCount: number,
    vehNo?: string,
    party?: string
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const actionTitle =
      mode === 'IN' ? '📥 TRUCK UNLOAD (STOCK ADDED)' : '📤 TEMPO DISPATCH (STOCK SUBTRACTED)';

    const message =
      `*CAL Mandi - Live Floor Crate Tally Slip*\n` +
      `--------------------------------\n` +
      `*Action:* ${actionTitle}\n` +
      `*Commodity:* ${selectedProduct?.name} (${unitLabel})\n` +
      `*Starting Stock:* ${currentStock} ${unitLabel}\n` +
      `*Counted Quantity:* ${mode === 'IN' ? '+' : '-'}${tallyCount} ${unitLabel}\n` +
      `*FINAL TOTAL AVAILABLE COUNT:* ${projectedStock} ${unitLabel}\n` +
      (vehNo ? `*Vehicle No:* ${vehNo}\n` : '') +
      (party ? `*Party / Farmer:* ${party}\n` : '') +
      `*Operator:* ${currentUser?.name || 'Floor Operator'}\n` +
      `*Time:* Today, ${timeStr}\n` +
      `--------------------------------\n` +
      `Generated by CAL Mandi Mobile Tally Clicker`;

    try {
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Share.share({ message });
      }
    } catch {
      Share.share({ message });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 25, 30),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Tap Count (Crates & Kgs)</Text>
            <View style={styles.operatorTag}>
              <Ionicons name="finger-print" size={11} color="#0284C7" />
              <Text style={styles.operatorTagText}>LIVE FLOOR CLICKER</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={toggleTheme}
              style={styles.themeToggleBtn}
              activeOpacity={0.7}
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color={colors.gold} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.7}
              onPress={handleReset}
            >
              <Ionicons name="refresh-outline" size={16} color="#DC2626" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mode Selector: Inward (Adding to Stock) vs Outward (Subtracting from Stock) */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'IN' ? styles.modeTabActiveIn : styles.modeTabInactive,
            ]}
            activeOpacity={0.8}
            onPress={() => setMode('IN')}
          >
            <Ionicons
              name="add-circle"
              size={18}
              color={mode === 'IN' ? '#FFFFFF' : '#16834A'}
            />
            <Text
              style={[
                styles.modeTabText,
                mode === 'IN' ? styles.modeTabTextActive : styles.modeTabTextInactive,
              ]}
            >
              ➕ Add Crates/Kg (Inward)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'OUT' ? styles.modeTabActiveOut : styles.modeTabInactive,
            ]}
            activeOpacity={0.8}
            onPress={() => setMode('OUT')}
          >
            <Ionicons
              name="remove-circle"
              size={18}
              color={mode === 'OUT' ? '#FFFFFF' : '#0284C7'}
            />
            <Text
              style={[
                styles.modeTabText,
                mode === 'OUT' ? styles.modeTabTextActive : styles.modeTabTextInactive,
              ]}
            >
              ➖ Subtract Crates/Kg (Sale)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Commodity Selector Chips */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Select Commodity to Count:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.commodityScroll}
          >
            {products.map((item: any) => {
              const isSelected = item.id === selectedProductId;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.commodityChip,
                    isSelected && styles.commodityChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedProductId(item.id);
                  }}
                >
                  <Image
                    source={{ uri: getProductImage(item) }}
                    style={styles.chipThumbnail}
                  />
                  <View>
                    <Text
                      style={[
                        styles.commodityChipText,
                        isSelected && styles.commodityChipTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.chipSubtext,
                        isSelected && styles.chipSubtextSelected,
                      ]}
                    >
                      {item.quantity || 0} {item.unit}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Current vs Projected Live Bar */}
          <View style={styles.stockStatusRow}>
            <View style={styles.stockStatusLeft}>
              <Text style={styles.stockStatusLabel}>Current Stock in Mandi:</Text>
              <Text style={styles.stockStatusValue}>
                {currentStock} {unitLabel}
              </Text>
            </View>
            <View style={styles.stockStatusRight}>
              <Text style={styles.projectedLabel}>
                {mode === 'IN' ? 'Projected Available (+)' : 'Projected Available (-)'}
              </Text>
              <Text
                style={[
                  styles.projectedValue,
                  mode === 'IN' ? { color: '#16834A' } : { color: '#0284C7' },
                ]}
              >
                {projectedStock} {unitLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* Giant Digital Counter Display & Prominent Final Total Available Count */}
        <View style={styles.counterCard}>
          <View style={styles.counterTopRow}>
            <View
              style={[
                styles.counterModePill,
                mode === 'IN' ? styles.inPillBg : styles.outPillBg,
              ]}
            >
              <Text style={[styles.counterModePillText, mode === 'IN' ? { color: '#16834A' } : { color: '#0284C7' }]}>
                {mode === 'IN' ? '📥 ADDING CRATES / KG' : '📤 SUBTRACTING CRATES / KG'}
              </Text>
            </View>

            <View style={styles.selectedProductBadge}>
              <Image
                source={{ uri: getProductImage(selectedProduct) }}
                style={styles.headerProductThumb}
              />
              <Text style={styles.commodityNameHeader}>
                {selectedProduct?.name} ({unitLabel})
              </Text>
            </View>
          </View>

          {/* Tap Delta Count Row */}
          <View style={styles.tallyDeltaContainer}>
            <Text style={styles.tallyDeltaLabel}>
              {mode === 'IN' ? 'Quantity Adding to Stock:' : 'Quantity Deducting from Stock:'}
            </Text>
            <View style={styles.bigNumberRow}>
              <Text
                style={[
                  styles.bigNumber,
                  mode === 'IN' ? { color: '#16834A' } : { color: '#0284C7' },
                ]}
              >
                {mode === 'IN' ? '+' : '-'}{count}
              </Text>
              <Text style={styles.unitText}>{unitLabel}</Text>
            </View>
          </View>

          {/* 🎯 PROMINENT "FINAL TOTAL AVAILABLE COUNT" DISPLAY CARD */}
          <View
            style={[
              styles.finalAvailableCard,
              mode === 'IN' ? styles.finalAvailableInBorder : styles.finalAvailableOutBorder,
            ]}
          >
            <View style={styles.finalAvailableHeaderRow}>
              <Ionicons
                name="cube"
                size={18}
                color={mode === 'IN' ? '#16834A' : '#0284C7'}
              />
              <Text style={styles.finalAvailableTitle}>
                FINAL TOTAL AVAILABLE COUNT
              </Text>
            </View>

            <View style={styles.finalNumberRow}>
              <Text
                style={[
                  styles.finalAvailableBigNumber,
                  mode === 'IN' ? { color: '#15803D' } : { color: '#0369A1' },
                ]}
              >
                {projectedStock}
              </Text>
              <Text style={styles.finalAvailableUnitText}>{unitLabel}</Text>
            </View>

            <View style={styles.formulaPill}>
              <Text style={styles.formulaText}>
                {mode === 'IN'
                  ? `Current: ${currentStock} ${unitLabel}  +  Counted: ${count} ${unitLabel}  =  ${projectedStock} ${unitLabel} Available`
                  : `Current: ${currentStock} ${unitLabel}  -  Counted: ${count} ${unitLabel}  =  ${projectedStock} ${unitLabel} Available`}
              </Text>
            </View>

            {mode === 'OUT' && count > currentStock && (
              <View style={styles.stockAlertBanner}>
                <Ionicons name="warning" size={14} color="#DC2626" />
                <Text style={styles.stockAlertText}>
                  Count exceeds in-hand stock ({currentStock} {unitLabel}). Stock will be 0.
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.clickerHint}>
            Tap the button below for every {unitLabel.toLowerCase()} loaded or unloaded
          </Text>
        </View>

        {/* Giant Tap-To-Count Button */}
        <TouchableOpacity
          style={[
            styles.giantTapButton,
            mode === 'IN' ? styles.giantTapButtonIn : styles.giantTapButtonOut,
          ]}
          activeOpacity={0.6}
          onPress={handleTapCount}
        >
          <View style={styles.giantTapInner}>
            <Ionicons
              name={mode === 'IN' ? 'add' : 'remove'}
              size={46}
              color="#FFFFFF"
            />
            <Text style={styles.giantTapText}>
              {mode === 'IN' ? 'TAP TO ADD (+1)' : 'TAP TO SUBTRACT (-1)'}
            </Text>
          </View>
          <Text style={styles.giantTapSubtext}>
            {mode === 'IN'
              ? `Adds 1 ${unitLabel.slice(0, -1) || 'unit'} • Final becomes ${projectedStock + 1} ${unitLabel}`
              : `Subtracts 1 ${unitLabel.slice(0, -1) || 'unit'} • Final becomes ${Math.max(0, projectedStock - 1)} ${unitLabel}`}
          </Text>
        </TouchableOpacity>

        {/* Quick Batch Tap Buttons (Adding and Subtracting at your fingertips) */}
        <View style={styles.batchContainer}>
          <Text style={styles.batchSectionTitle}>Quick Tap Adjustments:</Text>

          {/* Subtraction Steppers */}
          <View style={styles.batchRow}>
            <Text style={styles.batchRowLabel}>Subtract:</Text>
            <TouchableOpacity
              style={[styles.batchBtn, styles.batchBtnSubtract]}
              activeOpacity={0.7}
              onPress={() => handleAdjustCount(-10)}
            >
              <Text style={styles.batchBtnSubText}>-10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.batchBtn, styles.batchBtnSubtract]}
              activeOpacity={0.7}
              onPress={() => handleAdjustCount(-5)}
            >
              <Text style={styles.batchBtnSubText}>-5</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.batchBtn, styles.batchBtnSubtract]}
              activeOpacity={0.7}
              onPress={() => handleAdjustCount(-1)}
            >
              <Text style={styles.batchBtnSubText}>-1</Text>
            </TouchableOpacity>
          </View>

          {/* Addition Steppers */}
          <View style={styles.batchRow}>
            <Text style={styles.batchRowLabel}>Add:</Text>
            <TouchableOpacity
              style={[styles.batchBtn, styles.batchBtnAdd]}
              activeOpacity={0.7}
              onPress={() => handleAdjustCount(1)}
            >
              <Text style={styles.batchBtnAddText}>+1</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.batchBtn, styles.batchBtnAdd]}
              activeOpacity={0.7}
              onPress={() => handleAdjustCount(5)}
            >
              <Text style={styles.batchBtnAddText}>+5</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.batchBtn, styles.batchBtnAdd]}
              activeOpacity={0.7}
              onPress={() => handleAdjustCount(10)}
            >
              <Text style={styles.batchBtnAddText}>+10</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.batchBtn, styles.batchBtnAdd]}
              activeOpacity={0.7}
              onPress={() => handleAdjustCount(20)}
            >
              <Text style={styles.batchBtnAddText}>+20</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.batchBtn, styles.batchBtnAdd]}
              activeOpacity={0.7}
              onPress={() => handleAdjustCount(50)}
            >
              <Text style={styles.batchBtnAddText}>+50</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Optional Vehicle & Party Details */}
        <View style={styles.detailsCard}>
          <TouchableOpacity
            style={styles.detailsToggleRow}
            activeOpacity={0.7}
            onPress={() => setShowPartyInput(!showPartyInput)}
          >
            <View style={styles.detailsToggleLeft}>
              <Ionicons name="bus-outline" size={18} color="#4B5563" />
              <Text style={styles.detailsToggleTitle}>
                {vehicleNo || partyName ? 'Vehicle & Party (Attached)' : 'Add Vehicle No / Party (Optional)'}
              </Text>
            </View>
            <Ionicons
              name={showPartyInput ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#6B7280"
            />
          </TouchableOpacity>

          {showPartyInput && (
            <View style={styles.detailsInputContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Vehicle / Truck Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. KA-04-E-1234"
                  placeholderTextColor={colors.textMuted}
                  value={vehicleNo}
                  onChangeText={setVehicleNo}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {mode === 'IN' ? 'Farmer / Supplier Name' : 'Buyer / Trader Name'}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'IN' ? 'e.g. Basavaraj Farmer' : 'e.g. Ravi Traders'}
                  placeholderTextColor={colors.textMuted}
                  value={partyName}
                  onChangeText={setPartyName}
                />
              </View>
            </View>
          )}
        </View>

        {/* Primary Action Button: Save & Update Mandi Stock */}
        <TouchableOpacity
          style={[styles.saveButton, count === 0 && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSaveTally}
          disabled={count === 0}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.saveButtonText}>
              Save {count} {unitLabel} & Update Stock
            </Text>
            <Text style={styles.saveButtonSubtext}>
              🎯 Final Available Stock will be {projectedStock} {unitLabel}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Shift History: Recent Tally Records */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.historyTitleRow}>
              <Ionicons name="time-outline" size={18} color="#1F2937" />
              <Text style={styles.historyTitle}>Today&apos;s Floor Tally Log</Text>
            </View>
            <View style={styles.historyCountBadge}>
              <Text style={styles.historyCountBadgeText}>
                {tallyRecords.length} Counts
              </Text>
            </View>
          </View>

          {tallyRecords.length === 0 ? (
            <Text style={styles.emptyHistoryText}>
              No tallies recorded in this shift yet.
            </Text>
          ) : (
            tallyRecords.slice(0, 5).map((item: any) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={styles.historyItemLeft}>
                  <View
                    style={[
                      styles.historyTypeIcon,
                      item.mode === 'IN'
                        ? { backgroundColor: '#E8F5EC' }
                        : { backgroundColor: '#E0F2FE' },
                    ]}
                  >
                    <Ionicons
                      name={item.mode === 'IN' ? 'arrow-down' : 'arrow-up'}
                      size={16}
                      color={item.mode === 'IN' ? '#16834A' : '#0284C7'}
                    />
                  </View>
                  <View>
                    <Text style={styles.historyProductName}>
                      {item.productName}
                    </Text>
                    <Text style={styles.historySub}>
                      {item.time} {item.vehicleNo ? `• ${item.vehicleNo}` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.historyItemRight}>
                  <Text
                    style={[
                      styles.historyCountValue,
                      item.mode === 'IN' ? { color: '#16834A' } : { color: '#0284C7' },
                    ]}
                  >
                    {item.mode === 'IN' ? '+' : '-'}
                    {item.count} {item.unit}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
  themeToggleBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: isDark ? colors.surfaceElevated : '#F1F5F9',
    borderWidth: 1,
    borderColor: colors.border,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 16,
    color: '#16834A',
    fontWeight: '700',
  },
  headerTitleBox: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  operatorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  operatorTagText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0284C7',
    marginLeft: 3,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginLeft: 2,
  },
  modeContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  modeTabActiveIn: {
    backgroundColor: '#16834A',
  },
  modeTabActiveOut: {
    backgroundColor: '#0284C7',
  },
  modeTabInactive: {
    backgroundColor: 'transparent',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  modeTabTextInactive: {
    color: colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  commodityScroll: {
    paddingVertical: 4,
  },
  commodityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  chipThumbnail: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E5E7EB',
  },
  commodityChipSelected: {
    backgroundColor: '#E8F5EC',
    borderColor: '#16834A',
  },
  commodityChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  commodityChipTextSelected: {
    color: '#16834A',
    fontWeight: '700',
  },
  chipSubtext: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  chipSubtextSelected: {
    color: '#15803D',
    fontWeight: '600',
  },
  stockStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  stockStatusLeft: {
    flex: 1,
  },
  stockStatusLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  stockStatusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: 1,
  },
  stockStatusRight: {
    alignItems: 'flex-end',
  },
  projectedLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  projectedValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 1,
  },
  counterCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  counterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  counterModePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inPillBg: {
    backgroundColor: '#E8F5EC',
  },
  outPillBg: {
    backgroundColor: '#E0F2FE',
  },
  counterModePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  selectedProductBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    gap: 6,
  },
  headerProductThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  commodityNameHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tallyDeltaContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  tallyDeltaLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bigNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bigNumber: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  unitText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  finalAvailableCard: {
    width: '100%',
    borderRadius: 14,
    backgroundColor: isDark ? colors.surface : '#F8FAF9',
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    marginVertical: 8,
  },
  finalAvailableInBorder: {
    borderColor: '#16834A',
    backgroundColor: '#F0FDF4',
  },
  finalAvailableOutBorder: {
    borderColor: '#0284C7',
    backgroundColor: '#F0F9FF',
  },
  finalAvailableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  finalAvailableTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  finalNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 2,
  },
  finalAvailableBigNumber: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1,
  },
  finalAvailableUnitText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginLeft: 8,
  },
  formulaPill: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formulaText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stockAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  stockAlertText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '600',
  },
  clickerHint: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
  },
  giantTapButton: {
    borderRadius: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  giantTapButtonIn: {
    backgroundColor: '#16834A',
  },
  giantTapButtonOut: {
    backgroundColor: '#0284C7',
  },
  giantTapInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  giantTapText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  giantTapSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 3,
    fontWeight: '600',
  },
  batchContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  batchSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  batchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  batchRowLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    width: 60,
  },
  batchBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  batchBtnSubtract: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  batchBtnSubText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  batchBtnAdd: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  batchBtnAddText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16834A',
  },
  detailsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsToggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  detailsInputContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#16834A',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  saveButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  historyCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  historyCountBadge: {
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  historyCountBadgeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyProductName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historySub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyCountValue: {
    fontSize: 14,
    fontWeight: '800',
  },
});
