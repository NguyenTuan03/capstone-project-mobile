export const formatPrice = (v: string | number): string | number => {
    const num = typeof v === "number" ? v : parseFloat(v);
    if (typeof v !== "number" && isNaN(num)) return v;
    return new Intl.NumberFormat("vi-VN").format(num) + "đ";
  };