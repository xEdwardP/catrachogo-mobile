import { WalletScreen } from '@/components/WalletScreen';
import { useOpenDrawer } from '@/lib/navigation/useOpenDrawer';

export default function DriverWalletScreen() {
  const openDrawer = useOpenDrawer();

  return (
    <WalletScreen
      emptyStateText="Aquí verás tus ganancias y retiros."
      showWithdrawalButton
      onMenuPress={openDrawer}
    />
  );
}
