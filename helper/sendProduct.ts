import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const escapeHtml = (value: unknown): string => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const formatPrice = (price: unknown): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price || 0));
};

const formatOrderDate = (date: string | Date): string => {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getVariant = (product: any, variantId: string) => {
  if (!product || !variantId) return null;

  const variants =
    product.variants ||
    product.variant ||
    product.colorVariants ||
    product.productVariants ||
    [];

  if (!Array.isArray(variants)) return null;

  return variants.find(
    (variant: any) =>
      String(variant?._id) === String(variantId)
  );
};

const getVariantName = (variant: any): string => {
  if (!variant) return "";

  if (typeof variant.attributes === "object" && variant.attributes !== null) {
    const attributes = Object.entries(variant.attributes)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => {
        const readableKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (char) => char.toUpperCase());

        return `${readableKey}: ${String(value)}`;
      });

    if (attributes.length) {
      return attributes.join(", ");
    }
  }

  return (
    variant.name ||
    variant.title ||
    variant.value ||
    variant.size ||
    variant.colorName ||
    variant.sku ||
    ""
  );
};



const createOrderEmailHtml = (
  order: any,
  customerEmail: string
): string => {
  const orderNumber = String(order._id || "")
    .slice(-8)
    .toUpperCase();

  const items = Array.isArray(order.items) ? order.items : [];

  const itemRows = items
    .map((item: any) => {
      const product =
        typeof item.productId === "object"
          ? item.productId
          : typeof item.product === "object"
            ? item.product
            : {};

      const variant = getVariant(product, item.variantId);
      const variantName = getVariantName(variant);

      const quantity = Number(item.quantity || 1);
      
      const itemTotal = variant.mrp  * quantity;

      const productName =
        product?.name ||
        product?.title ||
        item?.name ||
        "Product";

      return `
        <tr>
          <td
            style="
              padding:14px 10px;
              border-bottom:1px solid #e5e7eb;
              vertical-align:top;
            "
          >
            <strong style="color:#111827;">
              ${escapeHtml(productName)}
            </strong>

            ${
              variantName
                ? `
                  <div
                    style="
                      margin-top:5px;
                      font-size:12px;
                      color:#6b7280;
                    "
                  >
                    ${escapeHtml(variantName)}
                  </div>
                `
                : ""
            }

            ${
              variant?.sku || product?.sku
                ? `
                  <div
                    style="
                      margin-top:4px;
                      font-size:12px;
                      color:#9ca3af;
                    "
                  >
                    SKU: ${escapeHtml(variant?.sku || product?.sku)}
                  </div>
                `
                : ""
            }
          </td>

          <td
            style="
              padding:14px 10px;
              border-bottom:1px solid #e5e7eb;
              text-align:center;
              vertical-align:top;
            "
          >
            ${quantity}
          </td>

          <td
            style="
              padding:14px 10px;
              border-bottom:1px solid #e5e7eb;
              text-align:right;
              vertical-align:top;
            "
          >
            ${formatPrice(variant.mrp)}
          </td>

          <td
            style="
              padding:14px 10px;
              border-bottom:1px solid #e5e7eb;
              text-align:right;
              vertical-align:top;
              font-weight:600;
            "
          >
            ${formatPrice(itemTotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  const address = order.address || {};

  const customerName = [
    address.firstName,
    address.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const completeAddress = [
    address.houseNo
      ? `House/Flat No. ${address.houseNo}`
      : "",
    address.area,
    address.landmark,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(", ");

  const subtotal = Number(order.price || 0);
  const discount = Number(order.discount || 0);
  const shippingPrice = Number(order.shippingPrice || 0);
  const totalPrice = Number(order.totalPrice || 0);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>Order Received</title>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background:#f3f4f6;
          font-family:Arial,Helvetica,sans-serif;
          color:#111827;
        "
      >
        <div
          style="
            width:100%;
            padding:30px 12px;
            box-sizing:border-box;
          "
        >
          <div
            style="
              max-width:700px;
              margin:0 auto;
              background:#ffffff;
              border-radius:14px;
              overflow:hidden;
              box-shadow:0 4px 20px rgba(0,0,0,0.06);
            "
          >
            <div
              style="
                background:#5b130f;
                color:#ffffff;
                padding:28px 24px;
              "
            >
              <h1
                style="
                  margin:0;
                  font-size:25px;
                  line-height:1.3;
                "
              >
                Thank you for your order
              </h1>

              <p
                style="
                  margin:10px 0 0;
                  color:#f3d7d5;
                  font-size:14px;
                  line-height:1.6;
                "
              >
                Your order has been received and is currently being processed.
              </p>
            </div>

            <div style="padding:24px;">
              <div
                style="
                  background:#f9fafb;
                  border:1px solid #e5e7eb;
                  border-radius:10px;
                  padding:16px;
                  margin-bottom:25px;
                "
              >
                <table
                  role="presentation"
                  style="
                    width:100%;
                    border-collapse:collapse;
                    font-size:14px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:5px 0;
                        color:#6b7280;
                      "
                    >
                      Order number
                    </td>

                    <td
                      style="
                        padding:5px 0;
                        text-align:right;
                        font-weight:700;
                      "
                    >
                      #${escapeHtml(orderNumber)}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:5px 0;
                        color:#6b7280;
                      "
                    >
                      Order date
                    </td>

                    <td
                      style="
                        padding:5px 0;
                        text-align:right;
                      "
                    >
                      ${formatOrderDate(order.createdAt)}
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:5px 0;
                        color:#6b7280;
                      "
                    >
                      Order status
                    </td>

                    <td
                      style="
                        padding:5px 0;
                        text-align:right;
                        font-weight:600;
                      "
                    >
                      ${escapeHtml(order.orderStatus)}
                    </td>
                  </tr>
                </table>
              </div>

              <h2
                style="
                  margin:0 0 14px;
                  font-size:18px;
                "
              >
                Customer details
              </h2>

              <div
                style="
                  margin-bottom:28px;
                  padding:16px;
                  border:1px solid #e5e7eb;
                  border-radius:10px;
                  line-height:1.8;
                  font-size:14px;
                "
              >
                ${
                  customerName
                    ? `
                      <strong>Name:</strong>
                      ${escapeHtml(customerName)}
                      <br />
                    `
                    : ""
                }

                <strong>Email:</strong>
                ${escapeHtml(customerEmail)}
                <br />

                ${
                  address.phone
                    ? `
                      <strong>Phone:</strong>
                      ${escapeHtml(address.phone)}
                      <br />
                    `
                    : ""
                }

                ${
                  completeAddress
                    ? `
                      <strong>Address:</strong>
                      ${completeAddress}
                      <br />
                    `
                    : ""
                }

                ${
                  address.addressType
                    ? `
                      <strong>Address type:</strong>
                      ${escapeHtml(address.addressType)}
                    `
                    : ""
                }
              </div>

              <h2
                style="
                  margin:0 0 14px;
                  font-size:18px;
                "
              >
                Order items
              </h2>

              <div style="overflow-x:auto;">
                <table
                  role="presentation"
                  style="
                    width:100%;
                    border-collapse:collapse;
                    font-size:14px;
                    min-width:520px;
                  "
                >
                  <thead>
                    <tr style="background:#f9fafb;">
                      <th
                        style="
                          padding:12px 10px;
                          text-align:left;
                          border-bottom:1px solid #d1d5db;
                        "
                      >
                        Product
                      </th>

                      <th
                        style="
                          padding:12px 10px;
                          text-align:center;
                          border-bottom:1px solid #d1d5db;
                        "
                      >
                        Qty
                      </th>

                      <th
                        style="
                          padding:12px 10px;
                          text-align:right;
                          border-bottom:1px solid #d1d5db;
                        "
                      >
                        Price
                      </th>

                      <th
                        style="
                          padding:12px 10px;
                          text-align:right;
                          border-bottom:1px solid #d1d5db;
                        "
                      >
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    ${itemRows}
                  </tbody>
                </table>
              </div>

              <div
                style="
                  max-width:340px;
                  margin:25px 0 0 auto;
                "
              >
                <table
                  role="presentation"
                  style="
                    width:100%;
                    border-collapse:collapse;
                    font-size:14px;
                  "
                >
                  <tr>
                    <td style="padding:7px 0;color:#6b7280;">
                      Subtotal
                    </td>

                    <td style="padding:7px 0;text-align:right;">
                      ${formatPrice(subtotal)}
                    </td>
                  </tr>

                  ${
                    shippingPrice > 0
                      ? `
                        <tr>
                          <td
                            style="
                              padding:7px 0;
                              color:#6b7280;
                            "
                          >
                            Shipping
                          </td>

                          <td
                            style="
                              padding:7px 0;
                              text-align:right;
                            "
                          >
                            ${formatPrice(shippingPrice)}
                          </td>
                        </tr>
                      `
                      : ""
                  }

                  ${
                    discount > 0
                      ? `
                        <tr>
                          <td
                            style="
                              padding:7px 0;
                              color:#059669;
                            "
                          >
                            Discount
                          </td>

                          <td
                            style="
                              padding:7px 0;
                              text-align:right;
                              color:#059669;
                            "
                          >
                            -${formatPrice(discount)}
                          </td>
                        </tr>
                      `
                      : ""
                  }

                  <tr
                    style="
                      border-top:2px solid #111827;
                      font-size:18px;
                      font-weight:700;
                    "
                  >
                    <td style="padding:13px 0 5px;">
                      Grand total
                    </td>

                    <td
                      style="
                        padding:13px 0 5px;
                        text-align:right;
                      "
                    >
                      ${formatPrice(totalPrice)}
                    </td>
                  </tr>
                </table>
              </div>

              <div
                style="
                  margin-top:28px;
                  padding:18px;
                  background:#f9fafb;
                  border-radius:10px;
                  font-size:14px;
                  line-height:1.8;
                "
              >
                <strong>Payment method:</strong>
                ${escapeHtml(order.paymentMethod)}
                <br />

                <strong>Payment status:</strong>
                ${escapeHtml(order.paymentStatus)}

                ${
                  order.trackingId
                    ? `
                      <br />
                      <strong>Tracking ID:</strong>
                      ${escapeHtml(order.trackingId)}
                    `
                    : ""
                }
              </div>

              <p
                style="
                  margin:28px 0 5px;
                  color:#6b7280;
                  font-size:13px;
                  line-height:1.7;
                  text-align:center;
                "
              >
                We will notify you when your order status is updated.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

export const sendNewOrderEmail = async (
  order: any,
  email: string
): Promise<void> => {
  if (!email) {
    throw new Error("Customer email is required");
  }

  if (!order) {
    throw new Error("Order data is required");
  }

  const orderNumber = String(order._id || "")
    .slice(-8)
    .toUpperCase();

  await transporter.sendMail({
    from: `"D.A.F" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Order received #${orderNumber} - ${formatPrice(
      order.totalPrice
    )}`,
    html: createOrderEmailHtml(order, email),
    text: `
Thank you for your order.

Order number: #${orderNumber}
Order status: ${order.orderStatus}
Payment method: ${order.paymentMethod}
Payment status: ${order.paymentStatus}
Total amount: ${formatPrice(order.totalPrice)}
    `.trim(),
  });
};