import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  description?: string;

  discountType: "percentage" | "fixed";
  discountValue: number;

  minPurchase: number;
  maxDiscount?: number;

  validFrom: Date;
  validTill: Date;

  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;

  users: {
    user: Types.ObjectId;
    usedCount: number;
  }[];

  isActive: boolean;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    minPurchase: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxDiscount: {
      type: Number,
      min: 0,
      default: null,
    },

    validFrom: {
      type: Date,
      required: true,
    },

    validTill: {
      type: Date,
      required: true,
    },

    usageLimit: {
      type: Number,
      min: 1,
      default: null,
    },

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },

    users: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        usedCount: {
          type: Number,
          default: 1,
          min: 0,
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);



const Coupon =
  mongoose.models.Coupon ||
  mongoose.model<ICoupon>("Coupon", couponSchema);

export default Coupon;