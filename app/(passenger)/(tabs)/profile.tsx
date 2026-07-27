import { ProfileScreen } from '@/components/ProfileScreen';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

export default function PassengerProfileScreen() {
  const openDrawer = useOpenDrawer();

  return <ProfileScreen onMenuPress={openDrawer} />;
}
