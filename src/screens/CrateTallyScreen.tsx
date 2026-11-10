import React, { useState, useMemo } from 'react';
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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeColors } from '../styles/theme';
import { StockMovementType } from '../types';
import { getProductImage } from '../utils/productImages';

export default function CrateTallyScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { products, recordTally, tallyRecords, currentUser } = useMandi();

  const initialProductId = route?.params?.productId || (products[0] ? products[0].id : '');
  const initialMode: StockMovementType = route?.params?.initialMode || 'IN';

  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [mode, setMode] = useState<StockMovementType>(initialMode);
  const [count, setCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Optional collapsible details
  const [showOptionalDetails, setShowOptionalDetails] = useState<boolean>(false);
  const [vehicleNo, setVehicleNo] = useState<string>('');
  const [partyName, setPartyName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Manual entry modal
  const [manualModalVisible, setManualModalVisible] = useState<boolean>(false);
  const [manualInputVal, setManualInputVal] = useState<string>('');

  // History view all toggle
  const [showAllHistory, setShowAllHistory] = useState<boolean>(false);

  // Selected product object
  const selectedProduct =
    products.find((p) => p.id === selectedProductId) || products[0];

  const currentStock = selectedProduct ? parseFloat(selectedProduct.quantity || '0') || 0 : 0;
  const unitLabel = selectedProduct?.unit || 'Crates';

  // Projected stock
  const projectedStock =
    mode === 'IN'
      ? currentStock + count
      : Math.max(0, currentStock - count);

  const isDeficit = mode === 'OUT' && count > currentStock;

  // Counter adjustment handlers
  const handleTapMain = () => {
    setCount((prev) => prev + 1);
  };

  const handleAdjust = (delta: number) => {
    setCount((prev) => Math.max(0, prev + delta));
  };

  const handleReset = () => {
    if (count === 0) return;
    Alert.alert(
      t('reset', 'Reset Counter'),
      'Are you sure you want to reset current count to 0?',
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        { text: t('reset', 'Reset'), style: 'destructive', onPress: () => setCount(0) },
      ]
    );
  };

  const openManualModal = () => {
    setManualInputVal(count > 0 ? count.toString() : '');
    setManualModalVisible(true);
  };

  const applyManualInput = () => {
    const parsed = parseInt(manualInputVal, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setCount(parsed);
    }
    setManualModalVisible(false);
  };

  // Save stock update
  const handleSaveTally = () => {
    if (!selectedProduct) {
      Alert.alert(t('error', 'Error'), t('selectCommodity', 'Please select a commodity first.'));
      return;
    }

    if (count <= 0) {
      Alert.alert(
        t('zeroCount', 'Zero Count'),
        `Please tap to count ${unitLabel.toLowerCase()} before saving.`
      );
      return;
    }

    if (isDeficit) {
      Alert.alert(
        t('insufficientStock', 'Insufficient Stock'),
        `${t('insufficientStockMsg', 'Cannot deduct more than available stock')}. Available: ${currentStock} ${unitLabel}.`
      );
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
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
          ? `+${count} ${unitLabel} (${t('addStock', 'Added to Stock')})`
          : `-${count} ${unitLabel} (${t('subtractStock', 'Deducted from Stock')})`;

      Alert.alert(
        `✅ ${t('stockUpdatedSuccess', 'Stock Count Updated')}`,
        `${selectedProduct.name}: ${actionText}\n\n🎯 ${t('finalAvailableStock', 'Final Available Stock')}: ${projectedStock} ${unitLabel}\nOperator: ${currentUser?.name || 'Floor Operator'}`,
        [
          {
            text: 'WhatsApp Slip',
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
              setNotes('');
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Stock Operation Blocked', err?.message || 'Could not update stock count.');
    } finally {
      setIsSubmitting(false);
    }
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
      mode === 'IN' ? '📥 TRUCK UNLOAD (STOCK ADDED)' : '📤 TEMPO DISPATCH (STOCK DEDUCTED)';

    const message =
      `*CAL Mandi - Live Floor Tap Count Slip*\n` +
      `--------------------------------\n` +
      `*Action:* ${actionTitle}\n` +
      `*Commodity:* ${selectedProduct?.name} (${unitLabel})\n` +
      `*Starting Stock:* ${currentStock} ${unitLabel}\n` +
      `*Counted Quantity:* ${mode === 'IN' ? '+' : '-'}${tallyCount} ${unitLabel}\n` +
      `*FINAL TOTAL AVAILABLE STOCK:* ${projectedStock} ${unitLabel}\n` +
      (vehNo ? `*Vehicle No:* ${vehNo}\n` : '') +
      (party ? `*Party / Trader:* ${party}\n` : '') +
      `*Operator:* ${currentUser?.name || 'Floor Operator'}\n` +
      `*Time:* Today, ${timeStr}\n` +
      `--------------------------------\n` +
      `Generated by CAL Mandi Ops`;

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

  // History list to display
  const displayedHistory = showAllHistory ? tallyRecords : tallyRecords.slice(0, 4);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 12, 36),
            paddingBottom: Math.max(insets.bottom + 24, 30),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Header: Clean title, back navigation, no clutter */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            <Text style={styles.backText}>{t('back', 'Back')}</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('tapCount', 'Tap Count')}</Text>

          {count > 0 ? (
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.7}
              onPress={handleReset}
            >
              <Ionicons name="refresh" size={14} color="#DC2626" />
              <Text style={styles.resetButtonText}>{t('reset', 'Reset')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.headerRightSpacer} />
          )}
        </View>

        {/* 2. Add / Subtract Toggle: One compact segmented control */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'IN' && styles.modeTabActiveIn,
            ]}
            activeOpacity={0.8}
            onPress={() => setMode('IN')}
          >
            <Ionicons
              name="add-circle"
              size={18}
              color={mode === 'IN' ? '#FFFFFF' : (isDark ? '#4ADE80' : '#16834A')}
            />
            <Text
              style={[
                styles.modeTabText,
                mode === 'IN' ? styles.modeTabTextActive : styles.modeTabTextInactive,
              ]}
            >
              {t('addStock', 'Add Stock')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTab,
              mode === 'OUT' && styles.modeTabActiveOut,
            ]}
            activeOpacity={0.8}
            onPress={() => setMode('OUT')}
          >
            <Ionicons
              name="remove-circle"
              size={18}
              color={mode === 'OUT' ? '#FFFFFF' : (isDark ? '#38BDF8' : '#0284C7')}
            />
            <Text
              style={[
                styles.modeTabText,
                mode === 'OUT' ? styles.modeTabTextActive : styles.modeTabTextInactive,
              ]}
            >
              {t('subtractStock', 'Subtract Stock')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Commodity Selection: Compact 2-3 column grid with photos */}
        <View style={styles.commoditySection}>
          <Text style={styles.sectionTitle}>{t('selectCommodity', 'Select Commodity')}</Text>
          <View style={styles.commodityGrid}>
            {products.map((item: any) => {
              const isSelected = item.id === selectedProductId;
              const itemStock = parseFloat(item.quantity || '0') || 0;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.commodityCard,
                    isSelected && (mode === 'IN' ? styles.commodityCardSelectedIn : styles.commodityCardSelectedOut),
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedProductId(item.id);
                  }}
                >
                  <Image
                    source={{ uri: getProductImage(item) }}
                    style={styles.commodityThumb}
                  />
                  <Text
                    style={[
                      styles.commodityName,
                      isSelected && (mode === 'IN' ? styles.commodityNameSelectedIn : styles.commodityNameSelectedOut),
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.commodityStock}>
                    {itemStock} {item.unit || 'Crates'}
                  </Text>
                  {isSelected && (
                    <View
                      style={[
                        styles.selectedCheckBadge,
                        mode === 'IN' ? { backgroundColor: '#16834A' } : { backgroundColor: '#0284C7' },
                      ]}
                    >
                      <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Quantity Adjustment Area: Single current stock display, calculator feel */}
        <View style={styles.calculatorCard}>
          {/* Current Stock Banner - Displayed only ONCE */}
          <View style={styles.currentStockBanner}>
            <View style={styles.currentStockLeft}>
              <Image
                source={{ uri: getProductImage(selectedProduct) }}
                style={styles.bannerThumb}
              />
              <Text style={styles.bannerProductName} numberOfLines={1}>
                {selectedProduct?.name}
              </Text>
            </View>
            <View style={styles.currentStockBadge}>
              <Text style={styles.currentStockLabel}>{t('currentStock', 'Current Stock')}:</Text>
              <Text style={styles.currentStockValue}>
                {currentStock} {unitLabel}
              </Text>
            </View>
          </View>

          {/* Large Tap-to-Count Area */}
          <TouchableOpacity
            style={[
              styles.mainTapArea,
              mode === 'IN' ? styles.mainTapAreaIn : styles.mainTapAreaOut,
            ]}
            activeOpacity={0.7}
            onPress={handleTapMain}
          >
            <Text style={styles.tapActionHint}>
              {mode === 'IN'
                ? t('tapToIncrement', 'Tap anywhere to add +1')
                : t('tapToDecrement', 'Tap anywhere to subtract -1')}
            </Text>

            <View style={styles.giantQuantityRow}>
              <Text
                style={[
                  styles.giantQuantitySign,
                  mode === 'IN' ? { color: '#16834A' } : { color: '#0284C7' },
                ]}
              >
                {mode === 'IN' ? '+' : '-'}
              </Text>
              <Text
                style={[
                  styles.giantQuantityNumber,
                  mode === 'IN' ? { color: '#16834A' } : { color: '#0284C7' },
                ]}
              >
                {count}
              </Text>
              <Text style={styles.giantQuantityUnit}>{unitLabel}</Text>
            </View>

            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.7}
                onPress={() => handleAdjust(-1)}
              >
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
                <Text style={styles.stepperBtnText}>-1</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.manualEntryBtn}
                activeOpacity={0.7}
                onPress={openManualModal}
              >
                <Ionicons name="keypad-outline" size={15} color={colors.textPrimary} />
                <Text style={styles.manualEntryBtnText}>{t('manualEntry', 'Manual')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.stepperBtn}
                activeOpacity={0.7}
                onPress={() => handleAdjust(1)}
              >
                <Ionicons name="add" size={18} color={colors.textPrimary} />
                <Text style={styles.stepperBtnText}>+1</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Quick Adjustment Buttons */}
          <View style={styles.quickAdjustSection}>
            <Text style={styles.quickAdjustHeader}>{t('quickAdjust', 'Quick Adjust')}:</Text>

            {/* Add adjustments: +1, +5, +10, +20, +50 */}
            <View style={styles.quickRow}>
              <Text style={styles.quickRowLabel}>{t('add', 'Add')}:</Text>
              {[1, 5, 10, 20, 50].map((num) => (
                <TouchableOpacity
                  key={`add_${num}`}
                  style={[styles.quickBtn, styles.quickBtnAdd]}
                  activeOpacity={0.7}
                  onPress={() => handleAdjust(num)}
                >
                  <Text style={styles.quickBtnAddText}>+{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Subtract adjustments: -1, -5, -10 */}
            <View style={styles.quickRow}>
              <Text style={styles.quickRowLabel}>{t('subtract', 'Subtract')}:</Text>
              {[1, 5, 10].map((num) => (
                <TouchableOpacity
                  key={`sub_${num}`}
                  style={[styles.quickBtn, styles.quickBtnSub]}
                  activeOpacity={0.7}
                  onPress={() => handleAdjust(-num)}
                >
                  <Text style={styles.quickBtnSubText}>-{num}</Text>
                </TouchableOpacity>
              ))}
              {count > 0 && (
                <TouchableOpacity
                  style={[styles.quickBtn, styles.quickBtnClear]}
                  activeOpacity={0.7}
                  onPress={() => setCount(0)}
                >
                  <Text style={styles.quickBtnClearText}>Clear (0)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* 5. Final Stock Calculation Result Box */}
        <View
          style={[
            styles.finalResultCard,
            isDeficit
              ? styles.finalResultDeficit
              : mode === 'IN'
              ? styles.finalResultIn
              : styles.finalResultOut,
          ]}
        >
          <View style={styles.finalResultHeaderRow}>
            <Ionicons
              name={isDeficit ? 'alert-circle' : 'cube'}
              size={18}
              color={isDeficit ? '#DC2626' : mode === 'IN' ? '#16834A' : '#0284C7'}
            />
            <Text
              style={[
                styles.finalResultTitle,
                isDeficit && { color: '#DC2626' },
              ]}
            >
              {t('finalAvailableStock', 'FINAL AVAILABLE STOCK')}
            </Text>
          </View>

          <View style={styles.finalBigRow}>
            <Text
              style={[
                styles.finalBigNumber,
                isDeficit
                  ? { color: '#DC2626' }
                  : mode === 'IN'
                  ? { color: '#15803D' }
                  : { color: '#0369A1' },
              ]}
            >
              {projectedStock}
            </Text>
            <Text style={styles.finalUnit}>{unitLabel}</Text>
          </View>

          <Text style={styles.finalFormula}>
            {mode === 'IN'
              ? `${currentStock} ${unitLabel} (Current) + ${count} (Added) = ${projectedStock} ${unitLabel}`
              : `${currentStock} ${unitLabel} (Current) - ${count} (Deducted) = ${projectedStock} ${unitLabel}`}
          </Text>

          {isDeficit && (
            <View style={styles.deficitWarningBox}>
              <Ionicons name="warning-outline" size={15} color="#DC2626" />
              <Text style={styles.deficitWarningText}>
                {t('insufficientStockMsg', 'Cannot deduct more than available stock')}. Current: {currentStock} {unitLabel}.
              </Text>
            </View>
          )}
        </View>

        {/* 6. Optional Information: Collapsible section */}
        <View style={styles.collapsibleCard}>
          <TouchableOpacity
            style={styles.collapsibleHeader}
            activeOpacity={0.7}
            onPress={() => setShowOptionalDetails(!showOptionalDetails)}
          >
            <View style={styles.collapsibleHeaderLeft}>
              <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.collapsibleHeaderText}>
                {vehicleNo || partyName
                  ? `Vehicle & Party Attached: ${vehicleNo || partyName}`
                  : t('optionalDetailsTitle', 'Vehicle & Party Details (Optional)')}
              </Text>
            </View>
            <Ionicons
              name={showOptionalDetails ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showOptionalDetails && (
            <View style={styles.collapsibleBody}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('vehicleNumber', 'Vehicle Number')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. KA-04-E-1234"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={vehicleNo}
                  onChangeText={setVehicleNo}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  {mode === 'IN'
                    ? t('farmerSupplierName', 'Farmer / Supplier Name')
                    : t('buyerTraderName', 'Buyer / Trader Name')}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={mode === 'IN' ? 'e.g. Basavaraj' : 'e.g. Ravi Traders'}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={partyName}
                  onChangeText={setPartyName}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('notes', 'Notes')}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Optional remarks or lot number"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>
            </View>
          )}
        </View>

        {/* 7. Save Action: Single prominent button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            mode === 'IN' ? styles.saveButtonIn : styles.saveButtonOut,
            (count === 0 || isDeficit || isSubmitting) && styles.saveButtonDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleSaveTally}
          disabled={count === 0 || isDeficit || isSubmitting}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>
            {count === 0
              ? `${t('saveStockUpdate', 'Save Stock Update')} (Count first)`
              : isDeficit
              ? t('insufficientStock', 'Insufficient Stock')
              : `${t('saveStockUpdate', 'Save Stock Update')} (${mode === 'IN' ? '+' : '-'}${count} ${unitLabel})`}
          </Text>
        </TouchableOpacity>

        {/* 8. Today's Floor Tally History: Compact list below save button */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View style={styles.historyTitleRow}>
              <Ionicons name="time-outline" size={17} color={colors.textPrimary} />
              <Text style={styles.historyTitle}>{t('todaysFloorTally', "Today's Floor Tally History")}</Text>
            </View>
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>{tallyRecords.length} Tallies</Text>
            </View>
          </View>

          {tallyRecords.length === 0 ? (
            <Text style={styles.emptyHistoryText}>
              {t('noTalliesYet', 'No tallies recorded in this shift yet.')}
            </Text>
          ) : (
            displayedHistory.map((item: any) => {
              const isIn = item.mode === 'IN';
              return (
                <View key={item.id} style={styles.historyRow}>
                  <View style={styles.historyRowLeft}>
                    <View
                      style={[
                        styles.historyModeTag,
                        isIn ? styles.historyModeTagIn : styles.historyModeTagOut,
                      ]}
                    >
                      <Ionicons
                        name={isIn ? 'arrow-down' : 'arrow-up'}
                        size={14}
                        color={isIn ? '#16834A' : '#0284C7'}
                      />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyProductName} numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text style={styles.historyMeta}>
                        {item.time} {item.vehicleNo ? `• ${item.vehicleNo}` : ''}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.historyQuantity,
                      isIn ? { color: '#16834A' } : { color: '#0284C7' },
                    ]}
                  >
                    {isIn ? '+' : '-'}{item.count} {item.unit}
                  </Text>
                </View>
              );
            })
          )}

          {tallyRecords.length > 4 && (
            <TouchableOpacity
              style={styles.viewAllToggle}
              activeOpacity={0.7}
              onPress={() => setShowAllHistory(!showAllHistory)}
            >
              <Text style={styles.viewAllToggleText}>
                {showAllHistory
                  ? t('showLess', 'Show Less ▲')
                  : `${t('viewAll', 'View All')} (${tallyRecords.length}) ▼`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Manual Quantity Entry Modal */}
      <Modal
        visible={manualModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('enterQuantity', 'Enter Quantity Manually')}</Text>
              <TouchableOpacity
                onPress={() => setManualModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>{selectedProduct?.name} ({unitLabel})</Text>

            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              autoFocus
              value={manualInputVal}
              onChangeText={setManualInputVal}
              placeholder="0"
              placeholderTextColor={colors.inputPlaceholder}
              maxLength={6}
            />

            {/* Quick Presets */}
            <View style={styles.modalPresetRow}>
              {[10, 25, 50, 100, 200].map((val) => (
                <TouchableOpacity
                  key={`preset_${val}`}
                  style={styles.modalPresetBtn}
                  onPress={() => setManualInputVal(val.toString())}
                >
                  <Text style={styles.modalPresetText}>{val}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setManualModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>{t('cancel', 'Cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalApplyBtn,
                  mode === 'IN' ? { backgroundColor: '#16834A' } : { backgroundColor: '#0284C7' },
                ]}
                onPress={applyManualInput}
              >
                <Text style={styles.modalApplyText}>{t('apply', 'Set Quantity')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
    },
    // 1. Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    backText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    headerRightSpacer: {
      width: 48,
    },
    resetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: isDark ? '#3B1212' : '#FEE2E2',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
    },
    resetButtonText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#DC2626',
    },

    // 2. Add / Subtract Segmented Control
    modeContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? colors.surfaceElevated : '#E5E7EB',
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
      borderRadius: 9,
      gap: 6,
    },
    modeTabActiveIn: {
      backgroundColor: '#16834A',
    },
    modeTabActiveOut: {
      backgroundColor: '#0284C7',
    },
    modeTabText: {
      fontSize: 14,
      fontWeight: '700',
    },
    modeTabTextActive: {
      color: '#FFFFFF',
    },
    modeTabTextInactive: {
      color: colors.textSecondary,
    },

    // 3. Commodity Selection Grid
    commoditySection: {
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    commodityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    commodityCard: {
      width: '31.3%',
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 8,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      position: 'relative',
    },
    commodityCardSelectedIn: {
      borderColor: '#16834A',
      backgroundColor: isDark ? '#143823' : '#F0FDF4',
    },
    commodityCardSelectedOut: {
      borderColor: '#0284C7',
      backgroundColor: isDark ? '#082F49' : '#F0F9FF',
    },
    commodityThumb: {
      width: 42,
      height: 42,
      borderRadius: 8,
      marginBottom: 6,
      backgroundColor: isDark ? colors.surface : '#F3F4F6',
    },
    commodityName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: 2,
    },
    commodityNameSelectedIn: {
      color: isDark ? '#4ADE80' : '#16834A',
      fontWeight: '700',
    },
    commodityNameSelectedOut: {
      color: isDark ? '#38BDF8' : '#0284C7',
      fontWeight: '700',
    },
    commodityStock: {
      fontSize: 10,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    selectedCheckBadge: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },

    // 4. Quantity Adjustment Area
    calculatorCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 14,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currentStockBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? colors.surfaceElevated : '#F9FAFB',
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    currentStockLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    bannerThumb: {
      width: 24,
      height: 24,
      borderRadius: 6,
    },
    bannerProductName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    currentStockBadge: {
      alignItems: 'flex-end',
    },
    currentStockLabel: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    currentStockValue: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },

    // Main Tap-to-count surface
    mainTapArea: {
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 12,
      alignItems: 'center',
      borderWidth: 2,
      marginBottom: 12,
    },
    mainTapAreaIn: {
      backgroundColor: isDark ? '#143823' : '#F0FDF4',
      borderColor: isDark ? '#22C55E' : '#86EFAC',
    },
    mainTapAreaOut: {
      backgroundColor: isDark ? '#082F49' : '#F0F9FF',
      borderColor: isDark ? '#38BDF8' : '#BAE6FD',
    },
    tapActionHint: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
      textAlign: 'center',
    },
    giantQuantityRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'center',
      marginVertical: 4,
    },
    giantQuantitySign: {
      fontSize: 36,
      fontWeight: '900',
      marginRight: 4,
    },
    giantQuantityNumber: {
      fontSize: 52,
      fontWeight: '900',
      letterSpacing: -1,
    },
    giantQuantityUnit: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
      marginLeft: 6,
    },

    // Stepper buttons
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: 8,
    },
    stepperBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    stepperBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    manualEntryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    manualEntryBtnText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },

    // Quick adjustment pills
    quickAdjustSection: {
      marginTop: 4,
    },
    quickAdjustHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    quickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    quickRowLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      width: 54,
    },
    quickBtn: {
      flex: 1,
      height: 34,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    quickBtnAdd: {
      backgroundColor: isDark ? '#143823' : '#F0FDF4',
      borderColor: isDark ? '#1E5E35' : '#BBF7D0',
    },
    quickBtnAddText: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#4ADE80' : '#16834A',
    },
    quickBtnSub: {
      backgroundColor: isDark ? '#3B1212' : '#FEF2F2',
      borderColor: isDark ? '#7F1D1D' : '#FECACA',
    },
    quickBtnSubText: {
      fontSize: 12,
      fontWeight: '800',
      color: isDark ? '#F87171' : '#DC2626',
    },
    quickBtnClear: {
      flex: 1.3,
      backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
      borderColor: colors.border,
    },
    quickBtnClearText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },

    // 5. Final Stock Calculation Result Box
    finalResultCard: {
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
      borderWidth: 2,
      marginBottom: 14,
    },
    finalResultIn: {
      backgroundColor: isDark ? '#143823' : '#F0FDF4',
      borderColor: '#16834A',
    },
    finalResultOut: {
      backgroundColor: isDark ? '#082F49' : '#F0F9FF',
      borderColor: '#0284C7',
    },
    finalResultDeficit: {
      backgroundColor: isDark ? '#3B1212' : '#FEF2F2',
      borderColor: '#DC2626',
    },
    finalResultHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    finalResultTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    finalBigRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginVertical: 2,
    },
    finalBigNumber: {
      fontSize: 44,
      fontWeight: '900',
      letterSpacing: -1,
    },
    finalUnit: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
      marginLeft: 6,
    },
    finalFormula: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 2,
    },
    deficitWarningBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      marginTop: 8,
      gap: 6,
    },
    deficitWarningText: {
      fontSize: 11,
      color: '#DC2626',
      fontWeight: '700',
    },

    // 6. Optional Information
    collapsibleCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    collapsibleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    collapsibleHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      marginRight: 8,
    },
    collapsibleHeaderText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      flex: 1,
    },
    collapsibleBody: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    formGroup: {
      marginBottom: 10,
    },
    formLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 13,
      color: colors.textPrimary,
      backgroundColor: isDark ? colors.surface : '#F9FAFB',
    },

    // 7. Save Action
    saveButton: {
      flexDirection: 'row',
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 16,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 5,
      elevation: 3,
    },
    saveButtonIn: {
      backgroundColor: '#16834A',
      shadowColor: '#16834A',
    },
    saveButtonOut: {
      backgroundColor: '#0284C7',
      shadowColor: '#0284C7',
    },
    saveButtonDisabled: {
      backgroundColor: '#9CA3AF',
      shadowOpacity: 0,
      elevation: 0,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },

    // 8. Today's Floor Tally History
    historyCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    historyTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    historyBadge: {
      backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    historyBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    emptyHistoryText: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      paddingVertical: 12,
    },
    historyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    historyModeTag: {
      width: 28,
      height: 28,
      borderRadius: 7,
      justifyContent: 'center',
      alignItems: 'center',
    },
    historyModeTagIn: {
      backgroundColor: isDark ? '#143823' : '#E8F5EC',
    },
    historyModeTagOut: {
      backgroundColor: isDark ? '#082F49' : '#E0F2FE',
    },
    historyInfo: {
      flex: 1,
    },
    historyProductName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    historyMeta: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    historyQuantity: {
      fontSize: 14,
      fontWeight: '800',
      marginLeft: 8,
    },
    viewAllToggle: {
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: 4,
    },
    viewAllToggleText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalCard: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modalSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    modalInput: {
      fontSize: 32,
      fontWeight: '900',
      textAlign: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 10,
      backgroundColor: isDark ? colors.surface : '#F9FAFB',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    modalPresetRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 6,
      marginBottom: 16,
    },
    modalPresetBtn: {
      flex: 1,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
      alignItems: 'center',
    },
    modalPresetText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
    },
    modalCancelBtn: {
      flex: 1,
      paddingVertical: 11,
      borderRadius: 10,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalCancelText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modalApplyBtn: {
      flex: 1.5,
      paddingVertical: 11,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalApplyText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
