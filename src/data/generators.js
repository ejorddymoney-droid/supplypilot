export function generateItems() {
  const families = ["Électrique","Consommables","Hydraulique","MRO","Mécanique","Packaging","Quincaillerie","Sécurité"];
  const prefixes = ["Max","Nano","Smart","Flex","Premium","Industrial","Ultra","Pro","Core","Titan"];
  const types = ["Coupling","Filter","Bolt","Fuse","Sensor","Valve","Relay","Pump","Bearing","Label","Switch","Motor","Gasket","Clamp","Tube"];
  const items = [];

  let seed = 42;
  const rand = () => { seed=(seed*16807)%2147483647; return (seed-1)/2147483646; };

  for (let i=0; i<400; i++) {
    const dem = Math.floor(rand()*19000)+1000;
    const cout = Math.floor(rand()*490*100)/100+10;
    const lt = Math.floor(rand()*30)+2;
    const ss = Math.floor(rand()*800)+20;
    const tp = [0.18,0.20,0.25,0.28,0.30][Math.floor(rand()*5)];
    const cc = Math.floor(rand()*90*100)/100+10;
    const va = dem*cout;
    const h = cout*tp;
    const eoq = Math.sqrt((2*dem*cc)/h);
    const cj = dem/365;
    const rop = cj*lt+ss;
    const sn = Math.floor(cj*(rand()*55+5));
    const sm = Math.floor(ss*1.2);
    const couv = sn/cj;
    const statut = sn<=0?"Rupture":(sn<sm?"Sous seuil":"Conforme");
    items.push({
      id:i+1, sku:`SKU-${String(i+1).padStart(4,'0')}`,
      article:`${prefixes[Math.floor(rand()*prefixes.length)]} ${types[Math.floor(rand()*types.length)]} ${String(Math.floor(rand()*500)).padStart(3,'0')}`,
      famille:families[Math.floor(rand()*families.length)],
      demande:dem, cout_unitaire:cout, lead_time:lt, stock_securite:ss,
      taux_possession:tp, cout_commande:cc, valeur_annuelle:va,
      h_annuel:h, eoq:Math.round(eoq), cmd_an:+(dem/eoq).toFixed(1),
      rop:Math.round(rop), stock_net:sn, seuil_min:sm,
      couverture:+couv.toFixed(1), statut_service:statut,
      supplier_id:[1,2,3,5,1,3,5,2][Math.floor(rand()*8)],
    });
  }
  items.sort((a,b)=>b.valeur_annuelle-a.valeur_annuelle);
  const totalVal = items.reduce((s,it)=>s+it.valeur_annuelle,0);
  let cumul = 0;
  items.forEach(it => {
    cumul += it.valeur_annuelle;
    it.abc = cumul/totalVal<=0.80?"A":(cumul/totalVal<=0.95?"B":"C");
    it.priorite = it.abc!=="C"&&it.statut_service!=="Conforme"?"Haute":(it.abc!=="C"?"Moyenne":"Basse");
  });
  return items;
}

export const ITEMS = generateItems();
