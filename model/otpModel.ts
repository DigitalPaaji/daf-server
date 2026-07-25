import { Document, model, Schema } from "mongoose";

interface IOtp extends Document{
    email:string;
    otp:Number;
    expiresAt:Date;
}

const optModel = new Schema<IOtp>({
      email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
    },
    otp:{
        type:Number,
          required:true,
    },
    expiresAt: { type: Date, required: true },
},{timestamps :true });

const Otp = model<IOtp>("otp",optModel);
export default Otp;

