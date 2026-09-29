/* BoraTec — módulo isolado de controladores para a Área Técnica. */
(function(){
    "use strict";

    const families = [
        {
            id:"fg-mt512",
            brand:"Full Gauge",
            family:"MT-512",
            use:"Resfriados, controle de temperatura e degelo natural.",
            source:"https://www.fullgauge.com/br/manuais/",
            models:[
                {name:"MT-512E 2HP",note:"Refrigeração/aquecimento, degelo natural e relé para cargas de até 2 HP."},
                {name:"MT-512E Log",note:"Versão com registro de dados e recursos de monitoramento."},
                {name:"MT-512E Faston",note:"Versão Evolution com conexões Faston."},
                {name:"MT-512Ri",note:"Geração anterior ainda encontrada em campo."},
                {name:"MT-512R",note:"Geração anterior da família MT-512."}
            ]
        },
        {
            id:"fg-mt516",
            brand:"Full Gauge",
            family:"MT-516",
            use:"Controle de temperatura em refrigeração ou aquecimento.",
            source:"https://www.fullgauge.com/br/manuais/",
            models:[
                {name:"MT-516E",note:"Controle de temperatura com saída auxiliar configurável."},
                {name:"MT-516EVT",note:"Variante da família para aplicações com recursos adicionais."},
                {name:"MT-516CVT",note:"Geração anterior, sucedida pela linha EVT."},
                {name:"MT-516Ri",note:"Modelo anterior ainda comum em instalações existentes."}
            ]
        },
        {
            id:"fg-tc900",
            brand:"Full Gauge",
            family:"TC-900",
            use:"Congelados, compressor, ventilação e degelo.",
            source:"https://www.fullgauge.com/br/manuais/",
            models:[
                {name:"TC-900E Power",note:"Controle de congelados com degelo e ventilação."},
                {name:"TC-900E Log",note:"Controle de congelados com relógio e registro de dados."},
                {name:"TC-900E 2HP",note:"Versão com relé reforçado para compressor de até 2 HP."},
                {name:"TC-900Ri Power",note:"Geração anterior da família Power."},
                {name:"TC-900Ri Clock",note:"Geração anterior com relógio para agenda de degelo."}
            ]
        },
        {
            id:"dixell-xr-basic",
            brand:"Dixell / Copeland",
            family:"XR básica",
            use:"Termostatos e controladores compactos para refrigeração comercial.",
            source:"https://www.copeland.com/en-us/brands/dixell",
            models:[
                {name:"XR02CX",note:"Controlador compacto para aplicações básicas de refrigeração."},
                {name:"XR03CX",note:"Controlador para refrigeração com recursos de degelo."},
                {name:"XR06CX",note:"Controle de compressor, ventilador e degelo com duas sondas."}
            ]
        },
        {
            id:"dixell-xr-advanced",
            brand:"Dixell / Copeland",
            family:"XR avançada",
            use:"Refrigeração comercial com múltiplas saídas e funções de degelo.",
            source:"https://www.copeland.com/en-us/brands/dixell",
            models:[
                {name:"XR60CX",note:"Controlador universal para média e baixa temperatura."},
                {name:"XR70CX",note:"Família com recursos adicionais de saídas e controle."},
                {name:"XR75CX",note:"Versão mais completa da linha XR para aplicações comerciais."}
            ]
        },
        {
            id:"danfoss-erc21x",
            brand:"Danfoss",
            family:"ERC 21x",
            use:"Refrigeradores, expositores e aplicações comerciais.",
            source:"https://assets.danfoss.com/documents/latest/354499/BC194286421698pt-BR1001.pdf",
            models:[
                {name:"ERC 211",note:"Controle eletrônico para aplicações comerciais simples."},
                {name:"ERC 213",note:"Versão com mais recursos de controle e degelo."},
                {name:"ERC 214",note:"Versão com maior número de entradas/saídas para aplicações completas."}
            ]
        },
        {
            id:"carel-easy",
            brand:"CAREL",
            family:"easy / PJEZ",
            use:"Vitrines, balcões, unidades estáticas e ventiladas.",
            source:"https://www.carel.com/product/easy",
            models:[
                {name:"PJEZS",note:"Indicado para unidades estáticas em temperatura normal."},
                {name:"PJEZC",note:"Indicado para unidades ventiladas e aplicações de baixa temperatura."},
                {name:"PJEZY",note:"Variante da família easy para aplicações específicas."},
                {name:"easy compact",note:"Família compacta para controle de refrigeração."}
            ]
        },
        {
            id:"carel-ir33",
            brand:"CAREL",
            family:"IR33",
            use:"Refrigeração comercial e controle eletrônico de unidades frigoríficas.",
            source:"https://www.carel.com/ir33",
            models:[
                {name:"IR33",note:"Família de controladores eletrônicos para refrigeração comercial."},
                {name:"IR33C",note:"Variante da linha IR33 encontrada em aplicações frigoríficas."},
                {name:"IR33 Universal",note:"Versão para aplicações de controle mais flexíveis."}
            ]
        },
        {
            id:"elitech-ecs",
            brand:"Elitech",
            family:"ECS",
            use:"Câmaras, balcões, ilhas e equipamentos de resfriados/congelados.",
            source:"https://www.elitechbrasil.com.br/ecs-974-neo-controlador-digital-temperatura-para-congelados-110v",
            models:[
                {name:"ECS-974 NEO",note:"Controle de compressor, ventiladores e degelo em congelados."},
                {name:"ECS-961 NEO",note:"Controlador eletrônico da linha ECS para refrigeração."},
                {name:"ECS-974",note:"Geração anterior da família ainda encontrada em campo."}
            ]
        },
        {
            id:"coel-k49",
            brand:"COEL",
            family:"K49",
            use:"Controle de temperatura e processos térmicos, inclusive refrigeração.",
            source:"https://www.coel.com.br/produto/k49e-controlador-de-temperatura/manuais/",
            models:[
                {name:"K49E",note:"Controle ON/OFF ou PID, com aplicação em aquecimento ou refrigeração."},
                {name:"K49P",note:"Controle de tempo e temperatura com rampas, patamares e múltiplas saídas."}
            ]
        }
    ];

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
            .bt-ctrl-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
            .bt-ctrl-head strong{display:block;font-size:19px;font-weight:950}.bt-ctrl-head span{display:block;color:#88a4b8;font-size:11px;line-height:1.45;margin-top:5px}
            .bt-ctrl-back{border:1px solid rgba(94,207,255,.25);background:#0d2a43;color:#fff;border-radius:10px;padding:9px 11px;font-weight:900;cursor:pointer}
            .bt-ctrl-search{width:100%;height:46px;border-radius:12px;border:1px solid rgba(119,151,178,.25);background:#081f34;color:#fff;padding:0 13px;box-sizing:border-box;margin:0 0 13px}
            .bt-ctrl-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.bt-ctrl-card{border:1px solid rgba(94,207,255,.15);border-radius:14px;background:linear-gradient(145deg,#123752,#0a263f);color:#fff;padding:14px;text-align:left;cursor:pointer}
            .bt-ctrl-card b{display:block;font-size:13px}.bt-ctrl-card small{display:block;color:#87a5ba;font-size:10px;line-height:1.4;margin-top:5px}.bt-ctrl-brand{color:#5ecfff!important;font-weight:900;text-transform:uppercase;letter-spacing:.45px}
            .bt-ctrl-model{width:100%;display:block;margin:8px 0;border:1px solid rgba(119,151,178,.20);border-radius:12px;background:#0b2740;color:#fff;padding:13px;text-align:left;cursor:pointer}.bt-ctrl-model b{display:block}.bt-ctrl-model span{display:block;color:#88a3b7;font-size:10px;line-height:1.4;margin-top:4px}
            .bt-ctrl-detail h3{font-size:20px;margin:0 0 4px}.bt-ctrl-detail .maker{color:#5ecfff;font-size:10px;font-weight:900;text-transform:uppercase}.bt-ctrl-section{margin-top:16px;padding-top:13px;border-top:1px solid rgba(255,255,255,.08)}.bt-ctrl-section b{display:block;font-size:12px;margin-bottom:7px}.bt-ctrl-section p,.bt-ctrl-section li{color:#a9bfce;font-size:11px;line-height:1.55}.bt-ctrl-section ul{padding-left:18px;margin:0}
            .bt-ctrl-official{display:block;margin-top:18px;padding:13px;border-radius:12px;text-align:center;text-decoration:none;background:linear-gradient(145deg,#0ca9dd,#087da9);color:#fff;font-size:12px;font-weight:950;border:1px solid rgba(94,207,255,.45)}
            .bt-ctrl-note{margin-top:12px;padding:11px;border-radius:11px;background:rgba(255,255,255,.035);color:#7894a9;font-size:10px;line-height:1.5}
            @media(max-width:420px){.bt-ctrl-grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function workspace(){ return document.getElementById("btTechnicalWorkspace"); }

    function showFamilies(filter=""){
        ensureStyle();
        const box = workspace();
        if(!box) return;
        const term = String(filter || "").trim().toLowerCase();
        const visible = families.filter(f => !term || `${f.brand} ${f.family} ${f.models.map(m=>m.name).join(" ")}`.toLowerCase().includes(term));
        box.innerHTML = `
            <div class="bt-ctrl-head"><div><strong>Controladores</strong><span>Escolha a família ou pesquise pelo modelo.</span></div></div>
            <input id="btCtrlSearch" class="bt-ctrl-search" placeholder="Ex.: MT-512, TC-900, XR60..." value="${esc(filter)}">
            <div class="bt-ctrl-grid">${visible.map(f=>`
                <button class="bt-ctrl-card" type="button" onclick="openBoraTecControllerFamily('${f.id}')">
                    <small class="bt-ctrl-brand">${esc(f.brand)}</small><b>${esc(f.family)}</b><small>${esc(f.use)}</small><small>${f.models.length} modelos</small>
                </button>`).join("")}</div>
            <div class="bt-ctrl-note">Base inicial com 10 famílias prioritárias. Confirme sempre a identificação completa do modelo e a tensão antes de ligar ou alterar parâmetros.</div>`;
        box.classList.add("show");
        document.getElementById("btCtrlSearch")?.addEventListener("input",e=>showFamilies(e.target.value));
    }

    function openFamily(id){
        ensureStyle();
        const f = families.find(item=>item.id===id); const box = workspace();
        if(!f || !box) return;
        box.innerHTML = `
            <div class="bt-ctrl-head"><div><strong>${esc(f.family)}</strong><span>${esc(f.brand)} • ${esc(f.use)}</span></div><button class="bt-ctrl-back" type="button" onclick="openBoraTecControllers()">‹ Voltar</button></div>
            ${f.models.map((m,i)=>`<button class="bt-ctrl-model" type="button" onclick="openBoraTecControllerModel('${f.id}',${i})"><b>${esc(m.name)}</b><span>${esc(m.note)}</span></button>`).join("")}`;
        box.classList.add("show"); box.scrollIntoView({behavior:"smooth",block:"start"});
    }

    function openModel(id,index){
        ensureStyle();
        const f = families.find(item=>item.id===id); const m = f?.models?.[index]; const box = workspace();
        if(!f || !m || !box) return;
        box.innerHTML = `
            <div class="bt-ctrl-head"><div><span class="bt-ctrl-brand">${esc(f.brand)}</span><strong>${esc(m.name)}</strong><span>${esc(f.family)}</span></div><button class="bt-ctrl-back" type="button" onclick="openBoraTecControllerFamily('${f.id}')">‹ Voltar</button></div>
            <div class="bt-ctrl-detail">
                <h3>${esc(m.name)}</h3><div class="maker">${esc(f.brand)}</div>
                <div class="bt-ctrl-section"><b>Aplicação</b><p>${esc(m.note)} ${esc(f.use)}</p></div>
                <div class="bt-ctrl-section"><b>Instruções rápidas de campo</b><ul>
                    <li>Confirme o sufixo completo do modelo, alimentação e diagrama correspondente antes da ligação.</li>
                    <li>Desenergize o equipamento antes de alterar cabeamento, sensor ou saída de relé.</li>
                    <li>Confira o tipo e a posição dos sensores antes de concluir que há falha no controlador.</li>
                    <li>Registre o set point e os parâmetros existentes antes de fazer alterações.</li>
                    <li>Para degelo, ventilação, alarmes e parâmetros avançados, siga a revisão do manual correspondente ao modelo.</li>
                </ul></div>
                <div class="bt-ctrl-section"><b>Importante</b><p>Os bornes, limites de corrente, sensores aceitos e códigos de parâmetros mudam entre versões da mesma família. Não use o diagrama de outro modelo apenas por ter aparência semelhante.</p></div>
                <a class="bt-ctrl-official" href="${esc(f.source)}" target="_blank" rel="noopener noreferrer">Abrir manual / fonte oficial ↗</a>
                <div class="bt-ctrl-note">O BoraTec mostra um resumo para consulta rápida. O documento oficial do fabricante é a referência para instalação, ligação elétrica e parametrização.</div>
            </div>`;
        box.classList.add("show"); box.scrollIntoView({behavior:"smooth",block:"start"});
    }

    function rebuildCarouselAfterAddingCard(){
        const rail = document.getElementById("btTechnicalCarousel");
        const prev = document.getElementById("btTechnicalCarouselPrev");
        const next = document.getElementById("btTechnicalCarouselNext");
        const dots = document.getElementById("btTechnicalCarouselDots");
        if(!rail || !prev || !next || !dots) return;
        const railClone = rail.cloneNode(true); rail.replaceWith(railClone);
        const prevClone = prev.cloneNode(true); prev.replaceWith(prevClone);
        const nextClone = next.cloneNode(true); next.replaceWith(nextClone);
        const dotsClone = dots.cloneNode(true); dots.replaceWith(dotsClone);
        if(typeof window.setupTechnicalAreaCarousel === "function") window.setupTechnicalAreaCarousel();
    }

    function installCard(){
        const rail = document.getElementById("btTechnicalCarousel");
        if(!rail || document.getElementById("btControllersTechnicalCard")) return;
        const card = document.createElement("button");
        card.id = "btControllersTechnicalCard";
        card.className = "bt-tech-card";
        card.type = "button";
        card.setAttribute("onclick","openTechnicalCalculator('controladores')");
        card.innerHTML = `<div class="bt-tech-card-icon">🎛️</div><strong>Controladores</strong><small>Manuais rápidos e links oficiais dos controladores mais usados.</small>`;
        rail.appendChild(card);
        rebuildCarouselAfterAddingCard();
    }

    function hook(){
        if(typeof window.openTechnicalArea !== "function" || typeof window.openTechnicalCalculator !== "function") return false;
        if(window.__btControllersHooked) return true;
        window.__btControllersHooked = true;
        const originalOpen = window.openTechnicalArea;
        const originalCalc = window.openTechnicalCalculator;
        window.openTechnicalArea = function(){
            const result = originalOpen.apply(this,arguments);
            window.setTimeout(installCard,0);
            return result;
        };
        window.openTechnicalCalculator = function(type){
            if(type === "controladores"){
                showFamilies();
                window.setTimeout(()=>workspace()?.scrollIntoView({behavior:"smooth",block:"start"}),40);
                return;
            }
            return originalCalc.apply(this,arguments);
        };
        return true;
    }

    window.openBoraTecControllers = showFamilies;
    window.openBoraTecControllerFamily = openFamily;
    window.openBoraTecControllerModel = openModel;

    let attempts = 0;
    const timer = window.setInterval(()=>{
        attempts++;
        if(hook() || attempts > 80) window.clearInterval(timer);
    },100);
})();
