import { Document, model, Schema } from "mongoose";

interface IUser extends Document{
    name:string;
    email:string;
    password:string;
    role:string;
    phone:string; 
    cartCount:Number;
    status:Boolean;
}


const userSchema = new Schema<IUser>({
    name:{
        type:String,
   
        trim:true
    },
     email:{
        type:String,
        required:true,
        trim:true,
        unique:true,
    },
      password:{
    type:String
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user", 
  },
   phone: { type: String, default: "" },
cartCount:{
type:Number,
default:0
},
status:{
type:Boolean,
default:true
    },
  
},{
    timestamps:true
})

const User = model<IUser>("user",userSchema);

export default User;

