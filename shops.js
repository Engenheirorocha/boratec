/* BoraTec — busca de lojas no Google Maps com a posição atual. */
(function(){
    "use strict";

    let locationWatch = null;
    let generation = 0;
    let latestPosition = null;

    function searchURL(lat,lon){
        return "https://www.google.com/maps/search/" +
            encodeURIComponent("lojas de refrigeração") +
            "/@" + lat + "," + lon + ",13z";
    }

    function setPosition(position){
        const link = document.getElementById("btShopGoogle");
        if(!link){ return; }
        const {latitude,longitude,accuracy} = position.coords;
        if(!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
            !Number.isFinite(accuracy) || accuracy > 1000 ||
            Date.now() - position.timestamp > 60000){ return; }

        latestPosition = position;
        link.href = searchURL(latitude,longitude);
        link.removeAttribute("aria-disabled");
        link.textContent = "Buscar lojas nesta região no Google Maps ↗";
    }

    function locationError(error){
        const link = document.getElementById("btShopGoogle");
        if(!link){ return; }
        latestPosition = null;
        link.removeAttribute("href");
        link.setAttribute("aria-disabled","true");
        link.textContent = error && error.code === 1
            ? "Ative a localização para buscar lojas no Google Maps"
            : "Não foi possível obter o GPS. Toque para tentar novamente";
    }

    function stopGps(){
        generation++;
        if(locationWatch !== null && navigator.geolocation){
            navigator.geolocation.clearWatch(locationWatch);
            locationWatch = null;
        }
        latestPosition = null;
    }

    function startGps(){
        stopGps();
        const currentGeneration = generation;
        const link = document.getElementById("btShopGoogle");
        if(!link){ return; }
        link.removeAttribute("href");
        link.setAttribute("aria-disabled","true");
        link.textContent = "Localizando para abrir o Google Maps…";

        if(!navigator.geolocation){
            locationError();
            return;
        }

        locationWatch = navigator.geolocation.watchPosition(
            position => {
                if(currentGeneration === generation){ setPosition(position); }
            },
            error => {
                if(currentGeneration === generation){ locationError(error); }
            },
            {enableHighAccuracy:true,timeout:15000,maximumAge:0}
        );
    }

    function openNearbyShops(){
        let screen = document.getElementById("btNearbyShopsScreen");
        if(!screen){
            const style = document.createElement("style");
            style.textContent = `#btNearbyShopsScreen{position:fixed;inset:0;z-index:6600;display:none;overflow:auto;background:#071a2e;color:#fff;padding:20px 18px 90px;box-sizing:border-box}
                #btNearbyShopsScreen.show{display:block}.bt-shop-shell{max-width:680px;margin:auto}.bt-shop-top{display:flex;align-items:center;gap:12px;margin-bottom:22px}
                .bt-shop-top button{background:#0b243b;color:#fff;border:1px solid #47717f;border-radius:10px;font-size:24px;width:42px;height:42px}
                .bt-shop-top strong{font-size:22px}.bt-shop-google{display:block;text-align:center;background:#087fae;color:#fff;border-radius:10px;padding:15px;margin:14px 0 18px;text-decoration:none;font-size:16px;font-weight:700}
                .bt-shop-google[aria-disabled="true"]{opacity:.65;cursor:pointer}`;
            document.head.appendChild(style);

            screen = document.createElement("section");
            screen.id = "btNearbyShopsScreen";
            screen.innerHTML = `<div class="bt-shop-shell">
                <div class="bt-shop-top"><button type="button" id="btShopClose" aria-label="Voltar">‹</button><strong>Lojas perto de mim</strong></div>
                <p>Procure lojas de refrigeração perto da sua localização. Confirme a disponibilidade da peça antes de ir.</p>
                <a id="btShopGoogle" class="bt-shop-google" aria-disabled="true" target="_blank" rel="noopener noreferrer">Localizando para abrir o Google Maps…</a>
                </div>`;
            document.body.appendChild(screen);
            document.getElementById("btShopClose").addEventListener("click",closeNearbyShops);
            document.getElementById("btShopGoogle").addEventListener("click",event => {
                if(!latestPosition || Date.now() - latestPosition.timestamp > 60000){
                    event.preventDefault();
                    startGps();
                }
            });
        }
        screen.classList.add("show");
        document.body.style.overflow = "hidden";
        startGps();
    }

    function closeNearbyShops(){
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
