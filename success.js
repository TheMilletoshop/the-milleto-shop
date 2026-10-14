const params=new URLSearchParams(location.search);const orderId=params.get("order");const statusBox=document.querySelector("#payment-status");const intro=document.querySelector("#status-intro");
async function checkStatus(){
  if(!orderId){statusBox.textContent="No order reference was found. If you completed payment, please contact The Milleto.";return;}
  try{
    const response=await fetch("/api/order-status?order="+encodeURIComponent(orderId));
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Status unavailable");
    if(data.status==="paid"){statusBox.textContent="Payment received ✓";intro.textContent="Your payment is confirmed. Thank you!"; }
    else if(data.status==="open"){statusBox.textContent="Payment is not confirmed yet";intro.textContent="If you just paid, allow a moment for the payment provider to update."; }
    else if(["failed","canceled","expired"].includes(data.status)){statusBox.textContent="Payment "+data.status;intro.textContent="Your order is not confirmed as paid. You can return to the shop and try again."; }
    else {statusBox.textContent="Order received — payment status: "+data.status;intro.textContent="We'll confirm your order after the payment provider updates the status.";}
  }catch(e){statusBox.textContent="We couldn't check the status just now. Please contact The Milleto if you completed payment.";}
}
checkStatus();
