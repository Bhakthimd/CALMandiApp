import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMandi } from '../context/MandiContext';

export default function CategoriesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { categories, products, isOwner, isOperator, canAddCategory } = useMandi();

  const handleAddCategoryPress = () => {
    if (!canAddCategory) {
      Alert.alert(
        'Owner Privilege Required',
        'Creating new master categories is reserved for the Mandi Owner.\n\nAs an operator, you can select from existing categories when updating commodities.'
      );
      return;
    }
    navigation.navigate('AddCategory');
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

        <Text style={styles.title}>Categories</Text>

        <Text style={styles.subtitle}>
          {isOwner
            ? 'Configure product classifications and market departments.'
            : 'View active mandi categories configured by the Mandi Owner.'}
        </Text>

        {/* Role Banner */}
        <View
          style={[
            styles.roleBanner,
            isOwner ? styles.ownerBannerBg : styles.operatorBannerBg,
          ]}
        >
          <Ionicons
            name={isOwner ? 'shield-checkmark' : 'lock-closed'}
            size={18}
            color={isOwner ? '#16834A' : '#D97706'}
          />
          <View style={styles.roleBannerTextWrap}>
            <Text
              style={[
                styles.roleBannerTitle,
                { color: isOwner ? '#16834A' : '#B45309' },
              ]}
            >
              {isOwner
                ? '👑 Owner: Category Management'
                : '🔒 Operator: Master Catalog View-Only'}
            </Text>
            <Text style={styles.roleBannerDesc}>
              {isOwner
                ? 'You have permission to create and organize categories'
                : 'Categories are managed by Mandi Owner to prevent catalog fragmentation'}
            </Text>
          </View>
        </View>

        {/* Add Category Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            isOperator && styles.addButtonLocked,
          ]}
          activeOpacity={0.7}
          onPress={handleAddCategoryPress}
        >
          <Ionicons
            name={isOperator ? 'lock-closed-outline' : 'add-outline'}
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.addButtonText}>
            {isOperator ? 'Add Category (Owner Protected)' : '+ Add Category'}
          </Text>
        </TouchableOpacity>

        {/* Categories List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Category List</Text>
          <View style={styles.countBadge}>
            <Text style={styles.count}>
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
            </Text>
          </View>
        </View>

        {/* Categories List */}
        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories added yet.</Text>
            <Text style={styles.emptySubtext}>
              {isOwner
                ? 'Tap "+ Add Category" to create your first category.'
                : 'Waiting for Mandi Owner to create initial categories.'}
            </Text>
          </View>
        ) : (
          categories.map((category) => {
            const matchingProducts = products.filter(
              (p) => p.category.toLowerCase() === category.name.toLowerCase()
            );

            return (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.iconContainer}>
                  <Ionicons name="pricetag-outline" size={24} color="#16834A" />
                </View>

                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryProductsText}>
                    {matchingProducts.length > 0
                      ? `${matchingProducts.length} items: ${matchingProducts
                          .map((p) => p.name)
                          .slice(0, 3)
                          .join(', ')}${
                          matchingProducts.length > 3 ? '...' : ''
                        }`
                      : 'No items currently assigned'}
                  </Text>
                </View>

                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#16834A"
                />
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
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#16834A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonLocked: {
    backgroundColor: '#64748B',
    shadowColor: '#64748B',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#333333',
  },
  countBadge: {
    backgroundColor: '#E8F4EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  count: {
    fontSize: 13,
    color: '#16834A',
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555555',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F4EC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222222',
  },
  categoryProductsText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
});
