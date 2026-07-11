import { supabase } from "@/lib/supabase";

const discountRules: Record<string, { type: "percentage" | "fixed"; value: number }> = {
  SAVE10: { type: "percentage", value: 10 },
  SAVE20: { type: "fixed", value: 200 },
};

const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes("your-project-id") && !key.includes("your-supabase-anon-key"));
};

export const calculateDiscountAmount = (subtotal: number, code: string) => {
  const normalizedCode = code.trim().toUpperCase();
  const rule = discountRules[normalizedCode];

  if (!rule) {
    return { discountAmount: 0, appliedCode: null };
  }

  if (rule.type === "percentage") {
    return { discountAmount: subtotal * (rule.value / 100), appliedCode: normalizedCode };
  }

  return { discountAmount: Math.min(rule.value, subtotal), appliedCode: normalizedCode };
};

export const getShippingCost = (shippingOption: string, subtotal = 0, itemCount = 0) => {
  switch (shippingOption) {
    case "express":
      return 15;
    case "overnight":
      return 35;
    default:
      if (subtotal >= 200 || itemCount >= 3) {
        return 0;
      }
      return 8;
  }
};

export const validateDiscountCode = async (subtotal: number, code: string) => {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    return { discountAmount: 0, appliedCode: null };
  }

  if (!isSupabaseConfigured()) {
    return calculateDiscountAmount(subtotal, normalizedCode);
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("discounts")
      .select("code, type, value, min_order_value, is_active, starts_at, ends_at")
      .eq("code", normalizedCode)
      .maybeSingle();

    if (error || !data || !data.is_active) {
      return calculateDiscountAmount(subtotal, normalizedCode);
    }

    const meetsMinOrder = Number(data.min_order_value || 0) <= subtotal;
    const startsAt = data.starts_at ? new Date(data.starts_at).toISOString() : null;
    const endsAt = data.ends_at ? new Date(data.ends_at).toISOString() : null;
    const withinWindow = (!startsAt || startsAt <= now) && (!endsAt || endsAt >= now);

    if (!meetsMinOrder || !withinWindow) {
      return { discountAmount: 0, appliedCode: null };
    }

    if (data.type === "percentage") {
      return { discountAmount: subtotal * (Number(data.value) / 100), appliedCode: normalizedCode };
    }

    return { discountAmount: Math.min(Number(data.value), subtotal), appliedCode: normalizedCode };
  } catch {
    return calculateDiscountAmount(subtotal, normalizedCode);
  }
};
