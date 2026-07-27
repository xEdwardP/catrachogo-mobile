import { Ionicons } from '@expo/vector-icons';
import {
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useAuth } from '@/lib/auth/AuthContext';

export function PassengerDrawerContent(props: DrawerContentComponentProps) {
  const { state, navigation, descriptors } = props;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { profile, logout } = useAuth();
  const initial = profile?.name.charAt(0).toUpperCase() ?? '?';

  return (
    <DrawerContentScrollView {...props}>
      <View style={[styles.header, { borderBottomColor: colors.surfaceHighlight }]}>
        {profile?.profilePhotoUrl ? (
          <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              { backgroundColor: colors.surfaceHighlight },
            ]}
          >
            <Text style={[styles.avatarInitial, { color: colors.tint }]}>{initial}</Text>
          </View>
        )}
        <Text style={styles.name} numberOfLines={1}>
          {profile?.name}
        </Text>
        <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>
          {profile?.email}
        </Text>
      </View>

      <View style={styles.section}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { title, drawerIcon } = descriptors[route.key].options;
          const iconColor = isFocused ? colors.tint : colors.textSecondary;
          return (
            <Pressable
              key={route.key}
              style={[styles.item, isFocused && { backgroundColor: colors.surfaceHighlight }]}
              onPress={() => navigation.navigate(route.name)}
            >
              {drawerIcon?.({ focused: isFocused, color: iconColor, size: 20 })}
              <Text
                style={[styles.itemLabel, isFocused && { color: colors.tint, fontWeight: '700' }]}
              >
                {title ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.surfaceHighlight }]} />

      <View style={styles.section}>
        <Pressable
          style={styles.item}
          onPress={() => {
            navigation.closeDrawer();
            router.push('/support');
          }}
        >
          <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.itemLabel}>Ayuda y soporte</Text>
        </Pressable>
        <Pressable style={styles.item} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.itemLabel}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    gap: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 8,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  email: {
    fontSize: 12,
  },
  section: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginTop: 12,
    marginHorizontal: 12,
  },
});
