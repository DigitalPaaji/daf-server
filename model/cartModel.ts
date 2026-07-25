import mongoose, { Document, model, Schema, Types } from "mongoose";



interface ICart extends Document{
user:Types.ObjectId;
product:Types.ObjectId;
productvarient:string;
quantity:Number;
price:Number;
total:Number;

}


const cartSchema = new Schema<ICart>({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"products",
        required:true
    },
    
   
     productvarient:{
        type:String,
        
        required:true
    },
     quantity: {
      type: Number,
      default: 1,
      min: 1, 
    },
    price:{
     type:Number,
     required:true
    },
    total:{
     type:Number,
     required:true
    }
}, { timestamps: true });



const Cart = model<ICart>("cart",cartSchema)

export default Cart;
