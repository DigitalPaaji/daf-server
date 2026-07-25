import mongoose, { model, Schema } from "mongoose";




export interface IAddress extends Document {
  user: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  phone: string;
  pincode: string;
  state: string;
  city: string;
  houseNo: string;
  area: string;
  landmark?: string;
  addressType: "Home" | "Work" | "Other";
  isDefault: boolean;
}

const addressSchema = new Schema<IAddress>({
     user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    firstName:{
        type:String,
        required:true,
        trim:true,
    },
    lastName:{
        type:String,
        trim:true,
    }, 
    phone: {
      type: String,
      required: true,
    }, 
    pincode: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },  
    city: {
      type: String,
      required: true,
    },
     houseNo: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
     landmark: {
      type: String,
    },
      addressType: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },
      isDefault: {
      type: Boolean,
      default: false,
    },
    
    

}, { timestamps: true })


const Address = model<IAddress>("address",addressSchema);

export default Address;

