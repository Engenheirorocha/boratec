/* BoraTec — Controladores: busca + carrossel + manual embutido. */
(function(){
    "use strict";

    const families = [
        {
            id:"fg-mt512", brand:"Full Gauge", family:"MT-512",
            use:"Resfriados, controle de temperatura e degelo natural.",
            source:"https://www.fullgauge.com/br/manuais/",
            models:[
                {name:"MT-512E 2HP",note:"Refrigeração/aquecimento, degelo natural e relé para cargas de até 2 HP.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/58_v5_pt_BR_4dea87e482.pdf"},
                {name:"MT-512E Log",note:"Versão com registro de dados e recursos de monitoramento.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/424_v3_pt_BR_1927418b28.pdf"},
                {name:"MT-512E Faston",note:"Versão Evolution com conexões Faston.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/421_v5_pt_BR_7f24759cee.pdf"},
                {name:"MT-512Ri",note:"Geração anterior ainda encontrada em campo.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/MT_512_RIV_11_01_T_13387_PORT_c00b81a139.pdf"},
                {name:"MT-512R",note:"Geração anterior da família MT-512.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/MT_512_06_1acac85bc8.pdf"}
            ]
        },
        {
            id:"fg-mt516", brand:"Full Gauge", family:"MT-516",
            use:"Controle de temperatura em refrigeração ou aquecimento.",
            source:"https://www.fullgauge.com/br/manuais/",
            models:[
                {name:"MT-516E",note:"Controle de temperatura com saída auxiliar configurável.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/516_v1_pt_BR_4c1ca81a52.pdf"},
                {name:"MT-516EVT",note:"Variante da família para aplicações com recursos adicionais.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/519_v4_pt_BR_15c28b2464.pdf"},
                {name:"MT-516CVT",note:"Geração anterior, sucedida pela linha EVT.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/MT_516_CVT_09_01_12235_PORT_d86768a0c9.pdf"},
                {name:"MT-516Ri",note:"Modelo anterior ainda comum em instalações existentes.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/MT_516_V11_03_T_10759_PORT_cbd42e161a.pdf"}
            ]
        },
        {
            id:"fg-tc900", brand:"Full Gauge", family:"TC-900",
            use:"Congelados, compressor, ventilação e degelo.",
            source:"https://www.fullgauge.com/br/manuais/",
            models:[
                {name:"TC-900E Power",note:"Controle de congelados com degelo e ventilação.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/876_v6_pt_BR_2572772f79.pdf"},
                {name:"TC-900E Log",note:"Controle de congelados com relógio e registro de dados.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/TC_900_ELOGV_05_01_T_20219_PORTUGUES_57f3db1710.pdf"},
                {name:"TC-900E 2HP",note:"Versão com relé reforçado para compressor de até 2 HP.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/864_v6_pt_BR_49f14836be.pdf"},
                {name:"TC-900Ri Power",note:"Geração anterior da família Power.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/TC_900_RIPWV_03_05_T_12768_PORT_7a3f5c3b31.pdf"},
                {name:"TC-900Ri Clock",note:"Geração anterior com relógio para agenda de degelo.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/CLOCKV_10_05_T_11000_PORT_0ebf119900.pdf"}
            ]
        },
        {
            id:"fg-tic17", brand:"Full Gauge", family:"TIC-17",
            use:"Termostato de uso geral para refrigeração ou aquecimento.",
            source:"https://www.fullgauge.com/br/produtos/tic-17rgti/",
            models:[
                {name:"TIC-17RGTi",note:"Termostato digital para câmaras, balcões, freezers e outras aplicações.",manualUrl:"https://fullgauge-strapi-prod-media-f340da7.s3.sa-east-1.amazonaws.com/1080_v10_pt_BR_b513de9248.pdf"}
            ]
        },
        {
            id:"dixell-xr-basic", brand:"Dixell / Copeland", family:"XR básica",
            use:"Termostatos e controladores compactos para refrigeração comercial.",
            source:"https://www.copeland.com/en-us/brands/dixell",
            models:[
                {name:"XR02CX",note:"Controlador compacto para aplicações básicas de refrigeração.",manualUrl:"https://webapps.copeland.com/Dixell/Content/Pages/Manuals/E-CLASS/XR01-02CX/XR01-02CX-PT.pdf"},
                {name:"XR03CX",note:"Controlador para refrigeração com recursos de degelo.",manualUrl:"https://webapps.copeland.com/Dixell/Content/Pages/Manuals/E-CLASS/XR03-04CX/XR03-04CX-PT.pdf"},
                {name:"XR06CX",note:"Controle de compressor, ventilador e degelo com duas sondas.",manualUrl:"https://webapps.copeland.com/Dixell/Content/Pages/Manuals/E-CLASS/XR06CX/XR06CX-PT.pdf"}
            ]
        },
        {
            id:"dixell-xr-advanced", brand:"Dixell / Copeland", family:"XR avançada",
            use:"Refrigeração comercial com múltiplas saídas e funções de degelo.",
            source:"https://www.copeland.com/en-us/brands/dixell",
            models:[
                {name:"XR60CX",note:"Controlador universal para média e baixa temperatura.",manualUrl:"https://webapps.copeland.com/Dixell/Content/Pages/Manuals/XR-CX/XR60CX/XR60CX-PT.pdf"},
                {name:"XR70CX",note:"Família com recursos adicionais de saídas e controle.",manualUrl:"https://webapps.copeland.com/Dixell/Content/Pages/Manuals/XR-CX/XR70CX/XR70CX-GB.pdf"},
                {name:"XR75CX",note:"Versão mais completa da linha XR para aplicações comerciais.",manualUrl:"https://webapps.copeland.com/Dixell/Content/Pages/Manuals/XR-CX/XR75CX/XR75CX-PT.pdf"}
            ]
        },
        {
            id:"danfoss-erc21x", brand:"Danfoss", family:"ERC 21x",
            use:"Refrigeradores, expositores e aplicações comerciais.",
            source:"https://assets.danfoss.com/documents/latest/354499/BC194286421698pt-BR1001.pdf",
            models:[
                {name:"ERC 211",note:"Controle eletrônico para aplicações comerciais simples.",manualUrl:"https://assets.danfoss.com/documents/latest/354499/BC194286421698pt-BR1001.pdf"},
                {name:"ERC 213",note:"Versão com mais recursos de controle e degelo.",manualUrl:"https://assets.danfoss.com/documents/latest/354499/BC194286421698pt-BR1001.pdf"},
                {name:"ERC 214",note:"Versão com maior número de entradas/saídas para aplicações completas.",manualUrl:"https://assets.danfoss.com/documents/latest/354499/BC194286421698pt-BR1001.pdf"}
            ]
        },
        {
            id:"carel-easy", brand:"CAREL", family:"easy / PJEZ",
            use:"Vitrines, balcões, unidades estáticas e ventiladas.",
            source:"https://www.carel.com/product/easy",
            models:[
                {name:"PJEZS",note:"Indicado para unidades estáticas em temperatura normal.",manualUrl:"https://www.carel.com/documents/10191/0/%2B030220795/04016baa-8186-4dde-9176-b7d8cefe032c?version=1.0"},
                {name:"PJEZC",note:"Indicado para unidades ventiladas e aplicações de baixa temperatura.",manualUrl:"https://www.carel.com/documents/10191/0/%2B030220795/04016baa-8186-4dde-9176-b7d8cefe032c?version=1.0"},
                {name:"PJEZY",note:"Variante da família easy para aplicações específicas.",manualUrl:"https://www.carel.com/documents/10191/0/%2B030220795/04016baa-8186-4dde-9176-b7d8cefe032c?version=1.0"},
                {name:"easy compact",note:"Família compacta para controle de refrigeração.",manualUrl:"https://www.carel.com/documents/10191/0/%2B030220795/04016baa-8186-4dde-9176-b7d8cefe032c?version=1.0"}
            ]
        },
        {
            id:"carel-ir33", brand:"CAREL", family:"IR33",
            use:"Refrigeração comercial e controle eletrônico de unidades frigoríficas.",
            source:"https://www.carel.com/ir33",
            models:[
                {name:"IR33",note:"Família de controladores eletrônicos para refrigeração comercial.",manualUrl:"https://www.airventilation.ru/files/Carel/-1-ad4e6ffb-97f5-4cfa-ae74-9a2015132b7cversion1.0.pdf"},
                {name:"IR33C",note:"Variante da linha IR33 encontrada em aplicações frigoríficas.",manualUrl:"https://www.airventilation.ru/files/Carel/-1-ad4e6ffb-97f5-4cfa-ae74-9a2015132b7cversion1.0.pdf"},
                {name:"IR33 Universal",note:"Versão para aplicações de controle mais flexíveis.",manualUrl:"https://www.carel.com/documents/10191/0/%2B030220805/02ebf09f-9c56-424a-b9ee-2864605a32cd?version=1.0"}
            ]
        },
        {
            id:"elitech-ecs", brand:"Elitech", family:"ECS",
            use:"Câmaras, balcões, ilhas e equipamentos de resfriados/congelados.",
            source:"https://www.elitechbrasil.com.br/ecs-974-neo-controlador-digital-temperatura-para-congelados-110v",
            models:[
                {name:"ECS-974 NEO",note:"Controle de compressor, ventiladores e degelo em congelados.",manualUrl:"https://drive.google.com/file/d/1MrZ9-yUKRnC2TgDrzAIN8ImTW6i5MouC/preview"},
                {name:"ECS-961 NEO",note:"Controlador eletrônico da linha ECS para refrigeração.",manualUrl:"https://institucional.elitechbrasil.com.br/wp-content/uploads/2019/08/Manual-ECS-961.pdf"},
                {name:"ECS-974",note:"Geração anterior da família ainda encontrada em campo.",manualUrl:"https://xzhuaying.com/static/upload/file/20250122/1737516733134459.pdf"}
            ]
        },
        {
            id:"coel-k49", brand:"COEL", family:"K49",
            use:"Controle de temperatura e processos térmicos, inclusive refrigeração.",
            source:"https://www.coel.com.br/produto/k49e-controlador-de-temperatura/manuais/",
            models:[
                {name:"K49E",note:"Controle ON/OFF ou PID, com aplicação em aquecimento ou refrigeração.",manualUrl:"https://cdn.media.coel.com.br/uploads/2016/08/Manual-de-Instrucoes-K49E_r5.pdf"},
                {name:"K49P",note:"Controle de tempo e temperatura com rampas, patamares e múltiplas saídas.",manualUrl:"https://cdn.media.coel.com.br/uploads/2016/08/Manual-de-Instrucoes-K49P_r2.pdf"}
            ]
        }
    ];

    const models = families.flatMap(f => f.models.map((m,index) => ({
        ...m,
        index,
        familyId:f.id,
        brand:f.brand,
        family:f.family,
        use:f.use,
        source:f.source
    })));

    let activeModels = models;
    let activeManualUrl = null;
    let carouselIndex = 0;
    let pointerStartX = null;
    let dragged = false;

    const esc = value => String(value ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");

    function ensureStyle(){
        if(document.getElementById("btControllersStyle")) return;
        const style = document.createElement("style");
        style.id = "btControllersStyle";
        style.textContent = `
            #btControllersScreen{position:fixed;inset:0;z-index:6700;display:none;overflow:auto;background:radial-gradient(circle at 50% 38%,rgba(13,125,178,.16),transparent 38%),linear-gradient(180deg,#070d11,#0a1116);color:#fff;font-family:inherit}
            #btControllersScreen.show{display:block}
            .bt-ctrl-shell{width:min(100%,760px);margin:auto;min-height:100dvh;padding:calc(18px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom));box-sizing:border-box}
            .bt-ctrl-top{display:flex;align-items:center;gap:12px}.bt-ctrl-back{width:44px;height:44px;display:grid;place-items:center;border:1px solid #3c4b54;border-radius:10px;background:#151e23;color:#fff;font-size:25px;cursor:pointer}
            .bt-ctrl-heading small{display:block;color:#37c7ef;font-size:9px;font-weight:900;letter-spacing:.8px;text-transform:uppercase}.bt-ctrl-heading strong{display:block;font-size:22px;font-weight:950;margin-top:3px}
            .bt-ctrl-search-wrap{margin:22px 0 16px;position:relative}.bt-ctrl-search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:18px;color:#7e919d}.bt-ctrl-search{width:100%;height:52px;border-radius:12px;border:1px solid #3e4d56;background:#10181d;color:#fff;padding:0 44px 0 44px;box-sizing:border-box;font-size:16px;outline:none}.bt-ctrl-search:focus{border-color:#25bce8;box-shadow:0 0 0 3px rgba(37,188,232,.08)}.bt-ctrl-clear{position:absolute;right:8px;top:8px;width:36px;height:36px;border:0;border-radius:8px;background:#1a252b;color:#9dafb9;font-size:18px;cursor:pointer}
            .bt-ctrl-result{color:#8fa1ab;font-size:11px;margin-bottom:9px}
            .bt-ctrl-list-view{display:flex;flex-direction:column;min-height:calc(100dvh - 100px)}
            .bt-ctrl-result{margin-bottom:0}
            .bt-ctrl-carousel{position:relative;display:block;flex:1;min-height:310px;overflow:hidden;touch-action:pan-y;user-select:none;perspective:900px;box-sizing:border-box}
            .bt-ctrl-card{position:absolute;top:50%;left:50%;width:min(72vw,264px);min-height:250px;border:1px solid #3d4d56;border-radius:18px;padding:20px;background:linear-gradient(145deg,#1d303b,#0e171d);color:#fff;text-align:left;box-sizing:border-box;cursor:pointer;box-shadow:0 18px 36px rgba(0,0,0,.5);opacity:0;pointer-events:none;transform:translate(-50%,-50%) scale(.72);transition:transform .32s cubic-bezier(.22,.61,.36,1),opacity .32s ease,filter .32s ease,border-color .32s ease,box-shadow .32s ease;will-change:transform,opacity}
            .bt-ctrl-card.is-active{z-index:5;opacity:1;pointer-events:auto;filter:none;transform:translate(-50%,-50%) scale(1);border-color:#2cc6f1;box-shadow:0 20px 44px rgba(0,0,0,.58),0 0 26px rgba(12,178,224,.22)}
            .bt-ctrl-card.is-prev,.bt-ctrl-card.is-next{z-index:3;opacity:.5;pointer-events:auto;filter:brightness(.68)}
            .bt-ctrl-card.is-prev{transform:translate(-112%,-50%) scale(.82) rotateY(10deg)}
            .bt-ctrl-card.is-next{transform:translate(12%,-50%) scale(.82) rotateY(-10deg)}
            .bt-ctrl-card.is-hidden{z-index:1;opacity:0;pointer-events:none;transform:translate(-50%,-50%) scale(.64)}
            .bt-ctrl-card.is-active:active{transform:translate(-50%,-50%) scale(.985)}
            .bt-ctrl-card:before{content:"";position:absolute;left:18px;top:0;width:72px;height:3px;background:linear-gradient(90deg,#08baf0,transparent)}.bt-ctrl-card .brand{color:#35c9f1;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.6px}.bt-ctrl-card h3{font-size:24px;line-height:1.05;margin:20px 0 8px}.bt-ctrl-card .family{color:#a8b6bd;font-size:11px}.bt-ctrl-card p{color:#a8b6bd;font-size:11px;line-height:1.5;margin-top:24px}.bt-ctrl-card .open{display:block;margin-top:20px;color:#dff8ff;font-size:11px;font-weight:900}
            .bt-ctrl-controls{display:flex;justify-content:center;align-items:center;gap:12px;margin:0 0 18px}.bt-ctrl-arrow{width:44px;height:44px;border:1px solid #3f4d55;border-radius:50%;background:#172126;color:#fff;font-size:23px;cursor:pointer}.bt-ctrl-count{min-width:90px;text-align:center;color:#a6b6bf;font-size:12px}
            .bt-ctrl-empty{padding:55px 20px;text-align:center;color:#7f919c}.bt-ctrl-empty strong{display:block;color:#dce5e9;margin-bottom:7px}
            .bt-ctrl-detail{display:none}.bt-ctrl-detail.show{display:block}.bt-ctrl-list-view.hidden{display:none}
            .bt-ctrl-detail-head{display:flex;align-items:flex-start;gap:12px;margin:20px 0}.bt-ctrl-detail-title{flex:1}.bt-ctrl-detail-title small{display:block;color:#39c9ef;font-size:9px;font-weight:900;text-transform:uppercase}.bt-ctrl-detail-title h2{font-size:27px;line-height:1.05;margin:5px 0}.bt-ctrl-detail-title span{color:#91a2ab;font-size:12px}.bt-ctrl-official-round{flex:0 0 48px;width:48px;height:48px;display:grid;place-items:center;border:1px solid #27c5f0;border-radius:50%;background:linear-gradient(145deg,#0aaee0,#087fae);color:#fff;box-shadow:0 4px 16px rgba(0,170,220,.28);text-decoration:none;transition:transform .16s ease,filter .16s ease}.bt-ctrl-official-round:hover{filter:brightness(1.12)}.bt-ctrl-official-round:active{transform:scale(.94)}.bt-ctrl-official-round svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
            .bt-ctrl-detail-box{border:1px solid #39474f;border-radius:12px;background:#11191e;padding:15px;margin:12px 0}.bt-ctrl-detail-box b{display:block;font-size:12px;margin-bottom:7px}.bt-ctrl-detail-box p,.bt-ctrl-detail-box li{color:#a9b6bd;font-size:12px;line-height:1.55}.bt-ctrl-detail-box ul{margin:0;padding-left:18px}
            .bt-ctrl-manual-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:22px 0 9px}.bt-ctrl-manual-title strong{font-size:15px}.bt-ctrl-pdf-preview{position:relative;width:100%;height:40vh;min-height:300px;max-height:500px;border:1px solid #41515a;border-radius:12px;background:#fff;overflow:hidden}.bt-ctrl-pdf-preview iframe{width:100%;height:100%;border:0;background:#fff;pointer-events:none}.bt-ctrl-pdf-tap{position:absolute;inset:0;width:100%;height:100%;border:0;background:linear-gradient(180deg,transparent 60%,rgba(4,10,14,.62));color:#fff;cursor:pointer}.bt-ctrl-pdf-tap span{position:absolute;right:12px;bottom:12px;padding:10px 13px;border-radius:9px;background:#078bb8;color:#fff;font-size:11px;font-weight:900;box-shadow:0 3px 12px #0008}.bt-ctrl-pdf-modal{display:none;position:fixed;inset:0;z-index:20;background:#070d11}.bt-ctrl-pdf-modal.show{display:block}.bt-ctrl-pdf-modal iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#fff}.bt-ctrl-pdf-close{position:absolute;top:calc(10px + env(safe-area-inset-top));right:12px;z-index:2;width:42px;height:42px;border:1px solid #66808d;border-radius:50%;background:#14232bea;color:#fff;font-size:25px;cursor:pointer}.bt-ctrl-manual-fallback{padding:22px;border:1px dashed #44545d;border-radius:12px;text-align:center;color:#96a6af;font-size:12px;line-height:1.5;background:#11191e}.bt-ctrl-official{display:block;margin-top:12px;padding:13px;border-radius:10px;text-align:center;text-decoration:none;background:linear-gradient(180deg,#0aaee0,#087fae);color:#fff;font-size:12px;font-weight:950;border:1px solid #22c9f6}
            .bt-ctrl-pdf-direct{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:18px;text-align:center;color:#20333c;cursor:pointer}.bt-ctrl-pdf-symbol{font-size:42px}.bt-ctrl-pdf-direct strong{font-size:16px}.bt-ctrl-pdf-direct>span:not(.bt-ctrl-pdf-symbol){font-size:12px;color:#52646c}.bt-ctrl-pdf-direct b{padding:11px 16px;border-radius:9px;background:#078bb8;color:#fff;font-size:12px}.bt-ctrl-note{margin-top:11px;color:#73848e;font-size:10px;line-height:1.5}
            @media(max-width:520px){.bt-ctrl-card{width:min(72vw,250px)}.bt-ctrl-pdf-preview{height:68vh;min-height:360px;max-height:none}}
        `;
        document.head.appendChild(style);
    }

    function createScreen(){
        ensureStyle();
        if(document.getElementById("btControllersScreen")) return;
        const screen = document.createElement("section");
        screen.id = "btControllersScreen";
        screen.innerHTML = `
            <div class="bt-ctrl-shell">
                <div class="bt-ctrl-top">
                    <button id="btCtrlMainBack" class="bt-ctrl-back" type="button" aria-label="Voltar">‹</button>
                    <div class="bt-ctrl-heading"><small>BORATEC • ÁREA TÉCNICA</small><strong>Controladores</strong></div>
                </div>
                <div id="btCtrlListView" class="bt-ctrl-list-view">
                    <div class="bt-ctrl-search-wrap">
                        <span class="bt-ctrl-search-icon">⌕</span>
                        <input id="btCtrlSearch" class="bt-ctrl-search" autocomplete="off" placeholder="Digite o modelo: MT-512, XR60, ERC 214...">
                        <button id="btCtrlClear" class="bt-ctrl-clear" type="button" aria-label="Limpar busca">×</button>
                    </div>
                    <div id="btCtrlResult" class="bt-ctrl-result"></div>
                    <div id="btCtrlCarousel" class="bt-ctrl-carousel" tabindex="0" role="region" aria-label="Modelos de controladores. Deslize para navegar"></div>
                    <div class="bt-ctrl-controls">
                        <button id="btCtrlPrev" class="bt-ctrl-arrow" type="button" aria-label="Anterior">‹</button>
                        <div id="btCtrlCount" class="bt-ctrl-count"></div>
                        <button id="btCtrlNext" class="bt-ctrl-arrow" type="button" aria-label="Próximo">›</button>
                    </div>
                </div>
                <div id="btCtrlDetail" class="bt-ctrl-detail"></div>
            </div>
            <div id="btCtrlManualModal" class="bt-ctrl-pdf-modal" aria-label="Manual ampliado">
                <button class="bt-ctrl-pdf-close" type="button" onclick="closeBoraTecManualFullScreen()" aria-label="Fechar manual">×</button>
                <iframe title="Manual ampliado do controlador" loading="lazy"></iframe>
            </div>`;
        document.body.appendChild(screen);
        document.getElementById("btCtrlMainBack").addEventListener("click",backMain);
        document.getElementById("btCtrlSearch").addEventListener("input",event=>renderCarousel(event.target.value));
        document.getElementById("btCtrlClear").addEventListener("click",()=>{
            const input=document.getElementById("btCtrlSearch"); if(input){input.value=""; input.focus();} renderCarousel("");
        });
        document.getElementById("btCtrlPrev").addEventListener("click",()=>moveCarousel(-1));
        document.getElementById("btCtrlNext").addEventListener("click",()=>moveCarousel(1));
        const carousel=document.getElementById("btCtrlCarousel");
        carousel.addEventListener("pointerdown",event=>{
            if(event.pointerType==="mouse"&&event.button!==0) return;
            pointerStartX=event.clientX;
            dragged=false;

        });
        carousel.addEventListener("pointerup",event=>{
            if(pointerStartX===null) return;
            const delta=event.clientX-pointerStartX;
            pointerStartX=null;
            if(Math.abs(delta)>=42){
                dragged=true;
                moveCarousel(delta<0?1:-1);
            }
            window.setTimeout(()=>{dragged=false;},0);
        });
        carousel.addEventListener("pointercancel",()=>{
            pointerStartX=null;
            dragged=false;
        });
        carousel.addEventListener("click",event=>{
            const card=event.target.closest(".bt-ctrl-card");
            if(!card||!carousel.contains(card)) return;
            if(dragged){event.preventDefault();event.stopPropagation();return;}
            const index=visibleCards().indexOf(card);
            if(index!==carouselIndex){
                event.preventDefault();event.stopPropagation();
                moveCarousel(card.classList.contains("is-prev")?-1:1);
            }
        },true);
        carousel.addEventListener("keydown",event=>{
            if(event.key==="ArrowRight"||event.key==="ArrowLeft"){
                event.preventDefault();moveCarousel(event.key==="ArrowRight"?1:-1);
            }
        });
    }

    function filteredModels(term=""){
        const q=String(term||"").trim().toLowerCase().replace(/\s+/g,"");
        if(!q) return models;
        return models.filter(m=>`${m.brand}${m.family}${m.name}`.toLowerCase().replace(/\s+/g,"").includes(q));
    }

    function renderCarousel(term=""){
        createScreen();
        const carousel=document.getElementById("btCtrlCarousel");
        const result=document.getElementById("btCtrlResult");
        const list=filteredModels(term);
        activeModels=list;
        carouselIndex=0;
        carousel.dataset.visibleCount=String(list.length);
        carousel.innerHTML=list.length ? list.map(m=>`
            <button class="bt-ctrl-card" type="button" data-family="${esc(m.familyId)}" data-index="${m.index}">
                <span class="brand">${esc(m.brand)}</span>
                <h3>${esc(m.name)}</h3>
                <span class="family">Família ${esc(m.family)}</span>
                <p>${esc(m.note)}</p>
                <span class="open">ABRIR CONTROLADOR →</span>
            </button>`).join("") : `<div class="bt-ctrl-empty"><strong>Modelo não encontrado</strong>Tente parte do código ou o nome da marca.</div>`;
        carousel.querySelectorAll(".bt-ctrl-card").forEach(card=>card.addEventListener("click",()=>openModel(card.dataset.family,Number(card.dataset.index))));
        result.textContent=list.length===1 ? "1 controlador encontrado" : `${list.length} controladores encontrados`;
        requestAnimationFrame(updateCounter);
    }

    function visibleCards(){ return Array.from(document.querySelectorAll("#btCtrlCarousel .bt-ctrl-card")); }

    function normalizeIndex(index,length){
        return length ? ((index%length)+length)%length : 0;
    }

    function updateCounter(){
        const cards=visibleCards(); const count=document.getElementById("btCtrlCount");
        if(!count) return;
        carouselIndex=normalizeIndex(carouselIndex,cards.length);
        const previous=normalizeIndex(carouselIndex-1,cards.length);
        const following=normalizeIndex(carouselIndex+1,cards.length);
        count.textContent=cards.length ? `${carouselIndex+1} / ${cards.length}` : "0 / 0";
        cards.forEach((card,index)=>{
            card.classList.toggle("is-active",index===carouselIndex);
            card.classList.toggle("is-prev",cards.length>1&&index===previous);
            card.classList.toggle("is-next",cards.length>1&&index===following);
            card.classList.toggle("is-hidden",index!==carouselIndex&&index!==previous&&index!==following);
            card.setAttribute("aria-label",`${index+1} de ${cards.length}: ${card.querySelector("h3")?.textContent||""}`);
        });
    }

    function moveCarousel(direction){
        const cards=visibleCards();
        if(!cards.length) return;
        carouselIndex=normalizeIndex(carouselIndex+direction,cards.length);
        updateCounter();
    }

    function openControllers(){
        createScreen();
        if(typeof window.closeTechnicalArea==="function") window.closeTechnicalArea();
        const screen=document.getElementById("btControllersScreen");
        screen.classList.add("show"); document.body.style.overflow="hidden";
        document.getElementById("btCtrlDetail").classList.remove("show");
        document.getElementById("btCtrlListView").classList.remove("hidden");
        const input=document.getElementById("btCtrlSearch"); if(input) input.value="";
        renderCarousel("");
        screen.scrollTo(0,0);
    }

    function backMain(){
        const detail=document.getElementById("btCtrlDetail");
        if(detail?.classList.contains("show")){ showList(); return; }
        document.getElementById("btControllersScreen")?.classList.remove("show");
        document.body.style.overflow="";
        if(typeof window.openTechnicalArea==="function") window.openTechnicalArea();
    }

    function showList(){
        document.getElementById("btCtrlDetail")?.classList.remove("show");
        document.getElementById("btCtrlListView")?.classList.remove("hidden");
        document.getElementById("btControllersScreen")?.scrollTo(0,0);
    }

    function manualViewerUrl(url){
        return String(url);
    }

    function openManualFullscreen(){
        if(!activeManualUrl) return;
        // Abrir o PDF como documento principal aciona o leitor nativo do telefone,
        // sem depender de o servidor do fabricante permitir exibição em iframe.
        window.location.assign(activeManualUrl);
    }

    function closeManualFullscreen(){
        const modal=document.getElementById("btCtrlManualModal");
        if(!modal) return;
        modal.classList.remove("show");
        const frame=modal.querySelector("iframe");
        if(frame) frame.src="about:blank";
    }

    function openModel(familyId,index){
        const f=families.find(item=>item.id===familyId); const m=f?.models?.[index]; if(!f||!m) return;
        const list=document.getElementById("btCtrlListView"); const detail=document.getElementById("btCtrlDetail");
        list.classList.add("hidden"); detail.classList.add("show");
        const manual=m.manualUrl||null;
        activeManualUrl=manual;
        detail.innerHTML=`
            <div class="bt-ctrl-detail-head">
                <button class="bt-ctrl-back" type="button" onclick="openBoraTecControllersList()" aria-label="Voltar">‹</button>
                <div class="bt-ctrl-detail-title"><small>${esc(f.brand)}</small><h2>${esc(m.name)}</h2><span>${esc(f.family)}</span></div>
                <a class="bt-ctrl-official-round" href="${esc(manual||f.source)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir fonte oficial do fabricante" title="Abrir fonte oficial do fabricante"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.75h7l4.25 4.3v11.2A1.75 1.75 0 0 1 16.5 21h-9A1.75 1.75 0 0 1 5.75 19.25v-13.75A1.75 1.75 0 0 1 7.5 3.75Z"/><path d="M14 4v4.5h4.25M8.5 13.5h7M8.5 16.5h5"/><path d="m15.5 11.5 2 2 3.5-3.5"/></svg></a>
            </div>
            <div class="bt-ctrl-detail-box"><b>Aplicação</b><p>${esc(m.note)} ${esc(f.use)}</p></div>
            <div class="bt-ctrl-detail-box"><b>Antes de alterar parâmetros</b><ul><li>Confirme o modelo e o sufixo completos.</li><li>Confira alimentação, sensores e diagrama correspondente.</li><li>Registre set point e parâmetros atuais antes de modificar.</li><li>Desenergize o equipamento antes de qualquer alteração de cabeamento.</li></ul></div>
`;
        document.getElementById("btControllersScreen")?.scrollTo(0,0);
    }

    function rebuildCarouselAfterAddingCard(){
        const rail=document.getElementById("btTechnicalCarousel");
        const prev=document.getElementById("btTechnicalCarouselPrev");
        const next=document.getElementById("btTechnicalCarouselNext");
        const dots=document.getElementById("btTechnicalCarouselDots");
        if(!rail||!prev||!next||!dots) return;
        const railClone=rail.cloneNode(true);rail.replaceWith(railClone);
        const prevClone=prev.cloneNode(true);prev.replaceWith(prevClone);
        const nextClone=next.cloneNode(true);next.replaceWith(nextClone);
        const dotsClone=dots.cloneNode(true);dots.replaceWith(dotsClone);
        if(typeof window.setupTechnicalAreaCarousel==="function") window.setupTechnicalAreaCarousel();
    }

    function installCard(){
        const rail=document.getElementById("btTechnicalCarousel");
        if(!rail||document.getElementById("btControllersTechnicalCard")) return;
        const card=document.createElement("button");
        card.id="btControllersTechnicalCard"; card.className="bt-tech-card"; card.type="button";
        card.setAttribute("onclick","openTechnicalCalculator('controladores')");
        card.innerHTML=`<div class="bt-tech-card-icon">🎛️</div><strong>Controladores</strong><small>Pesquise modelos, navegue no carrossel e consulte manuais.</small>`;
        rail.appendChild(card); rebuildCarouselAfterAddingCard();
    }

    function hook(){
        if(typeof window.openTechnicalArea!=="function"||typeof window.openTechnicalCalculator!=="function") return false;
        if(window.__btControllersHookedV2) return true;
        window.__btControllersHookedV2=true;
        const originalOpen=window.openTechnicalArea; const originalCalc=window.openTechnicalCalculator;
        window.openTechnicalArea=function(){const r=originalOpen.apply(this,arguments);window.setTimeout(installCard,0);return r;};
        window.openTechnicalCalculator=function(type){if(type==="controladores"){openControllers();return;}return originalCalc.apply(this,arguments);};
        return true;
    }

    window.openBoraTecManualFullScreen=openManualFullscreen;
    window.closeBoraTecManualFullScreen=closeManualFullscreen;
    window.openBoraTecControllers=openControllers;
    window.openBoraTecControllersList=showList;
    window.openBoraTecControllerModel=openModel;

    let attempts=0;
    const timer=window.setInterval(()=>{attempts++;if(hook()||attempts>80) window.clearInterval(timer);},100);
})();
