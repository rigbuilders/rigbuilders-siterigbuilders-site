"use client";

import { useState } from "react";
import Script from "next/script";

export default function CheckoutButton({ amount }: { amount: number }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // 1. Create Order
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amount }),
      });

      const order = await res.json();

      if (order.error) {
        alert("Server Error: " + order.error);
        return;
      }

      // 2. Open Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: order.amount,
        currency: "INR",
        name: "Rig Builders",
        description: "Custom PC Build",
        order_id: order.id,
        handler: function (response: any) {
          alert(`✅ Success! Payment ID: ${response.razorpay_payment_id}`);
          // Later: Save this order to your database
        },
        prefill: {
          name: "Rig Builder User",
          email: "user@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#4E2C8B",
        },
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.open();

    } catch (error) {
      console.error("Payment Failed", error);
      alert("Something went wrong. Check console.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <button 
        onClick={handlePayment} 
        disabled={isProcessing}
        className="bg-[#4E2C8B] hover:bg-[#6a3cb8] text-white font-bold py-3 px-8 rounded-lg transition-all w-full md:w-auto"
      >
        {isProcessing ? "Processing..." : `PAY ₹${amount.toLocaleString()}`}
      </button>
    </>
  );
}