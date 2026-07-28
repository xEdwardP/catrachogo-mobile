import { WalletScreen } from '@/components/WalletScreen';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

export default function PassengerWalletScreen() {
  const openDrawer = useOpenDrawer();

  return (
    <WalletScreen
      emptyStateText="Recarga tu wallet para empezar a usar CatrachoGo."
      showTopupButton
      onMenuPress={openDrawer}
    />
  );
}
