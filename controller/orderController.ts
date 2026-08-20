import type { Request, Response } from "express";
import Order from "../model/orderModel";
import Razorpay from "razorpay"
import crypto from "crypto"
import dotenv from "dotenv"
import mongoose from "mongoose";
import Cart from "../model/cartModel";
import User from "../model/userModel";
import { sendNewOrderEmail } from "../helper/sendProduct";
dotenv.config()

interface AuthRequest extends Request {
  user: any;
}
 const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});



export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
  
    const { address, price, discount, totalPrice, items } = req.body;
    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }


        const amountInPaise = Math.round(Number(totalPrice) * 100);
         const receipt = `receipt_${Date.now()}`;

      const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        userId: req.user?._id?.toString() || "guest",
      },
    });


    const order = await Order.create({
      user: user._id,
      address: address,
      items,
      paymentMethod:"Online",
      price,
      discount,
      totalPrice,
    });




     return res.status(201).json({
      success: true,
      message: " order created successfully",
      key: process.env.RAZORPAY_KEY_ID,
      order: {
       id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
       
      },
       orderId: order._id,
      
    }); 



  } catch (error) {
  
  return res.status(500).json({
    success:false,
    message:error
  })
    
  }
};


export const verifyRazorpayPayment = async(req: AuthRequest, res: Response)=>{
try {
  
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
      ordertype
    } = req.body;

const userid = req.user._id

 if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification data",
      });
    }


     const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET as string
      )
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
     
      const isPaymentValid =
      generatedSignature === razorpay_signature;

  if (!isPaymentValid) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "failed",
      });

      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  
 const order= await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "Paid",
        paymentMethod: "Online",
       
      }, {
    new: true,
    runValidators: true,
  }).populate("address").populate({path:"items.productId"});
if(ordertype=="cart"){

  await Cart.deleteMany({user:userid})
  await User.findByIdAndUpdate(userid,{cartCount:0})
}
 

await sendNewOrderEmail(order as any,req.user.email as string)

 return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      
    });

} catch (error) {
    return res.status(500).json({
    success:false,
    message:error
  })
}
}

  export const GetMyOrder= async(req: AuthRequest, res: Response)=>{
  try {
    const user= req.user;
        if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }
 const orders = await Order.find({ user: user._id })
      .populate({
        path: "address",
      })
      .populate({
        path: "items.productId",
        select:"name shortDescription slug thumbnail variants"
      })
      .sort({ createdAt: -1 });

return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      count: orders.length,
      orders,
    });

  } catch (error) {
  
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
  }








// export const Addtrackid = async (req: Request, res: Response) => {
//   try {
//     const { orderid, trackingId } = req.body;

//     if (!orderid || !trackingId) {
//       return res.status(400).json({
//         success: false,
//         message: "Order ID and Tracking ID are required",
//       });
//     }

//     const order = await Order.findById(orderid);

//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//     order.trackingId = trackingId;
//     order.orderStatus = "Shipped";
//     await order?.save();

//     return res.status(200).json({
//       success: true,
//       message: "Tracking ID added successfully",
//       order,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });
//   }
// };

// export const removeTrackid = async (req: Request, res: Response)=>{
//     try {
//     const orderid = req.params.orderid;
//    if (!orderid) {
//       return res.status(400).json({
//         success: false,
//         message: "Order ID is required",
//       });
//     }

//  const order  = await Order.findById(orderid)
//   if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found",
//       });
//     }

//   order.trackingId = null
//   order.orderStatus = "Pending";
//   await order?.save()
//  return res.status(200).json({
//       success: true,
//       message: "Tracking ID removed successfully",
//       order,
//     });
//   } catch (error) {
//       return res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });  
//     }
// }



export const getOrders = async (req: Request, res: Response) => {
  try {
    const filterQuery = req.query.filterQuery as string;

    let filter: any = {};

    const now = new Date();

    if (filterQuery === "today") {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      filter.createdAt = {
        $gte: startOfDay,
        $lte: now,
      };
    }

    if (filterQuery === "week") {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);

      filter.createdAt = {
        $gte: startOfWeek,
        $lte: now,
      };
    }

    if (filterQuery === "month") {
      const startOfMonth = new Date();
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);

      filter.createdAt = {
        $gte: startOfMonth,
        $lte: now,
      };
    }


    const orders = await Order.find(filter).populate([ {path:"items.productId",select:"name slug thumbnail variants"},{path:"address"}]).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const getSingleOrder= async(req:Request,res:Response)=>{
  try {
    const {id} = req.params;
 
    const order = await Order.findById(id).populate([{path:"address"},{path:"items.productId",select:"name slug  shortDescription thumbnail variants"}])

   if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
  return res.status(200).json({
      success: true,
      message: "Order fetched successfully",
      order,
    });





  } catch (error) {
    return res.status(500).json({
      success:false,
      message:error
    })
  }
}

export const ChangeStatus = async(req:Request,res:Response)=>{
  try {
    const {id}= req.params;
   const {type,data}= req.body;
const order = await Order.findById(id);

if(!order){
 return res.status(404).json({
        success: false,
        message: "Order not found",
      });
}




switch (type) {
  case "orderStatus":
    order.orderStatus= data
    break;
    case "paymentStatus":      
      order.paymentStatus= data
     break;
 case "trackingId":      
      order.trackingId= data
     break;

  default:
    break;
}

await order.save();



 return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order,
    });


  } catch (error) {
    return res.status(500).json({
      success:false,mesage:error
    })
  }
}



export const GetOrderDetails = async (req: Request, res: Response) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyOrderChart = Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          orders: { $sum: 1 },
          paidOrders: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0],
            },
          },
          revenue: { $sum: "$totalPrice" },
          paidRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$totalPrice", 0],
            },
          },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);
    const [
      totalOrders,
      paidOrders,
      monthlyOrders,
      monthlyPaidOrders,
      totalSalesAgg,
      paidSalesAgg,
      latestOrders,
      monthlyOrdersChart,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: "Paid" }),

      Order.countDocuments({
        createdAt: { $gte: startOfMonth },
      }),

      Order.countDocuments({
        paymentStatus: "Paid",
        createdAt: { $gte: startOfMonth },
      }),

      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
          },
        },
      ]),

      Order.aggregate([
        {
          $match: { paymentStatus: "Paid" },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalPrice" },
          },
        },
      ]),

      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "name email")
        .populate("address")
        .lean(),

      monthlyOrderChart,
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        paidOrders,
        monthlyOrders,
        monthlyPaidOrders,
        totalSales: totalSalesAgg[0]?.total ?? 0,
        paidSales: paidSalesAgg[0]?.total ?? 0,
        latestOrders,
        monthlyOrdersChart,
      },
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data.",
      error: error.message,
    });
  }
};


export const DeleteOrder = async (req: Request, res: Response) =>  {
  try{
const orderID = req.params.id;
await Order.findByIdAndDelete(orderID);

return res.status(200).json({
  success:true,
  message:"Order Deleted"
})


  }
  catch(error){
return res.status(500).json({
  success:false,message:error
})
  }
}
