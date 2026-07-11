import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { database } from '../db/database';
import { Inventory } from '../db/models/Inventory';
import { spacing } from '../theme';
import { withObservables } from '@nozbe/watermelondb/react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const InventoryList = ({ items }: { items: Inventory[] }) => {
  const { colors, typography } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[typography.header]}>{t('inventory_title')}</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        contentContainerStyle={{ padding: spacing.md }}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isLowStock = item.lowStockThreshold ? item.quantity <= item.lowStockThreshold : false;
          return (
            <View style={[styles.card, { backgroundColor: colors.card }]}>
              <View style={styles.row}>
                <View>
                  <Text style={[typography.title, { fontWeight: 'bold' }]}>{item.itemName}</Text>
                  <Text style={[typography.caption, { color: colors.textLight, marginTop: 2 }]}>
                    {item.category}
                  </Text>
                </View>
                <View style={styles.quantityContainer}>
                  <Text style={[typography.title, { color: colors.primary, fontSize: 22 }]}>
                    {item.quantity}
                  </Text>
                  <Text style={[typography.caption, { textTransform: 'uppercase' }]}>{item.unit}</Text>
                </View>
              </View>

              {isLowStock && (
                <View style={[styles.alertBox, { backgroundColor: colors.error }]}>
                  <Ionicons name="warning" size={16} color={colors.card} />
                  <Text style={[styles.alertText, { color: colors.card }]}>{t('inventory_low_stock')}</Text>
                </View>
              )}

              <View style={[styles.actions, { borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.actionText}>{t('inventory_log_usage')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: colors.primary }]}>
                  <Text style={[styles.actionText, { color: colors.primary }]}>{t('inventory_restock')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    alignItems: 'center',
    elevation: 2,
  },
  addBtn: {
    padding: spacing.sm,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quantityContainer: {
    alignItems: 'flex-end',
  },
  alertBox: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  alertText: {
    fontWeight: 'bold',
    marginLeft: spacing.xs,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export const InventoryScreen = withObservables([], () => ({
  items: database.collections.get<Inventory>('inventory').query()
}))(InventoryList);
