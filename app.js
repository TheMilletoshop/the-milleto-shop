const PRODUCTS = [
  {id:"cranberry-pistachio",name:"Cranberry Pistachio",priceCents:450},
  {id:"chocolate",name:"Chocolate",priceCents:450},
  {id:"coconut",name:"Coconut",priceCents:450},
  {id:"cashew-cardamom",name:"Cashew Cardamom",priceCents:450}
];
const cart = {};
const euro = cents => new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"}).format(cents/100);
const productById = id => PRODUCTS.find(p=>p.id===id);
function renderCart(){
  const count=Object.values(cart).reduce((a,b)=>a+b,0);
  document.querySelector("#cart-count").textContent=count;
  const container=document.querySelector("#basket-items");
  const entries=Object.entries(cart).filter(([,qty])=>qty>0);
  if(!entries.length){container.innerHTML='<p class="empty-basket">Your basket is waiting for something delicious.</p>';}
  else {
    container.innerHTML=entries.map(([id,qty])=>{
      const p=productById(id);
      return `<div class="basket-row"><div><strong>${p.name}</strong><small>${euro(p.priceCents)} / pack</small></div><div class="quantity-controls"><button type="button" data-action="minus" data-id="${id}" aria-label="Remove one ${p.name}">−</button><span>${qty}</span><button type="button" data-action="plus" data-id="${id}" aria-label="Add one ${p.name}">+</button></div><strong class="line-price">${euro(p.priceCents*qty)}</strong></div>`;
    }).join("");
  }
  const total=entries.reduce((sum,[id,qty])=>sum+productById(id).priceCents*qty,0);
  document.querySelector("#basket-total").textContent=euro(total);
}
document.querySelectorAll(".add-button").forEach(button=>button.addEventListener("click",()=>{
  const id=button.dataset.id;cart[id]=(cart[id]||0)+1;renderCart();
  button.textContent="Added ✓";setTimeout(()=>button.textContent="Add to basket",900);
  document.querySelector("#checkout").scrollIntoView({behavior:"smooth",block:"nearest"});
}));
document.querySelector("#basket-items").addEventListener("click",event=>{
  const button=event.target.closest("button[data-action]");if(!button)return;
  const id=button.dataset.id;cart[id]=(cart[id]||0)+(button.dataset.action==="plus"?1:-1);
  if(cart[id]<=0)delete cart[id];renderCart();
});
document.querySelector("#year").textContent=new Date().getFullYear();
const form=document.querySelector("#checkout-form");
form.addEventListener("submit",async event=>{
  event.preventDefault();
  const message=document.querySelector("#checkout-message");
  const button=document.querySelector("#pay-button");
  const items=Object.entries(cart).filter(([,quantity])=>quantity>0).map(([id,quantity])=>({id,quantity}));
  if(!items.length){message.textContent="Please add at least one pack to your basket.";return;}
  if(!document.querySelector("#terms-consent").checked){message.textContent="Please confirm the privacy notice before continuing.";return;}
  button.disabled=true;button.textContent="Preparing secure checkout…";message.textContent="";
  const fd=new FormData(form);
  const customer={name:fd.get("name").trim(),email:fd.get("email").trim(),phone:fd.get("phone").trim(),pickupPreference:fd.get("pickupPreference").trim(),note:fd.get("note").trim()};
  try{
    const response=await fetch("/api/create-payment",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items,customer})});
    const result=await response.json();
    if(!response.ok)throw new Error(result.error||"We couldn't start checkout. Please try again.");
    if(!result.checkoutUrl)throw new Error("Checkout link was missing. Please contact The Milleto.");
    window.location.href=result.checkoutUrl;
  }catch(error){message.textContent=error.message||"Something went wrong. Please try again.";button.disabled=false;button.innerHTML='Continue to secure payment <span aria-hidden="true">↗</span>';}
});
renderCart();
