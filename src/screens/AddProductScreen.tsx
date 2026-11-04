import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';

export default function AddProductScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { categories, units, addProduct } = useMandi();

  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [price, setPrice] = useState<string>('');

  const handleSave = () => {
    const cleanName = name.trim();

    if (!cleanName) {
      Alert.alert('Missing Details', 'Please enter a product name.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Missing Selection', 'Please select a category for the product.');
      return;
    }

    if (!selectedUnit) {
      Alert.alert('Missing Selection', 'Please select a unit for the product.');
      return;
    }

    const success = addProduct({
      name: cleanName,
      category: selectedCategory,
      unit: selectedUnit,
      quantity: quantity.trim() || '0',
      price: price.trim(),
    });

    if (success) {
      Keyboard.dismiss();
      const qtyMsg = quantity.trim() ? `${quantity.trim()} ${selectedUnit}` : selectedUnit;
      Alert.alert(
        'Product Added',
        `${cleanName} (${selectedCategory}, ${qtyMsg}) has been added successfully.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Could not add product. Please check the entered fields.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 16, 40),
            paddingBottom: Math.max(insets.bottom + 25, 35),
          },
        ]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹ Products</Text>
          </TouchableOpacity>

          <Text style={styles.logo}>CALMandi</Text>
        </View>

        <Text style={styles.title}>Add Product</Text>

        <Text style={styles.subtitle}>
          Add a new product with its category and measuring unit.
        </Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Product Name */}
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Mango, Potato, Coriander"
            placeholderTextColor="#999999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Category Selection */}
          <Text style={styles.label}>Category *</Text>
          <Text style={styles.helperText}>
            Tap a category to select:
          </Text>

          {categories.length === 0 ? (
            <View style={styles.noCategoriesBox}>
              <Text style={styles.noCategoriesText}>
                No categories available. Please add a category first.
              </Text>
              <TouchableOpacity
                style={styles.inlineAddCatButton}
                onPress={() => navigation.navigate('AddCategory')}
              >
                <Text style={styles.inlineAddCatText}>+ Add Category</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.chipGrid}>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      Keyboard.dismiss();
                      setSelectedCategory(cat.name);
                    }}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'pricetag-outline'}
                      size={18}
                      color={isSelected ? '#FFFFFF' : '#16834A'}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Unit Selection */}
          <Text style={styles.label}>Unit *</Text>
          <Text style={styles.helperText}>
            Select how this item is counted or weighed:
          </Text>

          <View style={styles.chipGrid}>
            {units.map((unit) => {
              const isSelected = selectedUnit === unit;
              return (
                <TouchableOpacity
                  key={unit}
                  style={[
                    styles.unitChip,
                    isSelected && styles.unitChipSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    Keyboard.dismiss();
                    setSelectedUnit(unit);
                  }}
                >
                  {isSelected && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#FFFFFF"
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.unitChipText,
                      isSelected && styles.unitChipTextSelected,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Numbers / Quantity Input */}
          <Text style={styles.label}>Quantity / Stock Count (Numbers) *</Text>
          <Text style={styles.helperText}>
            Enter available quantity in {selectedUnit || 'selected unit'}:
          </Text>
          <TextInput
            style={styles.input}
            placeholder={selectedUnit ? `e.g. 25 (${selectedUnit})` : 'e.g. 25, 50, 100'}
            placeholderTextColor="#999999"
            keyboardType="number-pad"
            value={quantity}
            onChangeText={(val) => setQuantity(val.replace(/\D/g, ''))}
            returnKeyType="next"
          />

          {/* Price / Rate (Optional) */}
          <Text style={styles.label}>Price / Rate (₹) (Optional)</Text>
          <Text style={styles.helperText}>
            Enter rate per {selectedUnit || 'unit'}:
          </Text>
          <TextInput
            style={styles.input}
            placeholder={selectedUnit ? `e.g. 40 (₹ per ${selectedUnit})` : 'e.g. 40, 1200'}
            placeholderTextColor="#999999"
            keyboardType="number-pad"
            value={price}
            onChangeText={(val) => setPrice(val.replace(/\D/g, ''))}
            returnKeyType="done"
          />

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.7}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
    color: '#16834A',
    fontSize: 17,
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
    marginBottom: 22,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginTop: 14,
    marginBottom: 6,
  },
  helperText: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#222222',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F7',
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9F7',
    borderWidth: 1.5,
    borderColor: '#DDDDDD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  unitChipSelected: {
    backgroundColor: '#16834A',
    borderColor: '#16834A',
  },
  unitChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  unitChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  noCategoriesBox: {
    padding: 15,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  noCategoriesText: {
    fontSize: 13,
    color: '#9A3412',
    marginBottom: 8,
  },
  inlineAddCatButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#16834A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inlineAddCatText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#16834A',
    padding: 17,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 26,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#555555',
    fontSize: 16,
    fontWeight: '600',
  },
});
