import axios from "axios";
import config from "../config";

export type TCustomerData = {
  name: string;
  email: string;
  totalAmount: string;
  phone: string;
  transactionId: string;
};

export const initiatePayment = async (customerData: TCustomerData) => {
  const response = await axios.post(config.payment_url!, {
    store_id: config.store_id,
    signature_key: config.signature_key,
    tran_id: customerData.transactionId,
    success_url: `https://amar-shop-server-one.vercel.app/api/payment/confirmation?transactionId=${customerData.transactionId}&status=success`,
    fail_url: `https://amar-shop-server-one.vercel.app/api/payment/confirmation?transactionId=${customerData.transactionId}&status=failed`,
    cancel_url: "https://amar-shop-client.vercel.app/",
    amount: customerData.totalAmount,
    cus_name: customerData.name,
    cus_email: customerData.email,
    cus_phone: customerData.phone,
    currency: "USD",
    desc: "Merchant Registration Payment",
    cus_add1: "N/A",
    cus_add2: "N/A",
    cus_city: "Dhaka",
    cus_state: "Dhaka",
    cus_postcode: "N/A",
    cus_country: "Bangladesh",
    type: "json",
  });

  return response.data;
};

export const verifyPayment = async (tnxId: string) => {
  const response = await axios.get(config.search_url!, {
    params: {
      request_id: tnxId,
      store_id: config.store_id,
      signature_key: config.signature_key,
      type: "json",
    },
  });

  return response.data;
};
