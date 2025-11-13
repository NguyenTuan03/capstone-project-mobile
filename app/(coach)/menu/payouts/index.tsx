import storageService from "@/services/storageService";
import { Feather, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function CoachPayoutsScreen() {
  const [expenseType, setExpenseType] = useState<"Income" | "Expense">(
    "Income"
  );
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    try {
      setLoading(true);

      const token = await storageService.getToken();

      const res = await axios.get(`${API_URL}/v1/wallets/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("📦 Dữ liệu ví:", res.data);
      setWallet(res.data);
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

  const formatCurrency = (amount: any) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(num);
  };

  const renderIncomeItem = ({ item }: any) => (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <Text style={{ fontWeight: "600", fontSize: 15, color: "#222" }}>
          {item.studentName || "Học viên"}
        </Text>
        <Text style={{ fontWeight: "bold", fontSize: 16, color: "#059669" }}>
          +{formatCurrency(item.amount)}
        </Text>
      </View>
      <Text style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>
        {item.lesson || "Buổi học"}
      </Text>
      <Text style={{ color: "#aaa", fontSize: 12 }}>{item.date}</Text>
    </View>
  );

  const renderTransactionItem = ({ item }: any) => (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <View>
          <Text
            style={{
              fontWeight: "600",
              fontSize: 15,
              color: "#222",
              marginBottom: 4,
            }}
          >
            Rút tiền
          </Text>
          <Text style={{ color: "#888", fontSize: 13 }}>
            {item.bankAccount}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 16,
              color: "#dc2626",
              marginBottom: 4,
            }}
          >
            -{formatCurrency(item.amount)}
          </Text>
          <View
            style={{
              backgroundColor:
                item.status === "completed" ? "#dcfce7" : "#fef3c7",
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text
              style={{
                color: item.status === "completed" ? "#059669" : "#d97706",
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              {item.status === "completed" ? "Hoàn thành" : "Đang xử lý"}
            </Text>
          </View>
        </View>
      </View>
      <Text style={{ color: "#aaa", fontSize: 12 }}>{item.date}</Text>
    </View>
  );

  return (
    <View style={{ backgroundColor: "#fff", flex: 1, paddingHorizontal: 20 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#059669" />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 18,
            fontWeight: "600",
            color: "#111827",
          }}
        >
          Ví của bạn
        </Text>
        <View style={{ width: 24 }} />
      </View>
      <View
        style={{
          flexDirection: "row",
          alignSelf: "center",
          marginTop: 8,
          marginBottom: 16,
          backgroundColor: "#f5f5f5",
          borderRadius: 25,
          padding: 4,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor:
              expenseType === "Income" ? "#059669" : "transparent",
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: 32,
          }}
          onPress={() => setExpenseType("Income")}
        >
          <Text
            style={{
              fontWeight: "600",
              color: expenseType === "Income" ? "#fff" : "#888",
            }}
          >
            Thu nhập
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor:
              expenseType === "Expense" ? "#059669" : "transparent",
            borderRadius: 25,
            paddingVertical: 8,
            paddingHorizontal: 32,
          }}
          onPress={() => setExpenseType("Expense")}
        >
          <Text
            style={{
              fontWeight: "600",
              color: expenseType === "Expense" ? "#fff" : "#888",
            }}
          >
            Giao dịch
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#059669" />
          <Text style={{ color: "#555", marginTop: 10 }}>
            Đang tải dữ liệu...
          </Text>
        </View>
      ) : (
        <>
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              marginBottom: 20,
              alignItems: "center",
              shadowColor: "#000",
              shadowOpacity: 0.08,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }}
          >
            <Text style={{ color: "#888", fontWeight: "600", marginBottom: 8 }}>
              Số dư khả dụng
            </Text>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#059669",
                marginBottom: 20,
              }}
            >
              {formatCurrency(Number(wallet?.currentBalance))}
            </Text>

            {expenseType === "Expense" && (
              <TouchableOpacity
                style={{
                  backgroundColor: "#059669",
                  paddingVertical: 12,
                  paddingHorizontal: 40,
                  borderRadius: 12,
                  marginTop: 20,
                }}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}
                >
                  Rút tiền
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View
            style={{
              width: "100%",
              height: 180,
              borderRadius: 20,
              borderColor: "#059669",
              borderWidth: 2,
              backgroundColor: "#f5f5f5",
              overflow: "hidden",
              padding: 20,
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#059669", fontSize: 22, fontWeight: "bold" }}
              >
                {wallet.bank}
              </Text>
              <TouchableOpacity>
                <Feather name="edit" size={24} color="#059669" />
              </TouchableOpacity>
            </View>

            <Text
              style={{
                color: "#059669",
                fontSize: 20,
                letterSpacing: 2,
                marginTop: 20,
                marginBottom: 8,
              }}
            >
              {wallet.bankAccountNumber}
            </Text>

            <Text style={{ color: "#059669", fontSize: 16, fontWeight: "600" }}>
              {wallet?.userName || "NTTH"}
            </Text>
          </View>

          {expenseType === "Income" ? (
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#222",
                  marginBottom: 12,
                }}
              >
                Lịch sử thu nhập
              </Text>
              <FlatList
                data={wallet?.incomes || []}
                renderItem={renderIncomeItem}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#222",
                  marginTop: 12,
                  marginBottom: 12,
                }}
              >
                Lịch sử giao dịch
              </Text>
              <FlatList
                data={wallet?.transactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item, index) => index.toString()}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
}
