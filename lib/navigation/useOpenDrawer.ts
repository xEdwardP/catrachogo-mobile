import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';

export function useOpenDrawer() {
  const navigation = useNavigation();
  return () => navigation.dispatch(DrawerActions.openDrawer());
}
