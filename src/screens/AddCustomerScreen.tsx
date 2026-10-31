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
import { useMandi } from '../context/MandiContext';

export default function AddCustomerScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { addCustomer } = useMandi();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [business, setBusiness] = useState('');

  const handleSave = () => {
    const cleanName = name.trim();
    const cleanMobile = mobile.replace(/\D/g, '');
    const cleanBusiness = business.trim();

    if (!cleanName || !cleanMobile || !cleanBusiness) {
      Alert.alert('Missing Details', 'Please fill all customer fields.');
      return;
    }

    if (cleanMobile.length !== 10) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    const success = addCustomer({
      name: cleanName,
      mobile: cleanMobile,
      business: cleanBusiness,
    });

    if (success) {
      Keyboard.dismiss();
      Alert.alert(
        'Success',
        `${cleanName} has been added to your customer list.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      Alert.alert('Error', 'Could not add customer. Please check the details.');
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
            <Text style={styles.backText}>‹ Customers</Text>
          </TouchableOpacity>

          <Text style={styles.logo}>CALMandi</Text>
        </View>

        <Text style={styles.title}>Add Customer</Text>

        <Text style={styles.subtitle}>
          Enter customer details to add them to your mandi directory.
        </Text>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Customer Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ramesh Patel"
            placeholderTextColor="#999999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.label}>Mobile Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 10-digit mobile number"
            placeholderTextColor="#999999"
            keyboardType="number-pad"
            maxLength={10}
            value={mobile}
            onChangeText={(value) =>
              setMobile(value.replace(/\D/g, ''))
            }
            returnKeyType="next"
          />

          <Text style={styles.label}>Business / Mandi Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Patel Vegetable Store"
            placeholderTextColor="#999999"
            value={business}
            onChangeText={setBusiness}
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.7}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Customer</Text>
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
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#222222',
    backgroundColor: '#FFFFFF',
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
