/* BoraTec: lojas de refrigeração próximas, sem chave de API nem dados de localização persistidos. */
(function(){
    "use strict";

    const endpoint = "https://overpass-api.de/api/interpreter";
    const cache = new Map();
    let activeRequest = 0;
    const geocodeCache = new Map();
    let locationWatch = null;
    let lastGpsSearch = null;
    let gpsGeneration = 0;

    function stopGps(){
        gpsGeneration++;
        if(locationWatch !== null && navigator.geolocation){
            navigator.geolocation.clearWatch(locationWatch);
            locationWatch = null;
        }
        lastGpsSearch = null;
    }

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
        // Inclui lojas identificadas pelo nome, descrição ou especialidade cadastrada.
        return `[out:json][timeout:20];(nwr(around:${radius},${lat},${lon})[shop][name~"refrigera|climatiza|ar.?condicionad|hvac",i];nwr(around:${radius},${lat},${lon})[shop][description~"refrigera|climatiza|ar.?condicionad|hvac",i];nwr(around:${radius},${lat},${lon})[shop=trade][trade~"hvac|refrigeration|air_conditioning",i];);out center tags;`;
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

    function googleSearchURL(lat,lon){
        return "https://www.google.com/maps/search/"+
            encodeURIComponent("lojas de refrigeração")+"/@"+lat+","+lon+",13z";
    }

    function setGoogleSearchPoint(lat,lon){
        const link = document.getElementById("btShopGoogle");
        if(Number.isFinite(lat) && Number.isFinite(lon)){
            link.href = googleSearchURL(lat,lon);
            link.removeAttribute("aria-disabled");
            link.textContent = "Buscar lojas nesta região no Google Maps ↗";
        }else{
            link.removeAttribute("href");
            link.setAttribute("aria-disabled","true");
            link.textContent = "Aguardando localização para abrir o Google Maps";
        }
    }

    function render(stores,lat,lon){
        const box = document.getElementById("btShopResults");
        if(!box){ return; }
        if(!stores.length){
            box.innerHTML = `<p>Nenhuma loja de refrigeração cadastrada a até 15 km deste ponto no OpenStreetMap. Isso não significa que não haja lojas na região. Use o botão do Google Maps acima para procurar mais.</p>`;
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
        }).join("") + `<p class="bt-shop-note">A lista acima usa as lojas cadastradas no OpenStreetMap a até 15 km. Para ver mais opções, use o botão do Google Maps.</p>`;
    }

    function setStatus(message){
        const box = document.getElementById("btShopResults");
        if(box){ box.textContent = message; }
    }

    function showSearchPoint(lat,lon,label,accuracy){
        const box = document.getElementById("btShopLocation");
        setGoogleSearchPoint(lat,lon);
        const point = lat.toFixed(5)+", "+lon.toFixed(5);
        const precision = Number.isFinite(accuracy) ? " • precisão aproximada: "+Math.round(accuracy)+" m" : "";
        box.innerHTML = "Buscando perto de: "+escapeHTML(label)+precision+
            `<br><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat+","+lon)}">Conferir ponto no mapa: ${point}</a>`;
    }

    async function searchAt(lat,lon,label,request,accuracy){
        showSearchPoint(lat,lon,label,accuracy);
        setStatus("Buscando lojas próximas…");
        try{
            const stores = await findStores(lat,lon,15000);
            if(request === activeRequest){ render(stores,lat,lon); }
        }catch(error){
            if(request === activeRequest){
                setStatus("A busca de lojas está indisponível agora. Tente novamente em instantes.");
            }
        }
    }

    async function searchManual(event){
        event.preventDefault();
        stopGps();
        const input = document.getElementById("btShopAddress");
        const query = input.value.trim();
        if(!query){ input.focus(); return; }
        const request = ++activeRequest;
        document.getElementById("btShopLocation").textContent = "";
        setGoogleSearchPoint();
        setStatus("Localizando "+query+"…");
        const form = document.getElementById("btShopForm");
        form.querySelector("button").disabled = true;
        try{
            let place = geocodeCache.get(query.toLocaleLowerCase("pt-BR"));
            if(!place){
                const url = new URL("https://nominatim.openstreetmap.org/search");
                url.search = new URLSearchParams({q:query,format:"jsonv2",countrycodes:"br",limit:"1",accept_language:"pt-BR"}).toString();
                const response = await fetch(url,{headers:{"Accept":"application/json"},referrerPolicy:"strict-origin-when-cross-origin"});
                if(!response.ok){ throw new Error("geocoding unavailable"); }
                const results = await response.json();
                place = results[0];
                if(place){ geocodeCache.set(query.toLocaleLowerCase("pt-BR"),place); }
            }
            if(request !== activeRequest){ return; }
            if(!place || !Number.isFinite(Number(place.lat)) || !Number.isFinite(Number(place.lon))){
                setStatus("Local não encontrado. Informe bairro e cidade, por exemplo: Copacabana, Rio de Janeiro.");
                return;
            }
            const label = place.display_name || query;
            await searchAt(Number(place.lat),Number(place.lon),label,request);
        }catch(error){
            if(request === activeRequest){ setStatus("Não foi possível localizar esse endereço agora. Tente novamente."); }
        }finally{
            form.querySelector("button").disabled = false;
        }
    }

    function showManualLocation(){
        activeRequest++;
        stopGps();
        cache.clear();
        const form = document.getElementById("btShopForm");
        form.hidden = false;
        document.getElementById("btShopLocation").textContent = "";
        setGoogleSearchPoint();
        setStatus("Digite um bairro, cidade ou endereço no Brasil para buscar lojas.");
        document.getElementById("btShopAddress").focus();
    }

    function loadNearbyShops(){
        stopGps();
        const generation = gpsGeneration;
        ++activeRequest;
        cache.clear();
        document.getElementById("btShopForm").hidden = true;
        document.getElementById("btShopLocation").textContent = "";
        setGoogleSearchPoint();
        if(!navigator.geolocation){ setStatus("Este dispositivo não oferece localização. Digite outra localização abaixo."); return; }
        setStatus("Aguardando uma posição atual e precisa do GPS…");
        locationWatch = navigator.geolocation.watchPosition(position=>{
            if(generation !== gpsGeneration ||
                !document.getElementById("btNearbyShopsScreen")?.classList.contains("show")){ return; }
            const {latitude:lat,longitude:lon} = position.coords;
            const accuracy = position.coords.accuracy;
            if(!Number.isFinite(lat) || !Number.isFinite(lon) ||
                Date.now()-position.timestamp > 60000 ||
                !Number.isFinite(accuracy) || accuracy > 1000){
                ++activeRequest;
                lastGpsSearch = null;
                document.getElementById("btShopLocation").textContent = "";
                setGoogleSearchPoint();
                setStatus("Aguardando GPS preciso. Ative a localização precisa no celular ou digite o local.");
                return;
            }
            const now = Date.now();
            if(lastGpsSearch &&
                distanceKm(lastGpsSearch.lat,lastGpsSearch.lon,lat,lon) < 0.5 &&
                now-lastGpsSearch.time < 5*60*1000){ return; }
            lastGpsSearch = {lat,lon,time:now};
            const request = ++activeRequest;
            cache.clear();
            searchAt(lat,lon,"GPS atual (atualizado "+new Date(position.timestamp).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})+")",request,accuracy);
        },error=>{
            if(generation !== gpsGeneration){ return; }
            ++activeRequest;
            lastGpsSearch = null;
            document.getElementById("btShopLocation").textContent = "";
            setGoogleSearchPoint();
            setStatus(error.code === 1
                ? "Permita o acesso à localização ou digite um bairro ou cidade."
                : "Não foi possível atualizar o GPS. Digite um bairro ou cidade.");
        },{enableHighAccuracy:true,timeout:15000,maximumAge:0});
    }

    function openNearbyShops(){
        let screen = document.getElementById("btNearbyShopsScreen");
        if(!screen){
            const style = document.createElement("style");
            style.textContent = `#btNearbyShopsScreen{position:fixed;inset:0;z-index:6600;display:none;overflow:auto;background:#071a2e;color:#fff;padding:20px 18px 90px;box-sizing:border-box}
                #btNearbyShopsScreen.show{display:block}.bt-shop-shell{max-width:680px;margin:auto}.bt-shop-top{display:flex;align-items:center;gap:12px;margin-bottom:22px}
                .bt-shop-top button{background:#0b243b;color:#fff;border:1px solid #47717f;border-radius:10px;font-size:24px;width:42px;height:42px}
                .bt-shop-top strong{font-size:22px}.bt-shop-card{display:block;margin:12px 0;padding:16px;border-radius:16px;background:#10283e;border:1px solid #36556b}
                .bt-shop-google{display:block;text-align:center;background:#087fae;color:#fff;border-radius:10px;padding:15px;margin:14px 0 18px;text-decoration:none;font-size:16px;font-weight:700}.bt-shop-google[aria-disabled="true"]{opacity:.55;cursor:wait}
                .bt-shop-card strong,.bt-shop-card span,.bt-shop-card small{display:block}.bt-shop-card span,.bt-shop-card small{color:#a9c1d2;margin-top:8px;line-height:1.5}
                .bt-shop-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.bt-shop-links a,.bt-shop-link,.bt-shop-actions button,#btShopForm button{display:inline-block;background:#087fae;color:white;border:0;border-radius:9px;padding:10px 13px;text-decoration:none;font-weight:700}
                .bt-shop-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.bt-shop-actions button{cursor:pointer}.bt-shop-actions button.secondary{background:#0b243b;border:1px solid #47717f}.bt-shop-location,.bt-shop-note{color:#a9c1d2;line-height:1.5;overflow-wrap:anywhere}.bt-shop-location a,.bt-shop-note a{color:#5ecfff}.bt-shop-form{margin-top:14px}.bt-shop-form[hidden]{display:none}.bt-shop-form label{display:block;margin-bottom:7px}.bt-shop-form input{width:100%;box-sizing:border-box;background:#10283e;color:#fff;border:1px solid #47717f;border-radius:9px;padding:12px;font-size:16px}.bt-shop-form button{margin-top:9px}.bt-shop-form button:disabled{opacity:.55}.bt-shop-foot{color:#829bb0;font-size:12px;line-height:1.5;margin-top:22px}.bt-shop-foot a{color:#5ecfff}`;
            document.head.appendChild(style);
            screen = document.createElement("section");
            screen.id = "btNearbyShopsScreen";
            screen.innerHTML = `<div class="bt-shop-shell"><div class="bt-shop-top"><button type="button" id="btShopClose" aria-label="Voltar">‹</button><strong>Lojas perto de mim</strong></div>
                <p>Procure lojas de refrigeração perto do ponto escolhido. Confirme a disponibilidade da peça antes de ir.</p>
                <a id="btShopGoogle" class="bt-shop-google" aria-disabled="true" target="_blank" rel="noopener noreferrer">Aguardando localização para abrir o Google Maps</a>
                <p class="bt-shop-note">A busca do Google Maps abre centrada no ponto encontrado; ele pode sugerir lojas fora dessa região. A lista abaixo usa o OpenStreetMap.</p>
                <p id="btShopLocation" class="bt-shop-location"></p><div id="btShopResults" aria-live="polite"></div>\n                <div class="bt-shop-actions"><button id="btShopReload" type="button">Usar GPS agora</button><button id="btShopChange" class="secondary" type="button">Alterar localização</button></div>\n                <form id="btShopForm" class="bt-shop-form" hidden><label for="btShopAddress">Bairro, cidade ou endereço</label><input id="btShopAddress" type="text" placeholder="Ex.: Copacabana, Rio de Janeiro" autocomplete="street-address" required><button type="submit">Buscar neste local</button></form>
                <div class="bt-shop-foot">As lojas dependem dos cadastros locais, e a distância mostrada é em linha reta. Telefone e WhatsApp só aparecem quando cadastrados. Dados: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>.</div></div>`;
            document.body.appendChild(screen);
            document.getElementById("btShopClose").addEventListener("click",closeNearbyShops);
            document.getElementById("btShopReload").addEventListener("click",loadNearbyShops);
            document.getElementById("btShopChange").addEventListener("click",showManualLocation);
            document.getElementById("btShopForm").addEventListener("submit",searchManual);
        }
        screen.classList.add("show");
        document.body.style.overflow = "hidden";
        loadNearbyShops();
    }

    function closeNearbyShops(){
        activeRequest++;
        stopGps();
        document.getElementById("btNearbyShopsScreen")?.classList.remove("show");
        document.body.style.overflow = "";
        if(typeof window.openBoraTecHome === "function"){
            window.openBoraTecHome();
        }
    }

    window.openNearbyShops = openNearbyShops;
    window.closeNearbyShops = closeNearbyShops;
})();
