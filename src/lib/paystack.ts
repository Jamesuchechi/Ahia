export const isPaystackConfigured = () => {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  return Boolean(publicKey && publicKey.startsWith("pk_"));
};

export const getPaystackPublicKey = () => import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";
