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
  const payload = new URLSearchParams();

  payload.append("store_id", "mycom68879f5a838b7");
  payload.append("store_passwd", "mycom68879f5a838b7@ssl");

  payload.append("total_amount", String(customerData.totalAmount));
  payload.append("currency", "BDT");
  payload.append("tran_id", customerData.transactionId);

  payload.append(
    "success_url",
    `https://amar-shop-server-gules.vercel.app/api/payment/confirmation?transactionId=${customerData.transactionId}&status=success`,
  );
  payload.append(
    "fail_url",
    `https://amar-shop-server-gules.vercel.app/api/payment/confirmation?transactionId=${customerData.transactionId}&status=failed`,
  );
  payload.append(
    "cancel_url",
    "https://amar-shop-client.vercel.app/payment-cancel",
  );
  payload.append(
    "ipn_url",
    "https://amar-shop-server-gules.vercel.app/api/payment/ipn",
  );

  payload.append("cus_name", customerData.name);
  payload.append("cus_email", customerData.email);
  payload.append("cus_phone", customerData.phone);
  payload.append("cus_add1", "N/A");
  payload.append("cus_city", "Dhaka");
  payload.append("cus_postcode", "1000");
  payload.append("cus_country", "Bangladesh");

  payload.append("shipping_method", "NO");
  payload.append("product_name", "AmarShop Order");
  payload.append("product_category", "Ecommerce");
  payload.append("product_profile", "general");

  payload.append("type", "json");

  const response = await axios.post(config.payment_url!, payload, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
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
