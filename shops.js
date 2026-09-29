/* BoraTec: lojas de refrigeração próximas, sem chave de API nem dados de localização persistidos. */
(function(){
    "use strict";

    const endpoint = "https://overpass-api.de/api/interpreter";
    const cache = new Map();
    let activeRequest = 0;

    function escapeHTML(value){
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
        })[char]);
    }

    function distanceKm(a,b,c,d){
        const rad = Math.PI / 180;
        const deltaLat = (c-a)*rad;
        const deltaLon = (d-b)*rad;
        const x = Math.sin(deltaLat/2)**2 + Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(deltaLon/2)**2;
        return 12742 * Math.asin(Math.min(1,Math.sqrt(x)));
    }

    function address(tags){
        const street = [tags["addr:street"],tags["addr:housenumber"]].filter(Boolean).join(", ");
        return [street,tags["addr:suburb"],tags["addr:city"]].filter(Boolean).join(" • ") || "Endereço não informado";
    }

    function digitsForWhatsApp(value){
        const raw = String(value || "").split(/[;,]/)[0].replace(/\D/g,"");
        if(raw.length === 10 || raw.length === 11){ return "55"+raw; }
        return raw.length >= 12 && raw.length <= 13 ? raw : "";
    }

    function normalizeElement(element,lat,lon){
        const tags = element.tags || {};
        const point = element.center || element;
        if(!tags.name || !Number.isFinite(point.lat) || !Number.isFinite(point.lon)){ return null; }
        const phone = String(tags["contact:phone"] || tags.phone || "").split(/[;,]/)[0].trim();
        const whatsapp = digitsForWhatsApp(tags["contact:whatsapp"] || tags.whatsapp);
        return {
            id:element.type+"/"+element.id,
            name:tags.name,
            address:address(tags),
            phone,
            whatsapp,
            lat:point.lat,
            lon:point.lon,
            distance:distanceKm(lat,lon,point.lat,point.lon)
        };
    }

    function queryFor(lat,lon,radius){
        // Só lojas, com nome relacionado a refrigeração/climatização.
        return `[out:json][timeout:20];(nwr(around:${radius},${lat},${lon})[shop][name~"refrigera|climatiza|ar.?condicionad|hvac",i];nwr(around:${radius},${lat},${lon})[shop=trade][trade~"hvac|refrigeration|air_conditioning",i];);out center tags;`;
    }

    async function findStores(lat,lon,radius){
        const key = `${lat.toFixed(3)},${lon.toFixed(3)},${radius}`;
        const saved = cache.get(key);
        if(saved && Date.now()-saved.time < 15*60*1000){ return saved.stores; }
        const controller = new AbortController();
        const timer = setTimeout(()=>controller.abort(),22000);
        try{
            const response = await fetch(endpoint,{
                method:"POST",
                headers:{"Content-Type":"application/x-www-form-urlencoded"},
                body:"data="+encodeURIComponent(queryFor(lat,lon,radius)),
                signal:controller.signal
            });
            if(!response.ok){ throw new Error("consulta indisponível"); }
            const data = await response.json();
            const stores = Array.from(new Map((data.elements || [])
                .map(item=>normalizeElement(item,lat,lon))
                .filter(Boolean).map(item=>[item.id,item])).values())
                .sort((a,b)=>a.distance-b.distance);
            cache.set(key,{time:Date.now(),stores});
            return stores;
        }finally{
            clearTimeout(timer);
        }
    }

    function routeURL(store){
        return "https://www.google.com/maps/dir/?api=1&destination="+
            encodeURIComponent(store.lat+","+store.lon);
    }

    function render(stores,lat,lon){
        const box = document.getElementById("btShopResults");
        if(!box){ return; }
        if(!stores.length){
            box.innerHTML = `<p>Nenhuma loja cadastrada nesta região na base consultada. Você pode procurar outras no mapa.</p>
                <a class="bt-shop-link" target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("loja de refrigeração perto de "+lat+","+lon)}">Procurar lojas no mapa</a>`;
            return;
        }
        box.innerHTML = stores.slice(0,3).map(store=>{
            const tel = store.phone.replace(/[^+\d]/g,"");
            return `<article class="bt-shop-card">
                <strong>${escapeHTML(store.name)}</strong>
                <span>${store.distance.toFixed(1).replace(".",",")} km em linha reta • ${escapeHTML(store.address)}</span>
                <div class="bt-shop-links">
                    ${tel ? `<a href="tel:${escapeHTML(tel)}">Ligar</a>` : ""}
                    ${store.whatsapp ? `<a target="_blank" rel="noopener noreferrer" href="https://wa.me/${store.whatsapp}?text=${encodeURIComponent("Olá! Vocês têm a peça que procuro para refrigeração?")}">WhatsApp</a>` : ""}
                    <a target="_blank" rel="noopener noreferrer" href="${routeURL(store)}">Traçar rota</a>
                </div>
                ${!tel && !store.whatsapp ? `<small>Contato não cadastrado. Confira a loja antes de sair.</small>` : ""}
            </article>`;
        }).join("");
    }

    function setStatus(message){
        const box = document.getElementById("btShopResults");
        if(box){ box.textContent = message; }
    }

    async function loadNearbyShops(){
        const request = ++activeRequest;
        if(!navigator.geolocation){ setStatus("Este dispositivo não oferece localização."); return; }
        setStatus("Obtendo sua localização…");
        navigator.geolocation.getCurrentPosition(async position=>{
            if(request !== activeRequest){ return; }
            const {latitude:lat,longitude:lon} = position.coords;
            setStatus("Buscando lojas próximas…");
            try{
                let stores = await findStores(lat,lon,15000);
                if(stores.length < 3){ stores = await findStores(lat,lon,50000); }
                if(request === activeRequest){ render(stores,lat,lon); }
            }catch(error){
                if(request === activeRequest){
                    setStatus("A busca de lojas está indisponível agora. Tente novamente em instantes.");
                }
            }
        },error=>{
            if(request !== activeRequest){ return; }
            setStatus(error.code === 1
                ? "Permita o acesso à localização para ver as lojas próximas."
                : "Não foi possível obter sua localização. Verifique o GPS e tente novamente.");
        },{enableHighAccuracy:false,timeout:12000,maximumAge:0});
    }

    function openNearbyShops(){
        let screen = document.getElementById("btNearbyShopsScreen");
        if(!screen){
            const style = document.createElement("style");
            style.textContent = `#btNearbyShopsScreen{position:fixed;inset:0;z-index:6600;display:none;overflow:auto;background:#071a2e;color:#fff;padding:20px 18px 90px;box-sizing:border-box}
                #btNearbyShopsScreen.show{display:block}.bt-shop-shell{max-width:680px;margin:auto}.bt-shop-top{display:flex;align-items:center;gap:12px;margin-bottom:22px}
                .bt-shop-top button{background:#0b243b;color:#fff;border:1px solid #47717f;border-radius:10px;font-size:24px;width:42px;height:42px}
                .bt-shop-top strong{font-size:22px}.bt-shop-card{display:block;margin:12px 0;padding:16px;border-radius:16px;background:#10283e;border:1px solid #36556b}
                .bt-shop-card strong,.bt-shop-card span,.bt-shop-card small{display:block}.bt-shop-card span,.bt-shop-card small{color:#a9c1d2;margin-top:8px;line-height:1.5}
                .bt-shop-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.bt-shop-links a,.bt-shop-link,#btShopReload{display:inline-block;background:#087fae;color:white;border:0;border-radius:9px;padding:10px 13px;text-decoration:none;font-weight:700}
                #btShopReload{margin-top:10px}.bt-shop-foot{color:#829bb0;font-size:12px;line-height:1.5;margin-top:22px}.bt-shop-foot a{color:#5ecfff}`;
            document.head.appendChild(style);
            screen = document.createElement("section");
            screen.id = "btNearbyShopsScreen";
            screen.innerHTML = `<div class="bt-shop-shell"><div class="bt-shop-top"><button type="button" id="btShopClose" aria-label="Voltar">‹</button><strong>Lojas perto de mim</strong></div>
                <p>Encontre até três lojas de refrigeração próximas. Confirme a disponibilidade da peça antes de ir.</p>
                <div id="btShopResults" aria-live="polite"></div><button id="btShopReload" type="button">Buscar novamente</button>
                <div class="bt-shop-foot">As lojas dependem dos cadastros locais, e a distância mostrada é em linha reta. Telefone e WhatsApp só aparecem quando cadastrados. Dados: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>.</div></div>`;
            document.body.appendChild(screen);
            document.getElementById("btShopClose").addEventListener("click",closeNearbyShops);
            document.getElementById("btShopReload").addEventListener("click",loadNearbyShops);
        }
        screen.classList.add("show");
        document.body.style.overflow = "hidden";
        loadNearbyShops();
    }

    function closeNearbyShops(){
        activeRequest++;
        document.getElementById("btNearbyShopsScreen")?.classList.remove("show");
        document.body.style.overflow = "";
        if(typeof window.openBoraTecHome === "function"){
            window.openBoraTecHome();
        }
    }

    window.openNearbyShops = openNearbyShops;
    window.closeNearbyShops = closeNearbyShops;
})();
