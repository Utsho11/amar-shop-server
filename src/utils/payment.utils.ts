import axios from "axios";
import config from "../config";

export type TCustomerData = {
  name?: string;
  email: string;
  totalAmount: string | number;
  phone?: string;
  transactionId: string;
};

export const initiatePayment = async (customerData: TCustomerData) => {
  const payload = new URLSearchParams();

  payload.append("store_id", config.store_id || "testbox");
  payload.append("store_passwd", config.store_passwd || "qwerty");

  payload.append("total_amount", String(customerData.totalAmount));
  payload.append("currency", "BDT");
  payload.append("tran_id", customerData.transactionId);

  payload.append(
    "success_url",
    `${config.server_base_url}/api/payment/confirmation?transactionId=${customerData.transactionId}&status=success`,
  );
  payload.append(
    "fail_url",
    `${config.server_base_url}/api/payment/confirmation?transactionId=${customerData.transactionId}&status=failed`,
  );
  payload.append(
    "cancel_url",
    `${config.server_base_url}/api/payment/confirmation?transactionId=${customerData.transactionId}&status=cancel`,
  );
  payload.append(
    "ipn_url",
    `${config.server_base_url}/api/payment/ipn`,
  );

  payload.append("cus_name", customerData.name || "Customer");
  payload.append("cus_email", customerData.email);
  payload.append("cus_phone", customerData.phone || "01700000000");
  payload.append("cus_add1", "Dhaka");
  payload.append("cus_city", "Dhaka");
  payload.append("cus_postcode", "1000");
  payload.append("cus_country", "Bangladesh");

  payload.append("shipping_method", "NO");
  payload.append("product_name", "AmarShop Products");
  payload.append("product_category", "Ecommerce");
  payload.append("product_profile", "general");

  const response = await axios.post(config.payment_url!, payload, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  return response.data;
};

export const verifyPayment = async (valId: string) => {
  const response = await axios.get(config.search_url!, {
    params: {
      val_id: valId,
      store_id: config.store_id || "testbox",
      store_passwd: config.store_passwd || "qwerty",
      format: "json",
    },
  });

  return response.data;
};

export const verifyPaymentByTransactionId = async (tranId: string) => {
  const isSandbox = config.payment_url?.includes("sandbox");
  const baseUrl = isSandbox
    ? "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"
    : "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";

  const response = await axios.get(baseUrl, {
    params: {
      tran_id: tranId,
      store_id: config.store_id || "testbox",
      store_passwd: config.store_passwd || "qwerty",
      format: "json",
    },
  });

  return response.data;
};

