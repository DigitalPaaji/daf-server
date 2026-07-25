import mongoose, { Document, model, Schema } from "mongoose";



interface IVideo extends Document{
 video :string;
 product:mongoose.Schema.Types.ObjectId;
 status:Boolean;
}

const videoSchema= new Schema<IVideo>({
    video:{
        type:String,
        required:true,
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"products"
    },
    status:{
        type:Boolean,
        default:true
    }
},{
    timestamps:true
})

const Video = model<IVideo>("videos",videoSchema)

export default Video