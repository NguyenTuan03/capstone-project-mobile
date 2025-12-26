import { get, post, put } from "@/services/http/httpService";
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
  Modal,
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
  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);

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
      } catch (err) {}
    };
    fetchBanks();
  }, []);

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const user = await storageService.getUser();
        setUserName(user?.fullName || "");
      } catch (err) {}
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
      Alert.alert("Lỗi", "Không thể cập nhật thông tin. Vui lòng thử lại.");
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ.");
      return;
    }

    if (!wallet?.bank?.id || !accountNumber) {
      Alert.alert("Lỗi", "Vui lòng liên kết thông tin ngân hàng trước.");
      return;
    }

    try {
      setWithdrawalLoading(true);
      const token = await storageService.getToken();
      const payload = parseFloat(withdrawalAmount);

      await post(
        `${API_URL}/v1/wallets/withdrawal`,
        { amount: payload },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setWithdrawalModalVisible(false);
      setWithdrawalAmount("");
      await fetchWalletData();

      Alert.alert("Thành công", "Yêu cầu rút tiền của bạn đã thành công", [
        {
          text: "OK",
          onPress: () => {
            // Refresh the transaction list
            fetchWalletData();
          },
        },
      ]);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        "Không thể xử lý yêu cầu rút tiền. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
    } finally {
      setWithdrawalLoading(false);
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

  const getTransactionTypeLabel = (type: string) => {
    const typeUpper = type?.toUpperCase();
    switch (typeUpper) {
      case "CREDIT":
        return "Tiền vào";
      case "DEBIT":
        return "Tiền ra";
      default:
        return type || "Giao dịch";
    }
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
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={() => setWithdrawalModalVisible(true)}
                  >
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

              {/* Withdrawal Requests List */}
              {wallet?.withdrawalRequests &&
                wallet.withdrawalRequests.length > 0 && (
                  <View style={styles.withdrawalSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>Yêu cầu rút tiền</Text>
                    </View>
                    {wallet.withdrawalRequests.map((req: any, idx: number) => (
                      <View key={req.id || idx} style={styles.withdrawalCard}>
                        <View style={styles.withdrawalRow}>
                          <Ionicons
                            name={
                              req.status === "APPROVED"
                                ? "checkmark-circle"
                                : req.status === "REJECTED"
                                ? "close-circle"
                                : "time"
                            }
                            size={20}
                            color={
                              req.status === "APPROVED"
                                ? "#059669"
                                : req.status === "REJECTED"
                                ? "#EF4444"
                                : "#F59E0B"
                            }
                            style={{ marginRight: 8 }}
                          />
                          <Text style={styles.withdrawalAmount}>
                            {formatCurrency(req.amount)}
                          </Text>
                          <Text style={styles.withdrawalStatus}>
                            {req.status === "APPROVED"
                              ? "Đã duyệt"
                              : req.status === "REJECTED"
                              ? "Từ chối"
                              : "Đang xử lý"}
                          </Text>
                          <Text style={styles.withdrawalDate}>
                            {req.requestedAt
                              ? new Date(req.requestedAt).toLocaleDateString(
                                  "vi-VN"
                                )
                              : ""}
                          </Text>
                        </View>
                        {req.adminComment && (
                          <Text style={styles.withdrawalComment}>
                            {req.adminComment}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}

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

      {/* Withdrawal Modal */}
      <Modal
        visible={withdrawalModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() =>
          !withdrawalLoading && setWithdrawalModalVisible(false)
        }
      >
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() =>
                !withdrawalLoading && setWithdrawalModalVisible(false)
              }
              disabled={withdrawalLoading}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Rút tiền</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Modal Content */}
          <View style={styles.modalContent}>
            {/* Bank Info */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Thông tin ngân hàng</Text>
              <View style={styles.bankInfoCard}>
                <View style={styles.bankInfoRow}>
                  <Text style={styles.bankInfoLabel}>Ngân hàng</Text>
                  <Text style={styles.bankInfoValue}>
                    {wallet?.bank?.name || "Chưa liên kết"}
                  </Text>
                </View>
                <View style={[styles.bankInfoRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.bankInfoLabel}>Tài khoản</Text>
                  <Text style={styles.bankInfoValue}>
                    {accountNumber
                      ? `**** **** **** ${accountNumber.slice(-4)}`
                      : "Chưa liên kết"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Current Balance */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Số dư khả dụng</Text>
              <View style={styles.balanceDisplayCard}>
                <Text style={styles.balanceDisplayAmount}>
                  {formatCurrency(Number(wallet?.currentBalance || 0))}
                </Text>
              </View>
            </View>

            {/* Withdrawal Amount Input */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Số tiền cần rút</Text>
              <View style={styles.amountInputContainer}>
                <Text style={styles.amountCurrencySymbol}>₫</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="Nhập số tiền"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={withdrawalAmount}
                  onChangeText={setWithdrawalAmount}
                  editable={!withdrawalLoading}
                />
              </View>
              <Text style={styles.amountHint}>
                Tối thiểu: 1,000₫ | Tối đa:{" "}
                {formatCurrency(Number(wallet?.currentBalance || 0))}
              </Text>
            </View>

            {/* Withdrawal Fee Note */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={18} color="#059669" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Thông tin rút tiền</Text>
                <Text style={styles.infoText}>
                  • Phí rút tiền: 0₫{"\n"}• Thời gian xử lý: 1-3 ngày làm việc
                  {"\n"}• Tiền sẽ được chuyển vào tài khoản đã liên kết
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setWithdrawalAmount("");
                  setWithdrawalModalVisible(false);
                }}
                disabled={withdrawalLoading}
              >
                <Text style={styles.modalCancelButtonText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalSubmitButton,
                  withdrawalLoading && styles.modalSubmitButtonDisabled,
                ]}
                onPress={handleWithdrawal}
                disabled={withdrawalLoading}
              >
                {withdrawalLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#FFFFFF" />
                    <Text style={styles.modalSubmitButtonText}>
                      Xác nhận rút tiền
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  withdrawalSection: {
    marginBottom: 16,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  withdrawalCard: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  withdrawalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  withdrawalAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: "#059669",
    marginRight: 8,
  },
  withdrawalStatus: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 8,
    color: "#374151",
  },
  withdrawalDate: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: "auto",
  },
  withdrawalComment: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 2,
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
  // Withdrawal Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  modalContent: {
    flex: 1,
    padding: 12,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  bankInfoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bankInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  bankInfoLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  bankInfoValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  balanceDisplayCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    alignItems: "center",
  },
  balanceDisplayAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#059669",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  amountCurrencySymbol: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    paddingVertical: 12,
  },
  amountHint: {
    fontSize: 11,
    color: "#6B7280",
    marginLeft: 4,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: "#047857",
    lineHeight: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalCancelButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: "#059669",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  modalSubmitButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
