import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';
import { useTheme } from '../context/ThemeContext';
import { ThemeColors } from '../styles/theme';
import { UserRole } from '../types';

export default function StaffScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { staffMembers, addStaffMember, isOwner, switchRole, currentUser } = useMandi();

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState<UserRole>('Operator');
  const [assignedDesk, setAssignedDesk] = useState('');

  const handleAddStaff = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter staff member name.');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      Alert.alert('Invalid Mobile', 'Please enter a 10-digit mobile number.');
      return;
    }

    const success = addStaffMember({
      name: name.trim(),
      mobile: cleanMobile,
      role,
      assignedDesk: assignedDesk.trim() || 'Floor Operations Desk',
      status: 'Active',
    });

    if (success) {
      setName('');
      setMobile('');
      setAssignedDesk('');
      setModalVisible(false);
      Alert.alert('Staff Added', `${name} has been added to your Mandi team.`);
    }
  };

  const permissions = [
    {
      feature: 'View Product Catalog & Prices',
      owner: true,
      operator: true,
      note: 'Both can check live market rates',
    },
    {
      feature: 'Stock In/Out & Quantity Update',
      owner: true,
      operator: true,
      note: 'Operators update daily shipments',
    },
    {
      feature: 'Customer Directory & Calling',
      owner: true,
      operator: true,
      note: 'Both can view and contact buyers',
    },
    {
      feature: 'Add New Master Products',
      owner: true,
      operator: false,
      note: 'Restricted to Mandi Owner',
    },
    {
      feature: 'Delete Products from Catalog',
      owner: true,
      operator: false,
      note: 'Restricted to Mandi Owner',
    },
    {
      feature: 'Create Master Categories',
      owner: true,
      operator: false,
      note: 'Restricted to Mandi Owner',
    },
    {
      feature: 'View Financial Valuations & Profits',
      owner: true,
      operator: false,
      note: 'Confidential business data',
    },
    {
      feature: 'Manage Team & Assign Desks',
      owner: true,
      operator: false,
      note: 'Restricted to Mandi Owner',
    },
  ];

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

          <Text style={styles.logo}>CAL Mandi</Text>
        </View>

        <Text style={styles.title}>Team & Role Permissions</Text>

        <Text style={styles.subtitle}>
          Role-based access control for Mandi Owners and Operators.
        </Text>

        {/* Current Active Role Switcher Card */}
        <View style={styles.activeRoleCard}>
          <View style={styles.activeRoleHeader}>
            <View
              style={[
                styles.roleBadge,
                isOwner ? styles.ownerBadge : styles.operatorBadge,
              ]}
            >
              <Ionicons
                name={isOwner ? 'shield-checkmark' : 'briefcase'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.roleBadgeText}>
                Active Role: {currentUser?.role || 'Owner'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.switchButton}
              activeOpacity={0.7}
              onPress={() => {
                const targetRole: UserRole = isOwner ? 'Operator' : 'Owner';
                switchRole(targetRole);
                Alert.alert(
                  'Role Switched',
                  `Switched to ${targetRole} mode. UI and permissions updated.`
                );
              }}
            >
              <Ionicons name="swap-horizontal" size={16} color={isDark ? '#4ADE80' : '#16834A'} />
              <Text style={styles.switchButtonText}>
                Switch to {isOwner ? 'Operator' : 'Owner'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.activeRoleDescription}>
            {isOwner
              ? '👑 You are viewing as Owner. You have unrestricted access across all Mandi modules.'
              : '👷 You are viewing as Operator. Sensitive master settings and financial summaries are protected.'}
          </Text>
        </View>

        {/* Staff Members List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Mandi Staff & Operators</Text>
          {isOwner && (
            <TouchableOpacity
              style={styles.addStaffBtn}
              activeOpacity={0.7}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="person-add" size={16} color="#FFFFFF" />
              <Text style={styles.addStaffBtnText}>+ Add Staff</Text>
            </TouchableOpacity>
          )}
        </View>

        {staffMembers.map((member) => (
          <View key={member.id} style={styles.staffCard}>
            <View
              style={[
                styles.avatarCircle,
                member.role === 'Owner'
                  ? styles.ownerAvatar
                  : styles.operatorAvatar,
              ]}
            >
              <Text style={styles.avatarText}>
                {member.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.staffDetails}>
              <View style={styles.staffNameRow}>
                <Text style={styles.staffName}>{member.name}</Text>
                <View
                  style={[
                    styles.memberRoleTag,
                    member.role === 'Owner'
                      ? styles.ownerTag
                      : styles.operatorTag,
                  ]}
                >
                  <Text
                    style={[
                      styles.memberRoleTagText,
                      member.role === 'Owner'
                        ? styles.ownerTagText
                        : styles.operatorTagText,
                    ]}
                  >
                    {member.role}
                  </Text>
                </View>
              </View>

              <Text style={styles.staffDesk}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} />{' '}
                {member.assignedDesk}
              </Text>
              <Text style={styles.staffMobile}>
                <Ionicons name="call-outline" size={13} color={colors.textSecondary} />{' '}
                {member.mobile}
              </Text>
            </View>
          </View>
        ))}

        {/* Permissions Matrix Table */}
        <Text style={[styles.sectionTitle, { marginTop: 26, marginBottom: 12 }]}>
          Role Permissions Matrix
        </Text>

        <View style={styles.matrixContainer}>
          <View style={styles.matrixHeaderRow}>
            <Text style={[styles.matrixHeaderCell, { flex: 2 }]}>Feature</Text>
            <Text style={[styles.matrixHeaderCell, styles.centerText]}>
              👑 Owner
            </Text>
            <Text style={[styles.matrixHeaderCell, styles.centerText]}>
              👷 Operator
            </Text>
          </View>

          {permissions.map((perm, idx) => (
            <View
              key={idx}
              style={[
                styles.matrixRow,
                idx % 2 === 1 && styles.matrixRowAlt,
              ]}
            >
              <View style={{ flex: 2, paddingRight: 6 }}>
                <Text style={styles.permFeature}>{perm.feature}</Text>
                <Text style={styles.permNote}>{perm.note}</Text>
              </View>

              <View style={styles.centerCol}>
                <Ionicons
                  name={perm.owner ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={perm.owner ? (isDark ? '#4ADE80' : '#16834A') : (isDark ? '#F87171' : '#DC2626')}
                />
              </View>

              <View style={styles.centerCol}>
                <Ionicons
                  name={perm.operator ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={perm.operator ? (isDark ? '#4ADE80' : '#16834A') : (isDark ? '#F87171' : '#DC2626')}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Staff Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Mandi Staff Member</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Anand Gowda"
              placeholderTextColor={colors.inputPlaceholder}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Mobile Number</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="10-digit mobile"
              placeholderTextColor={colors.inputPlaceholder}
              keyboardType="number-pad"
              maxLength={10}
              value={mobile}
              onChangeText={(val) => setMobile(val.replace(/\D/g, ''))}
            />

            <Text style={styles.inputLabel}>Assigned Counter / Desk</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Weighbridge Counter #2"
              placeholderTextColor={colors.inputPlaceholder}
              value={assignedDesk}
              onChangeText={setAssignedDesk}
            />

            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.rolePickerRow}>
              {(['Operator', 'Owner'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.rolePickerChip,
                    role === r && styles.rolePickerChipActive,
                  ]}
                  onPress={() => setRole(r)}
                >
                  <Text
                    style={[
                      styles.rolePickerChipText,
                      role === r && styles.rolePickerChipTextActive,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleAddStaff}
              >
                <Text style={styles.modalSaveText}>Save Staff</Text>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 18,
    color: isDark ? colors.textPrimary : colors.primary,
    fontWeight: '600',
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: isDark ? '#4ADE80' : '#16834A',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  activeRoleCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  activeRoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ownerBadge: {
    backgroundColor: '#16834A',
  },
  operatorBadge: {
    backgroundColor: '#0284C7',
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#143823' : '#E8F5EC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: isDark ? '#1E5E35' : '#C7E8D3',
  },
  switchButtonText: {
    color: isDark ? '#4ADE80' : '#16834A',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  activeRoleDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16834A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addStaffBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  staffCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  ownerAvatar: {
    backgroundColor: isDark ? '#143823' : '#D1EAD8',
  },
  operatorAvatar: {
    backgroundColor: isDark ? '#082F49' : '#E0F2FE',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  staffDetails: {
    flex: 1,
  },
  staffNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  memberRoleTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memberRoleTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ownerTag: {
    backgroundColor: isDark ? '#143823' : '#E8F5EC',
  },
  operatorTag: {
    backgroundColor: isDark ? '#082F49' : '#E0F2FE',
  },
  ownerTagText: {
    color: isDark ? '#4ADE80' : '#16834A',
    fontSize: 11,
    fontWeight: '700',
  },
  operatorTagText: {
    color: isDark ? '#38BDF8' : '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  staffDesk: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  staffMobile: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  matrixContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matrixHeaderCell: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  centerText: {
    flex: 1,
    textAlign: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  matrixRowAlt: {
    backgroundColor: isDark ? colors.surface : '#FAFAFA',
  },
  permFeature: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  permNote: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  centerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.modalBackground,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: isDark ? colors.inputBackground : '#FFFFFF',
    marginBottom: 14,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  rolePickerChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    backgroundColor: isDark ? colors.surface : '#F9FAFB',
  },
  rolePickerChipActive: {
    borderColor: isDark ? '#4ADE80' : '#16834A',
    backgroundColor: isDark ? '#143823' : '#E8F5EC',
  },
  rolePickerChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  rolePickerChipTextActive: {
    color: isDark ? '#4ADE80' : '#16834A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: isDark ? colors.surfaceElevated : '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalSaveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#16834A',
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
