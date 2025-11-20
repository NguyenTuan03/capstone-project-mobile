import { get, put } from "@/services/http/httpService";
import storageService from "@/services/storageService";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type TabType = "all" | "income" | "withdrawals";

export default function CoachPayoutsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    } catch (err: any) {
      console.error(
        "❌ Lỗi khi lấy dữ liệu ví:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    if (wallet) {
      setBankId(wallet.bank?.id || null);
      setAccountNumber(wallet.bankAccountNumber || "");
    }
  }, [wallet]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

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
      setWallet(res.data);
      setIsEditing(false);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderTransactionItem = ({ item, type }: any) => {
    // CREDIT = money IN (income), DEBIT = money OUT (withdrawal)
    const isCredit = type === "CREDIT";
    const isCompleted = item.status === "completed";

    return (
      <View
        style={[
          styles.transactionCard,
          isCredit ? styles.incomeCard : styles.expenseCard,
        ]}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionIconContainer}>
            <MaterialCommunityIcons
              name={isCredit ? "trending-up" : "bank-transfer"}
              size={22}
              color={isCredit ? "#059669" : "#EF4444"}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionTitle}>
              {isCredit
                ? item.studentName || "Thu nhập từ buổi học"
                : "Rút tiền"}
            </Text>
            <Text style={styles.transactionSubtitle}>
              {isCredit
                ? item.lesson || item.description || "Buổi học"
                : item.bankAccount || item.description}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(item.date || item.createdAt)}
            </Text>
          </View>
          <View style={styles.transactionAmountContainer}>
            <Text style={isCredit ? styles.incomeAmount : styles.expenseAmount}>
              {isCredit ? "+" : "-"}
              {formatCurrency(item.amount)}
            </Text>
            {!isCredit && item.status && (
              <View
                style={[
                  styles.statusBadge,
                  isCompleted ? styles.statusCompleted : styles.statusPending,
                ]}
              >
                <Ionicons
                  name={isCompleted ? "checkmark-circle" : "time-outline"}
                  size={12}
                  color={isCompleted ? "#059669" : "#D97706"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.statusText,
                    isCompleted
                      ? styles.statusCompletedText
                      : styles.statusPendingText,
                  ]}
                >
                  {isCompleted ? "Hoàn thành" : "Đang xử lý"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const getAllTransactions = () => {
    // All transactions are in wallet.transactions, each with type: CREDIT or DEBIT
    const transactions = wallet?.transactions || [];
    return transactions.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const getFilteredTransactions = () => {
    const transactions = wallet?.transactions || [];
    if (activeTab === "all") return getAllTransactions();
    if (activeTab === "income")
      return transactions.filter((item: any) => item.type === "CREDIT");
    return transactions.filter((item: any) => item.type === "DEBIT");
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Chưa có giao dịch</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "income"
          ? "Thu nhập từ các buổi học sẽ hiển thị ở đây"
          : activeTab === "withdrawals"
          ? "Lịch sử rút tiền sẽ hiển thị ở đây"
          : "Các giao dịch của bạn sẽ hiển thị ở đây"}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/(coach)/content")}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ví của tôi</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={[{ key: "content" }]}
          renderItem={() => (
            <View style={styles.content}>
              {/* Balance Hero Card */}
              <LinearGradient
                colors={["#059669", "#10B981"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.balanceHeroCard}
              >
                <View style={styles.balanceDecoration}>
                  <View style={[styles.decorCircle, styles.decorCircle1]} />
                  <View style={[styles.decorCircle, styles.decorCircle2]} />
                  <View style={[styles.decorCircle, styles.decorCircle3]} />
                </View>
                <Ionicons
                  name="wallet"
                  size={40}
                  color="rgba(255,255,255,0.3)"
                  style={styles.balanceIcon}
                />
                <Text style={styles.balanceLabel}>Số dư khả dụng</Text>
                <Text style={styles.balanceAmount}>
                  {formatCurrency(Number(wallet?.currentBalance || 0))}
                </Text>
                <View style={styles.totalIncomeRow}>
                  <MaterialCommunityIcons
                    name="trending-up"
                    size={16}
                    color="rgba(255,255,255,0.9)"
                  />
                  <Text style={styles.totalIncomeText}>
                    Tổng thu nhập:{" "}
                    {formatCurrency(Number(wallet?.totalIncome || 0))}
                  </Text>
                </View>
                <View style={styles.balanceActions}>
                  <TouchableOpacity style={styles.primaryActionButton}>
                    <Ionicons name="cash-outline" size={20} color="#FFF" />
                    <Text style={styles.primaryActionText}>Rút tiền</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Bank Credit Card */}
              <LinearGradient
                colors={["#1F2937", "#374151"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bankCreditCard}
              >
                <TouchableOpacity
                  onPress={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                  style={styles.editButtonCard}
                >
                  <Feather
                    name={isEditing ? "check" : "edit-2"}
                    size={18}
                    color="#F59E0B"
                  />
                </TouchableOpacity>

                <View style={styles.cardChip} />

                {isEditing ? (
                  <View style={styles.editSection}>
                    <Text style={styles.cardLabel}>Ngân hàng</Text>
                    <View style={styles.pickerContainerCard}>
                      <Picker
                        selectedValue={bankId}
                        onValueChange={(itemValue) => setBankId(itemValue)}
                        style={styles.bankPickerCard}
                      >
                        <Picker.Item
                          label="-- Chọn ngân hàng --"
                          value={null}
                        />
                        {bankList.map((b) => (
                          <Picker.Item key={b.id} label={b.name} value={b.id} />
                        ))}
                      </Picker>
                    </View>
                    <Text style={styles.cardLabel}>Số tài khoản</Text>
                    <TextInput
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      style={styles.accountNumberInputCard}
                      keyboardType="number-pad"
                      placeholder="Nhập số tài khoản"
                      placeholderTextColor="#6B7280"
                    />
                  </View>
                ) : (
                  <>
                    <Text style={styles.bankNameCard}>
                      {wallet?.bank?.name || "Chưa liên kết ngân hàng"}
                    </Text>
                    <Text style={styles.accountNumberCard}>
                      {accountNumber
                        ? `**** **** **** ${accountNumber.slice(-4)}`
                        : "---- ---- ---- ----"}
                    </Text>
                    <Text style={styles.accountHolderCard}>
                      {userName.toUpperCase()}
                    </Text>
                  </>
                )}
              </LinearGradient>

              {/* Tabs */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === "all" && styles.activeTab]}
                  onPress={() => setActiveTab("all")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "all" && styles.activeTabText,
                    ]}
                  >
                    Tất cả
                  </Text>
                  {activeTab === "all" && <View style={styles.tabIndicator} />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "income" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("income")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "income" && styles.activeTabText,
                    ]}
                  >
                    Thu nhập
                  </Text>
                  {activeTab === "income" && (
                    <View style={styles.tabIndicator} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    activeTab === "withdrawals" && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab("withdrawals")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeTab === "withdrawals" && styles.activeTabText,
                    ]}
                  >
                    Rút tiền
                  </Text>
                  {activeTab === "withdrawals" && (
                    <View style={styles.tabIndicator} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Transaction List */}
              <View style={styles.transactionSection}>
                <Text style={styles.sectionTitle}>Lịch sử giao dịch</Text>
                {getFilteredTransactions().length > 0
                  ? getFilteredTransactions().map(
                      (item: any, index: number) => (
                        <View key={index}>
                          {renderTransactionItem({ item, type: item.type })}
                        </View>
                      )
                    )
                  : renderEmptyState()}
              </View>
            </View>
          )}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
    paddingVertical: 14,
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
    padding: 16,
  },
  // Balance Hero Card
  balanceHeroCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#059669",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  balanceDecoration: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
  decorCircle: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 9999,
  },
  decorCircle1: {
    width: 140,
    height: 140,
    top: -50,
    right: -40,
  },
  decorCircle2: {
    width: 100,
    height: 100,
    bottom: -30,
    left: -30,
  },
  decorCircle3: {
    width: 60,
    height: 60,
    top: 60,
    right: 40,
  },
  balanceIcon: {
    position: "absolute",
    top: 20,
    left: 20,
  },
  balanceLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  totalIncomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  totalIncomeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
  },
  balanceActions: {
    flexDirection: "row",
    gap: 12,
  },
  primaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  primaryActionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Bank Credit Card
  bankCreditCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    minHeight: 180,
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  editButtonCard: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  cardChip: {
    width: 50,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#F59E0B",
    marginBottom: 20,
    opacity: 0.8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 6,
    marginTop: 8,
  },
  pickerContainerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  bankPickerCard: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  accountNumberInputCard: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  editSection: {
    flex: 1,
  },
  bankNameCard: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  accountNumberCard: {
    fontSize: 20,
    fontWeight: "600",
    color: "#E5E7EB",
    letterSpacing: 3,
    marginBottom: 16,
    fontFamily: "monospace",
  },
  accountHolderCard: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
    letterSpacing: 1.5,
  },
  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    position: "relative",
  },
  activeTab: {
    backgroundColor: "#F0FDF4",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#059669",
    fontWeight: "700",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "25%",
    right: "25%",
    height: 3,
    backgroundColor: "#059669",
    borderRadius: 2,
  },
  // Transaction Section
  transactionSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#059669",
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  transactionSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  transactionAmountContainer: {
    alignItems: "flex-end",
    gap: 6,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF4444",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  // Empty State
  emptyState: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
