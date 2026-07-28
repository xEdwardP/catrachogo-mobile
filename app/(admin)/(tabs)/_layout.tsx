import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/components/AppDrawerContent';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function AdminTabsLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Drawer
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.tint,
        drawerInactiveTintColor: colors.tabIconDefault,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'stats-chart' : 'stats-chart-outline'}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Drawer.Screen
        name="drivers"
        options={{
          title: 'Conductores',
          drawerIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="trips"
        options={{
          title: 'Viajes',
          drawerIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'car' : 'car-outline'} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="withdrawals"
        options={{
          title: 'Retiros',
          drawerIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'wallet' : 'wallet-outline'} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="zones"
        options={{
          title: 'Zonas y tarifas',
          drawerIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="incident-reports"
        options={{
          title: 'Reportes de incidencias',
          drawerIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'flag' : 'flag-outline'} color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: 'Perfil',
          drawerIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
    </Drawer>
  );
}
