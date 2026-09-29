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
        link.setAttribute("aria-label","Buscar lojas de refrigeração nesta região no Google Maps");
        document.getElementById("btShopStatus").textContent = "Localização atualizada • pronto para buscar";
        document.querySelector(".bt-shop-shell").dataset.state = "ready";
    }

    function locationError(error){
        const link = document.getElementById("btShopGoogle");
        if(!link){ return; }
        latestPosition = null;
        link.removeAttribute("href");
        link.setAttribute("aria-disabled","true");
        link.setAttribute("aria-label","Tentar obter a localização novamente");
        document.getElementById("btShopStatus").textContent = error && error.code === 1
            ? "Ative a localização para buscar lojas"
            : "Não foi possível obter o GPS. Toque para tentar novamente";
        document.querySelector(".bt-shop-shell").dataset.state = "error";
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
        link.setAttribute("aria-label","Buscando sua localização atual");
        document.getElementById("btShopStatus").textContent = "Buscando sua posição atual";
        document.querySelector(".bt-shop-shell").dataset.state = "locating";

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
            style.textContent = "#btNearbyShopsScreen{position:fixed;inset:0;z-index:6600;display:none;overflow:auto;background:radial-gradient(circle at 50% 44%,#103b59 0,#0a263f 34%,#071a2e 72%);color:#fff;padding:calc(20px + env(safe-area-inset-top)) 20px calc(28px + env(safe-area-inset-bottom));box-sizing:border-box;font-family:inherit}\n#btNearbyShopsScreen.show{display:block}\n.bt-shop-shell{max-width:680px;min-height:100%;margin:auto;display:flex;flex-direction:column}\n.bt-shop-top{display:flex;align-items:center;gap:14px}\n.bt-shop-top button{display:grid;place-items:center;flex:none;background:#102b43;color:#fff;border:1px solid #3b647b;border-radius:16px;font-size:28px;width:48px;height:48px;line-height:1;cursor:pointer}\n.bt-shop-top strong{font-size:clamp(20px,5vw,25px);line-height:1.15}\n.bt-shop-main{flex:1;min-height:560px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px 0 20px}\n.bt-shop-eyebrow{color:#52d1ed;font-size:12px;font-weight:800;letter-spacing:.17em;text-transform:uppercase}\n.bt-shop-main h2{max-width:320px;margin:14px 0 9px;font-size:clamp(27px,7vw,36px);line-height:1.13;letter-spacing:-.035em}\n.bt-shop-description{max-width:340px;color:#b7cddd;font-size:15px;line-height:1.5}\n.bt-shop-orbit{position:relative;width:276px;height:276px;margin:32px 0 24px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(80,205,237,.16);background:radial-gradient(circle,rgba(17,142,184,.14) 25%,transparent 68%)}\n.bt-shop-orbit:before,.bt-shop-orbit:after{content:\"\";position:absolute;inset:19px;border:1px solid rgba(80,205,237,.22);border-radius:50%;pointer-events:none}\n.bt-shop-orbit:after{inset:43px;border-color:rgba(80,205,237,.30)}\n.bt-shop-google{position:relative;z-index:1;width:168px;height:168px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border-radius:50%;background:linear-gradient(145deg,#21bde4,#0879af);border:1px solid #6be3f4;box-shadow:0 16px 38px rgba(0,0,0,.28),0 0 34px rgba(23,182,224,.36),inset 0 1px 0 rgba(255,255,255,.4);color:#fff;text-decoration:none;font-size:15px;font-weight:800;line-height:1.2;letter-spacing:.02em;cursor:pointer;transition:transform .2s,box-shadow .2s}\n.bt-shop-google:hover,.bt-shop-google:focus-visible{transform:scale(1.055);box-shadow:0 18px 45px rgba(0,0,0,.32),0 0 42px rgba(23,182,224,.5)}\n.bt-shop-google:focus-visible,.bt-shop-top button:focus-visible{outline:3px solid #fff;outline-offset:4px}\n.bt-shop-google svg{width:46px;height:46px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}\n.bt-shop-google[aria-disabled=\"true\"]{opacity:.65;cursor:wait}\n.bt-shop-google[aria-disabled=\"true\"]:hover{transform:none}\n.bt-shop-status{display:flex;align-items:center;justify-content:center;gap:9px;min-height:22px;color:#c7dce8;font-size:14px;line-height:1.4}\n.bt-shop-status:before{content:\"\";width:8px;height:8px;flex:none;border-radius:50%;background:#f6bc5d;box-shadow:0 0 12px #f6bc5d}\n.bt-shop-shell[data-state=\"ready\"] .bt-shop-status:before{background:#49db9b;box-shadow:0 0 12px #49db9b}\n.bt-shop-shell[data-state=\"error\"] .bt-shop-status:before{background:#ff9b78;box-shadow:0 0 12px #ff9b78}\n.bt-shop-tip{margin-top:17px;max-width:330px;color:#8faabe;font-size:13px;line-height:1.45}\n@media(max-height:680px){.bt-shop-main{min-height:0;padding:38px 0 20px}.bt-shop-orbit{width:232px;height:232px;margin:20px 0}.bt-shop-google{width:148px;height:148px}}\n@media(prefers-reduced-motion:reduce){.bt-shop-google{transition:none}}";
            document.head.appendChild(style);

            screen = document.createElement("section");
            screen.id = "btNearbyShopsScreen";
            screen.innerHTML = "<div class=\"bt-shop-shell\" data-state=\"locating\">\n    <div class=\"bt-shop-top\"><button type=\"button\" id=\"btShopClose\" aria-label=\"Voltar\">‹</button><strong>Lojas perto de mim</strong></div>\n    <main class=\"bt-shop-main\">\n        <span class=\"bt-shop-eyebrow\">BoraTec • Área técnica</span>\n        <h2>Encontre a loja mais perto</h2>\n        <p class=\"bt-shop-description\">Lojas de refrigeração na região em que você está agora.</p>\n        <div class=\"bt-shop-orbit\">\n            <a id=\"btShopGoogle\" class=\"bt-shop-google\" aria-disabled=\"true\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"Localizando lojas de refrigeração\">\n                <svg viewBox=\"0 0 48 48\" aria-hidden=\"true\"><path d=\"M24 42s14-12 14-24a14 14 0 0 0-28 0c0 12 14 24 14 24Z\"/><circle cx=\"24\" cy=\"18\" r=\"5\"/></svg>\n            </a>\n        </div>\n        <p id=\"btShopStatus\" class=\"bt-shop-status\" role=\"status\" aria-live=\"polite\">Buscando sua posição atual</p>\n        <p class=\"bt-shop-tip\">Ao tocar no botão, você verá as lojas no Google Maps.</p>\n    </main>\n</div>";
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

/* Carrega o módulo isolado de Controladores. O módulo aguarda app.js ficar pronto. */
(function(){
    if(document.querySelector('script[data-boratec-controllers]')) return;
    const script = document.createElement('script');
    script.src = './controllers.js?v=1';
    script.async = true;
    script.dataset.boratecControllers = 'true';
    document.head.appendChild(script);
})();
