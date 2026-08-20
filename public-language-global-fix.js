(() => {
  const KEY='rf_lang';
  const LANGS=['pt','en','zh','fr','ch'];
  const M={
    'ONLINE GROCERY · ORDER BY WHATSAPP':{pt:'MERCEARIA ONLINE · COMPRAS PELO WHATSAPP',en:'ONLINE GROCERY · ORDER BY WHATSAPP',zh:'网上杂货店 · 通过 WhatsApp 下单',fr:'ÉPICERIE EN LIGNE · COMMANDE PAR WHATSAPP',ch:'TIYONI TA VUKA · XAVA HI WHATSAPP'},
    'Escolha os produtos':{en:'Choose products',zh:'选择商品',fr:'Choisissez les produits',ch:'Hlawula swixavisiwa'},
    'Navegue pelo catálogo e escolha os produtos que deseja comprar.':{en:'Browse the catalog and choose the products you want to buy.',zh:'浏览目录并选择您想购买的商品。',fr:'Parcourez le catalogue et choisissez les produits que vous souhaitez acheter.',ch:'Famba eka nxaxamelo kutani u hlawula swixavisiwa leswi u lavaka ku xava.'},
    'Monte o seu pedido':{en:'Build your order',zh:'创建订单',fr:'Composez votre commande',ch:'Lunghisa xileriso xa wena'},
    'Adicione os produtos ao carrinho e ajuste as quantidades como preferir.':{en:'Add products to the cart and adjust quantities as you like.',zh:'将商品加入购物车并按需要调整数量。',fr:'Ajoutez les produits au panier et ajustez les quantités comme vous le souhaitez.',ch:'Engetela swixavisiwa eka xikarichi kutani u lulamisa nhlayo hi ku ya hi leswi u swi lavaka.'},
    'Confirme os dados':{en:'Confirm your details',zh:'确认资料',fr:'Confirmez vos données',ch:'Tiyisisa vuxokoxoko'},
    'Informe os seus dados, forma de entrega, pagamento e preferências de substituição.':{en:'Enter your details, delivery method, payment and substitution preferences.',zh:'填写您的资料、配送方式、付款方式和替代偏好。',fr:'Saisissez vos coordonnées, le mode de livraison, le paiement et vos préférences de remplacement.',ch:'Nghenisa vuxokoxoko bya wena, ndlela yo tisa, hakelo ni leswi u swi rhandzaka loko ku cinca swixavisiwa.'},
    'Receba ou levante':{en:'Receive or pick up',zh:'配送或自取',fr:'Recevez ou retirez',ch:'Amukela kumbe teka'},
    'Envie o pedido pelo WhatsApp. A nossa equipa confirma a disponibilidade e combina a entrega ou levantamento.':{en:'Send the order via WhatsApp. Our team confirms availability and arranges delivery or pickup.',zh:'通过 WhatsApp 发送订单。我们的团队会确认库存并安排配送或自取。',fr:'Envoyez la commande par WhatsApp. Notre équipe confirme la disponibilité et organise la livraison ou le retrait.',ch:'Rhumela xileriso hi WhatsApp. Ntlawa wa hina wu tiyisisa leswi nga kona kutani wu lulamisa ku tisa kumbe ku teka.'},
    'Produto selecionado do Rancho Flexível.':{en:'Selected product from Rancho Flexível.',zh:'Rancho Flexível 精选商品。',fr:'Produit sélectionné de Rancho Flexível.',ch:'Xixavisiwa lexi hlawuriweke xa Rancho Flexível.'},
    'PROMOÇÃO':{en:'PROMOTION',zh:'促销',fr:'PROMOTION',ch:'NTSHOVO'},
    'Adicionar':{en:'Add',zh:'加入',fr:'Ajouter',ch:'Engetela'},
    'Adicionar combo':{en:'Add combo',zh:'添加套餐',fr:'Ajouter le combo',ch:'Engetela combo'},
    'Combo do Mês':{en:'Monthly Combo',zh:'本月套餐',fr:'Combo du mois',ch:'Combo wa N’hweti'},
    'Este combo inclui:':{en:'This combo includes:',zh:'本套餐包括：',fr:'Ce combo comprend :',ch:'Combo leyi yi katsa:'},
    'O básico indispensável para a sua cozinha.':{en:'The essential basics for your kitchen.',zh:'厨房必备的基本食品。',fr:'Les essentiels indispensables pour votre cuisine.',ch:'Swilo swa nkoka swa le kaya ka wena.'},
    'Foco no rendimento e economia.':{en:'Focused on value and savings.',zh:'注重实惠与节省。',fr:'Axé sur le rendement et les économies.',ch:'Yi kongomisa eka ku hlayisa mali.'},
    'Na medida certa para dois.':{en:'Just right for two.',zh:'适合两个人的份量。',fr:'La juste quantité pour deux.',ch:'Nhlayo leyi ringaneke vanhu vambirhi.'},
    'Quantidade para toda a família.':{en:'Enough for the whole family.',zh:'适合全家使用的份量。',fr:'Une quantité pour toute la famille.',ch:'Nhlayo ya ndyangu hinkwawu.'},
    'Preços em meticais e promoções bem visíveis.':{en:'Prices in meticais and promotions clearly shown.',zh:'价格以梅蒂卡尔显示，优惠清晰可见。',fr:'Prix en meticais et promotions clairement affichés.',ch:'Mali hi meticais ni ku hungutiwa ku vonaka kahle.'},
    'Maputo Cidade':{en:'Maputo City',zh:'马普托市',fr:'Maputo Ville',ch:'Maputo'},
    'Zonas circunvizinhas':{en:'Surrounding areas',zh:'周边地区',fr:'Zones environnantes',ch:'Tindhawu leti nga kusuhi'},
    'Levantamento':{en:'Pickup',zh:'自取',fr:'Retrait',ch:'Ku teka'},
    'Grátis':{en:'Free',zh:'免费',fr:'Gratuit',ch:'Mahala'},
    'Preciso de criar uma conta?':{en:'Do I need to create an account?',zh:'需要创建账户吗？',fr:'Dois-je créer un compte ?',ch:'Xana ndzi fanele ndzi endla akhawunti?'},
    'Não. Pode montar o carrinho e enviar o pedido sem registo.':{en:'No. You can build your cart and send the order without registering.',zh:'不需要。您可以直接加入购物车并发送订单，无需注册。',fr:'Non. Vous pouvez composer votre panier et envoyer la commande sans inscription.',ch:'E-e. U nga lunghisa xikarichi kutani u rhumela xileriso handle ka ku tsarisa.'},
    'O pedido fica logo confirmado?':{en:'Is the order confirmed immediately?',zh:'订单会立即确认吗？',fr:'La commande est-elle confirmée immédiatement ?',ch:'Xana xileriso xi tiyisiwa hi ku hatlisa?'},
    'A equipa confirma primeiro a disponibilidade, as substituições e o prazo de entrega.':{en:'Our team first confirms availability, substitutions and delivery time.',zh:'我们的团队会先确认库存、替代品和配送时间。',fr:'Notre équipe confirme d’abord la disponibilité, les remplacements et le délai de livraison.',ch:'Ntlawa wa hina wu sungula wu tiyisisa leswi nga kona, ku cinca swixavisiwa ni nkarhi wa ku tisa.'},
    'Como é calculada a taxa?':{en:'How is the fee calculated?',zh:'服务费如何计算？',fr:'Comment les frais sont-ils calculés ?',ch:'Xana mali yi hlayiwa hi ndlela yihi?'},
    'O valor depende da área escolhida e aparece no total antes do envio pelo WhatsApp.':{en:'The amount depends on the selected area and appears in the total before sending via WhatsApp.',zh:'金额取决于所选区域，并会在通过 WhatsApp 发送前显示在总计中。',fr:'Le montant dépend de la zone choisie et apparaît dans le total avant l’envoi par WhatsApp.',ch:'Ntsengo wu ya hi ndhawu leyi hlawuriweke naswona wu vonaka eka nhlayo ya makumu loko u nga se rhumela hi WhatsApp.'},
    'Posso levantar a encomenda?':{en:'Can I pick up my order?',zh:'可以自取订单吗？',fr:'Puis-je retirer ma commande ?',ch:'Xana ndzi nga teka xileriso xa mina?'},
    'Sim. Escolha levantamento para não pagar taxa de serviço.':{en:'Yes. Choose pickup to avoid the service fee.',zh:'可以。选择自取即可免服务费。',fr:'Oui. Choisissez le retrait pour éviter les frais.',ch:'Ina. Hlawula ku teka leswaku u nga hakeli mali ya vukorhokeri.'},
    'A sua mercearia simples e próxima.':{en:'Your simple, nearby grocery store.',zh:'您身边简单方便的杂货店。',fr:'Votre épicerie simple et proche.',ch:'Xitolo xa wena xa swakudya, xo olova naswona xi le kusuhi.'},
    'Número do WhatsApp':{en:'WhatsApp number',zh:'WhatsApp 号码',fr:'Numéro WhatsApp',ch:'Nomboro ya WhatsApp'},
    'Maputo • Arredores • Matola':{en:'Maputo • Surroundings • Matola',zh:'马普托 • 周边 • 马托拉',fr:'Maputo • Alentours • Matola',ch:'Maputo • Tindhawu leti nga kusuhi • Matola'},
    'Do nosso mercado para a sua mesa — escolha, peça e receba com simplicidade.':{en:'From our market to your table — choose, order and receive with ease.',zh:'从我们的市场到您的餐桌——选择、下单、轻松收货。',fr:'De notre marché à votre table — choisissez, commandez et recevez simplement.',ch:'Ku suka emakete wa hina ku ya etafuleni ra wena — hlawula, oda kutani u amukela hi ku olova.'},
    'Compras simples, perto de si.':{en:'Simple shopping, close to you.',zh:'简单购物，就在您身边。',fr:'Des achats simples, près de chez vous.',ch:'Ku xava hi ku olova, kusuhi na wena.'},
    'Ordenar':{en:'Sort',zh:'排序',fr:'Trier',ch:'Lulamisa'},'Preço: menor':{en:'Lowest price',zh:'价格最低',fr:'Prix le plus bas',ch:'Ntsengo wa le hansi'},'Preço: maior':{en:'Highest price',zh:'价格最高',fr:'Prix le plus élevé',ch:'Ntsengo wa le henhla'},'Nome':{en:'Name',zh:'名称',fr:'Nom',ch:'Vito'},
    'Todos':{en:'All',zh:'全部',fr:'Tous',ch:'Hinkwawo'},
    'Kits pré-montados pensados para facilitar a sua rotina e garantir economia.':{en:'Pre-built kits designed to make your routine easier and save money.',zh:'预先搭配的套餐，让日常采购更方便、更省钱。',fr:'Kits préparés pour faciliter votre quotidien et économiser.',ch:'Swikombo leswi lunghisiweke ku olovisa siku ra wena ni ku hlayisa mali.'}
  };
  const COUNT={
    pt:n=>`${n} produto${n===1?'':'s'} selecionado${n===1?'':'s'}`,
    en:n=>`${n} selected product${n===1?'':'s'}`,
    fr:n=>`${n} produit${n===1?'':'s'} sélectionné${n===1?'':'s'}`,
    zh:n=>`${n} 件已选商品`,
    ch:n=>`${n} ${n===1?'xixavisiwa lexi hlawuriweke':'swixavisiwa leswi hlawuriweke'}`
  };
  const skipTags=new Set(['SCRIPT','STYLE','NOSCRIPT','OPTION']);
  const lang=()=>LANGS.includes(localStorage.getItem(KEY))?localStorage.getItem(KEY):'pt';
  const translateText=(raw,l)=>{
    const s=raw.trim(); if(!s)return null;
    if(M[s]?.[l])return M[s][l];
    const m=s.match(/^(\d+)\s+(?:produto|produtos)\s+selecionados?$/i);
    if(m)return COUNT[l](Number(m[1]));
    if(s==='PROMOÇÃO')return M['PROMOÇÃO'][l];
    return null;
  };
  function apply(){
    const l=lang();
    document.documentElement.lang=l==='ch'?'pt':l;
    document.querySelectorAll('body *').forEach(el=>{
      if(skipTags.has(el.tagName))return;
      if(el.children.length===0){
        const v=translateText(el.textContent,l);
        if(v!==null)el.textContent=v;
      }
      for(const attr of ['placeholder','aria-label','title']){
        const v=el.getAttribute(attr); if(!v)continue;
        const t=translateText(v,l); if(t!==null)el.setAttribute(attr,t);
      }
    });
    document.querySelectorAll('#categoryFilter option,#sortFilter option').forEach(o=>{const v=translateText(o.textContent,l);if(v)o.textContent=v});
    const s=document.querySelector('#languageSelect')||document.querySelector('#rfLanguage');if(s)s.value=l;
    const c=document.querySelector('#languageContainer');if(c)c.classList.remove('hidden');
  }
  let timer=0;
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(apply,80)};
  schedule();
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true});
  window.addEventListener('storage',e=>{if(e.key===KEY)schedule()});
  document.addEventListener('change',e=>{if(e.target?.id==='languageSelect'||e.target?.id==='rfLanguage'){localStorage.setItem(KEY,e.target.value);schedule()}});
})();
