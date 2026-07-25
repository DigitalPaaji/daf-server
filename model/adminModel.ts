import { model, Schema } from "mongoose";
interface IAdmin extends Document{
    name:string;
    email:string;
    password:string;
    logo: string;
    
}
const adminSchema = new  Schema<IAdmin >({
    name:{type:String,trim:true,required:true},
    email:{type:String,trim:true,required:true,unique:true},
    password:{type:String,trim:true,required:true},
    logo:{type:String,trim:true},
},{timestamps:true})



const Admin = model<IAdmin>("admin",adminSchema);

export default Admin;