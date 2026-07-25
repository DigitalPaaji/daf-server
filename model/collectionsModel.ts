import { Document } from "mongoose";
import { Schema, model, Types } from "mongoose";


interface ICollection extends Document{
    name:string;
    slug:string;
    description :string;
    image:string;
    products:string[];
    isActive:Boolean;

}



const collectionSchema = new Schema<ICollection>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
    },

    image: {
      type: String, // store image URL
    },

    products: [
      {
        type: Types.ObjectId,
        ref: "products",
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

 const Collection = model("Collection", collectionSchema);

 export default Collection;