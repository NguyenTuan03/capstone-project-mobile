import { get, put } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function LearnerPayoutsScreen() {
  const insets = useSafeAreaInsets();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [bankId, setBankId] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankList, setBankList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await get(`${API_URL}/v1/wallets/banks`);
        const data = (res as any)?.data;
        if (Array.isArray(data)) {
          setBankList(
            data
              .filter((b: any) => b && b.id && b.name)
              .map((b: any) => ({ id: b.id, name: b.name }))
          );
        } else {
          setBankList([]);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách ngân hàng:", err);
      }
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const user = await storageService.getUser();
        setUserName(user?.fullName || "");
      } catch (err) {
        console.error("Lỗi lấy tên người dùng:", err);
      }
    };
    fetchUserName();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = await storageService.getToken();
      const res = await get(`${API_URL}/v1/wallets/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallet(res.data);
      console.log("data vi", res.data);
    } catch (err: any) {
      console.error(
        "❌ Lỗi khi lấy dữ liệu ví:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (wallet) {
      setBankId(wallet.bank);
      setAccountNumber(wallet.bankAccountNumber);
    }
  }, [wallet]);

  const handleSave = async () => {
    if (!wallet?.id || !bankId) {
      Alert.alert("Lỗi", "Vui lòng chọn ngân hàng và nhập số tài khoản.");
      return;
    }

    try {
      const token = await storageService.getToken();
      const payload = {
        bank: bankId,
        bankAccountNumber: accountNumber,
      };
      const res = await put(`${API_URL}/v1/wallets/${wallet.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("✅ Cập nhật thành công:", res.data);
      setWallet(res.data);
      setIsEditing(false);

      // Reload wallet data after successful update
      await fetchWalletData();

      Alert.alert("Thành công", "Cập nhật thông tin ngân hàng thành công!");
    } catch (err: any) {
      console.error("❌ Lỗi cập nhật ví:", err.response?.data || err.message);
      Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại.");
    }
  };

  const formatCurrency = (amount: any) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const renderTransactionItem = ({ item }: any) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionTitle}>{item.description || "Giao dịch"}</Text>
          <Text style={styles.transactionSubtitle}>{item.type}</Text>
        </View>
        <View style={styles.transactionAmountContainer}>
          <Text style={styles.transactionAmount}>
            {item.type === "debit" ? "-" : "+"}
            {formatCurrency(Math.abs(item.amount))}
          </Text>
          <View
            style={[
              styles.statusBadge,
              item.status === "completed"
                ? styles.statusCompleted
                : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.status === "completed"
                  ? styles.statusCompletedText
                  : styles.statusPendingText,
              ]}
            >
              {item.status === "completed" ? "Hoàn thành" : "Đang xử lý"}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.transactionDate}>{item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ví của bạn</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={[{ type: "content" }]}
          renderItem={() => (
            <View style={styles.content}>
              {/* Balance Card */}
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                <Text style={styles.balanceAmount}>
                  {formatCurrency(Number(wallet?.currentBalance))}
                </Text>
                <TouchableOpacity style={styles.withdrawButton}>
                  <Ionicons name="cash" size={18} color="#FFFFFF" />
                  <Text style={styles.withdrawButtonText}>Rút tiền</Text>
                </TouchableOpacity>
              </View>

              {/* Bank Card */}
              <View style={styles.bankCard}>
                <View style={styles.bankCardContent}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bankLabel}>Ngân hàng</Text>
                    {isEditing ? (
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={bankId}
                          onValueChange={(itemValue) => setBankId(itemValue)}
                          style={styles.bankPicker}
                        >
                          <Picker.Item label="-- Chọn ngân hàng --" value={null} />
                          {bankList.map((b) => (
                            <Picker.Item key={b.id} label={b.name} value={b.id} />
                          ))}
                        </Picker>
                      </View>
                    ) : (
                      <Text style={styles.bankName}>
                        {wallet.bank ? wallet.bank.name || "" : ""}
                      </Text>
                    )}
                    <Text style={styles.accountNumberLabel}>Số tài khoản</Text>
                    {isEditing ? (
                      <TextInput
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                        style={styles.accountNumberInput}
                        keyboardType="number-pad"
                        placeholder="Nhập số tài khoản"
                        placeholderTextColor="#9CA3AF"
                      />
                    ) : (
                      <Text style={styles.accountNumber}>{accountNumber}</Text>
                    )}
                    <Text style={styles.accountHolder}>
                      {userName.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      isEditing ? handleSave() : setIsEditing(true)
                    }
                    style={styles.editButton}
                  >
                    <Feather
                      name={isEditing ? "check" : "edit"}
                      size={20}
                      color="#059669"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Transactions List */}
              <View style={styles.transactionSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
                  <Text style={styles.sectionAmount}>
                    {formatCurrency(Number(wallet?.totalBalance))}
                  </Text>
                </View>
                <FlatList
                  data={wallet?.transactions || []}
                  renderItem={renderTransactionItem}
                  keyExtractor={(item, index) => index.toString()}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Ionicons name="swap-horizontal" size={48} color="#D1D5DB" />
                      <Text style={styles.emptyStateText}>
                        Chưa có giao dịch nào
                      </Text>
                    </View>
                  }
                />
              </View>
            </View>
          )}
          keyExtractor={(item) => item.type}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#6B7280",
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 16,
  },
  withdrawButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
    shadowColor: "#059669",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  withdrawButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bankCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  bankCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bankLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  bankName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 12,
  },
  bankPicker: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  pickerContainer: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 12,
    overflow: "hidden",
  },
  accountNumberLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
    marginTop: 8,
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: 1,
    marginBottom: 12,
  },
  accountNumberInput: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  accountHolder: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  sectionAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
  },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  transactionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
    gap: 6,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: "#D1FAE5",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusCompletedText: {
    color: "#059669",
  },
  statusPendingText: {
    color: "#D97706",
  },
  transactionDate: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
});
