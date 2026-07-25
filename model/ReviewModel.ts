import mongoose, { model, Schema } from "mongoose";
import { Types } from "mongoose";
import { Document } from "mongoose";

interface IReview extends Document{
name:string;
des:string;
work:string;
productid:Types.ObjectId;

}




const reviewSchema = new Schema<IReview>({
     name:{
        type:String,
        required:true,
        trim:true
     },
       des:{
        type:String,
        required:true,
        trim:true
     }, 
      work:{
        type:String,
        required:true,
        trim:true
     },
     productid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"products"
     }
},{timestamps:true})

const Review = model<IReview>("review",reviewSchema)

export default Review;

