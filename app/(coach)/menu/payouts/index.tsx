import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CoachPayoutsScreen() {
  const [expenseType, setExpenseType] = useState("Expense");
  const [saveAccount, setSaveAccount] = useState(false);

  // Mock data cho thu nhập
  const incomeData = [
    {
      id: "1",
      studentName: "Nguyễn Văn A",
      amount: 500000,
      date: "2024-11-10",
      lesson: "Khóa học cơ bản",
    },
    {
      id: "2",
      studentName: "Trần Thị B",
      amount: 800000,
      date: "2024-11-09",
      lesson: "Khóa học nâng cao",
    },
    {
      id: "3",
      studentName: "Lê Văn C",
      amount: 300000,
      date: "2024-11-08",
      lesson: "Buổi học thử",
    },
  ];

  // Mock data cho giao dịch rút tiền
  const transactionData = [
    {
      id: "1",
      type: "withdraw",
      amount: 2000000,
      date: "2024-11-11",
      status: "completed",
      bankAccount: "Vietcombank - **** 7780",
    },
    {
      id: "2",
      type: "withdraw",
      amount: 1500000,
      date: "2024-11-05",
      status: "completed",
      bankAccount: "Vietcombank - **** 7780",
    },
    {
      id: "3",
      type: "withdraw",
      amount: 1000000,
      date: "2024-11-01",
      status: "pending",
      bankAccount: "Vietcombank - **** 7780",
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
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
        style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}
      >
        <Text style={{ fontWeight: "600", fontSize: 15, color: "#222" }}>
          {item.studentName}
        </Text>
        <Text style={{ fontWeight: "bold", fontSize: 16, color: "#059669" }}>
          +{formatCurrency(item.amount)}
        </Text>
      </View>
      <Text style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>
        {item.lesson}
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
        style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}
      >
        <View>
          <Text style={{ fontWeight: "600", fontSize: 15, color: "#222", marginBottom: 4 }}>
            Rút tiền
          </Text>
          <Text style={{ color: "#888", fontSize: 13 }}>{item.bankAccount}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={{ fontWeight: "bold", fontSize: 16, color: "#dc2626", marginBottom: 4 }}>
            -{formatCurrency(item.amount)}
          </Text>
          <View
            style={{
              backgroundColor: item.status === "completed" ? "#dcfce7" : "#fef3c7",
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
    <SafeAreaView
      style={{ backgroundColor: "#f9fafb", flex: 1, paddingHorizontal: 20 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
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

      {/* Tab Switcher */}
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
            backgroundColor: expenseType === "Income" ? "#059669" : "transparent",
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
            backgroundColor: expenseType === "Expense" ? "#059669" : "transparent",
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

      {/* Balance Card */}
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
            marginBottom: 16,
          }}
        >
          8.182.800 đ
        </Text>
        {expenseType === "Expense" && (
          <TouchableOpacity
            style={{
              backgroundColor: "#059669",
              paddingVertical: 12,
              paddingHorizontal: 40,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
              Rút tiền
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content based on selected tab */}
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
            data={incomeData}
            renderItem={renderIncomeItem}
            keyExtractor={(item) => item.id}
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
              marginBottom: 12,
            }}
          >
            Lịch sử giao dịch
          </Text>
          <FlatList
            data={transactionData}
            renderItem={renderTransactionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 8 },
  title: { fontWeight: "700", color: "#111827" },
  meta: { color: "#6B7280" },
});