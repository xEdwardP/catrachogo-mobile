import { ProfileScreen } from '@/components/ProfileScreen';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

export default function AdminProfileScreen() {
  const openDrawer = useOpenDrawer();

  return <ProfileScreen onMenuPress={openDrawer} />;
}
