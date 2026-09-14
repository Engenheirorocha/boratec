/* =========================================================
   BORATEC
   APP.JS
   V0.6

   FUNCIONANDO:
   - Login / sessão
   - Perfil real
   - Feed Supabase
   - Publicação real
   - Interesse
   - Conversa privada
   - Chat realtime
   - Lista de mensagens
   - Fechar com profissional
   - Meus Serviços
   - Iniciar serviço
   - Marcar serviço como realizado
   - Confirmar conclusão
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const BORATEC_SUPABASE_URL =
    "https://kgagljuutvlpdeqjgqsj.supabase.co";

const BORATEC_SUPABASE_KEY =
    "sb_publishable_dToKktNJesqf1N_fHs4uUQ_Q3th_tCs";


let boraSupabase = null;
let boraUser = null;
let boraProfile = null;


/* =========================================================
   CHAT
========================================================= */

let currentConversationId = null;
let currentConversationTitle = null;
let currentConversationData = null;

let messagesChannel = null;
let interestsChannel = null;


/* =========================================================
   START
========================================================= */

async function startBoraTec(){

    console.log("🚀 BoraTec iniciando...");


    if(typeof window.supabase === "undefined"){

        console.error("Supabase não carregado.");

        return;

    }


    boraSupabase =
        window.supabase.createClient(
            BORATEC_SUPABASE_URL,
            BORATEC_SUPABASE_KEY
        );


    const logged =
        await checkBoraTecSession();


    if(!logged){

        return;

    }


    await loadBoraTecProfile();

    updateBoraTecUserInterface();

    createChatInterface();

    await loadOpportunities();

    listenAuthChanges();

    listenForNewInterests();


    console.log("✅ BoraTec iniciado.");

}


/* =========================================================
   SESSÃO
========================================================= */

async function checkBoraTecSession(){

    try{

        const {
            data,
            error
        } =
        await boraSupabase.auth
        .getSession();


        if(error){

            console.error(error);

            redirectToLogin();

            return false;

        }


        if(!data?.session?.user){

            redirectToLogin();

            return false;

        }


        boraUser =
            data.session.user;


        return true;


    }catch(error){

        console.error(error);

        redirectToLogin();

        return false;

    }

}


/* =========================================================
   PERFIL
========================================================= */

async function loadBoraTecProfile(){

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from("profiles")
        .select("*")
        .eq(
            "id",
            boraUser.id
        )
        .single();


        if(error){

            boraProfile = {

                id:
                    boraUser.id,

                name:
                    boraUser
                    .user_metadata
                    ?.name
                    ||
                    getEmailName(
                        boraUser.email
                    ),

                professional_name:
                    boraUser
                    .user_metadata
                    ?.professional_name
                    ||
                    null,

                photo_url:null,

                state:null,

                city:null

            };


            return;

        }


        boraProfile =
            data;


    }catch(error){

        console.error(
            "Erro perfil:",
            error
        );

    }

}


/* =========================================================
   INTERFACE USUÁRIO
========================================================= */

function updateBoraTecUserInterface(){

    updateGreeting();

    updateAvatar();

}


/* =========================================================
   SAUDAÇÃO
========================================================= */

function updateGreeting(){

    const hello =
        document.querySelector(
            ".hello"
        );


    if(!hello){

        return;

    }


    const name =
        boraProfile?.name
        ||
        boraProfile?.professional_name
        ||
        "Profissional";


    const firstName =
        String(name)
        .trim()
        .split(/\s+/)[0];


    const hour =
        new Date()
        .getHours();


    let greeting =
        "OLÁ";


    if(
        hour >= 5
        &&
        hour < 12
    ){

        greeting =
            "BOM DIA";

    }
    else if(
        hour >= 12
        &&
        hour < 18
    ){

        greeting =
            "BOA TARDE";

    }
    else{

        greeting =
            "BOA NOITE";

    }


    hello.textContent =
        `${greeting}, ${firstName.toUpperCase()}`;

}


/* =========================================================
   AVATAR
========================================================= */

function updateAvatar(){

    const avatar =
        document.querySelector(
            ".avatar"
        );


    if(!avatar){

        return;

    }


    if(boraProfile?.photo_url){

        avatar.innerHTML = `

            <img
                src="${escapeHtml(
                    boraProfile.photo_url
                )}"
                alt="Perfil"
                style="
                    width:100%;
                    height:100%;
                    object-fit:cover;
                    border-radius:50%;
                "
            >

        `;


        return;

    }


    const name =
        boraProfile?.professional_name
        ||
        boraProfile?.name
        ||
        "BoraTec";


    avatar.textContent =
        getInitials(name);

}


/* =========================================================
   INICIAIS
========================================================= */

function getInitials(name){

    if(!name){

        return "BT";

    }


    const parts =
        String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if(parts.length === 1){

        return parts[0]
        .substring(
            0,
            2
        )
        .toUpperCase();

    }


    return (
        parts[0][0]
        +
        parts[
            parts.length - 1
        ][0]
    )
    .toUpperCase();

}


/* =========================================================
   EMAIL → NOME
========================================================= */

function getEmailName(email){

    if(!email){

        return "Profissional";

    }


    return String(email)
    .split("@")[0]
    .replace(
        /[._-]+/g,
        " "
    );

}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(value){

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}


/* =========================================================
   ESCAPE JS
========================================================= */

function escapeJs(value){

    return String(
        value
        ??
        ""
    )
    .replace(
        /\\/g,
        "\\\\"
    )
    .replace(
        /'/g,
        "\\'"
    )
    .replace(
        /\n/g,
        " "
    );

}


/* =========================================================
   FEED
========================================================= */

async function loadOpportunities(){

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from("opportunities")
        .select(`

            id,
            author_id,
            type,
            title,
            description,
            category,
            state,
            city,
            neighborhood,
            service_date,
            value,
            value_negotiable,
            urgency,
            status,
            created_at,

            profiles (
                id,
                name,
                professional_name,
                photo_url
            )

        `)
        .eq(
            "status",
            "open"
        )
        .in(
            "type",
            ["service","helper"]
        )
        .order(
            "created_at",
            {
                ascending:false
            }
        );


        if(error){

            console.error(
                "Erro oportunidades:",
                error
            );


            showToast(
                "Erro ao carregar oportunidades"
            );


            return;

        }


        posts =
            data.map(
                convertDatabaseOpportunity
            );


        renderFeed();


    }catch(error){

        console.error(error);

    }

}


/* =========================================================
   BANCO → CARD
========================================================= */

function convertDatabaseOpportunity(item){

    const profile =
        item.profiles
        ||
        {};


    let uiType =
        item.type;


    if(
        item.type === "technician_available"
        ||
        item.type === "helper_available"
    ){

        uiType =
            "available";

    }


    const professionalName =
        profile.professional_name
        ||
        profile.name
        ||
        "Profissional BoraTec";


    let location =
        "";


    if(item.neighborhood){

        location +=
            item.neighborhood;

    }


    if(item.city){

        if(location){

            location +=
                " • ";

        }


        location +=
            item.city;

    }


    if(item.state){

        location +=
            ` - ${item.state}`;

    }


    return {

        id:
            item.id,

        authorId:
            item.author_id,

        type:
            uiType,

        databaseType:
            item.type,

        title:
            item.title,

        location:
            location
            ||
            "Local não informado",

        date:
            (
                item.type === "technician_available"
                ||
                item.type === "helper_available"
            )
            ?
            formatAvailabilityDate(
                item.service_date
            )
            :
            formatServiceDate(
                item.service_date
            ),

        category:
            item.category
            ||
            "Serviço técnico",

        description:
            item.description
            ||
            "",

        price:
            item.value,

        author:
            professionalName,

        initials:
            getInitials(
                professionalName
            ),

        rating:null,

        jobs:0,

        time:
            timeAgo(
                item.created_at
            ),

        urgent:
            item.urgency === true,

        createdAt:
            item.created_at

    };

}


/* =========================================================
   DATA SERVIÇO
========================================================= */

function formatServiceDate(serviceDate){

    if(!serviceDate){

        return "A combinar";

    }


    const date =
        new Date(serviceDate);


    const today =
        new Date();


    const tomorrow =
        new Date();


    tomorrow.setDate(
        today.getDate() + 1
    );


    if(
        date.toDateString()
        ===
        today.toDateString()
    ){

        return "Hoje";

    }


    if(
        date.toDateString()
        ===
        tomorrow.toDateString()
    ){

        return "Amanhã";

    }


    return date
    .toLocaleDateString(
        "pt-BR"
    );

}


function formatAvailabilityDate(
    serviceDate
){

    if(!serviceDate){
        return "Horário a combinar";
    }

    const date =
        new Date(
            serviceDate
        );

    if(
        Number.isNaN(
            date.getTime()
        )
    ){
        return "Horário a combinar";
    }

    const day =
        date
        .toLocaleDateString(
            "pt-BR",
            {
                weekday:"short",
                day:"2-digit",
                month:"2-digit"
            }
        );

    const time =
        date
        .toLocaleTimeString(
            "pt-BR",
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        );

    return `${day} às ${time}`;
}


/* =========================================================
   TEMPO PUBLICAÇÃO
========================================================= */

function timeAgo(dateString){

    if(!dateString){

        return "";

    }


    const created =
        new Date(dateString);


    const seconds =
        Math.floor(
            (
                new Date()
                -
                created
            )
            /
            1000
        );


    if(seconds < 60){

        return "agora";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if(minutes < 60){

        return `há ${minutes} min`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if(hours < 24){

        return `há ${hours} h`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    return `há ${days} d`;

}


/* =========================================================
   CARD FEED
========================================================= */

cardHTML =
function(post){

    let typeText =
        "SERVIÇO";

    let typeClass =
        "";

    let typeIcon =
        "🔥";

    let button =
        "Quero fazer";

    let buttonClass =
        "action-btn";


    if(post.type === "service"){

        typeText =
            post.urgent
            ?
            "SERVIÇO URGENTE"
            :
            "SERVIÇO";

    }


    if(post.type === "helper"){

        typeText =
            "PRECISO DE AJUDANTE";

        typeClass =
            "helper";

        typeIcon =
            "👷";

        button =
            "Tenho interesse";

    }


    if(post.type === "available"){

        typeText =
            "PROFISSIONAL DISPONÍVEL";

        typeClass =
            "available";

        typeIcon =
            "●";

        button =
            "Chamar";

        buttonClass =
            "action-btn orange";

    }


    const priceHTML =
        post.price !== null
        &&
        post.price !== undefined

        ?

        `

        <div class="price">

            <small>
                Valor informado
            </small>

            <strong>
                ${money(post.price)}
            </strong>

        </div>

        `

        :

        `

        <div class="price">

            <small>
                Valor
            </small>

            <strong
                style="
                    font-size:12px;
                    color:#9bb0c4;
                "
            >
                A combinar
            </strong>

        </div>

        `;


    const isOwnPost =
        boraUser
        &&
        post.authorId ===
        boraUser.id;


    const actionHTML =
        isOwnPost

        ?

        `

        <button
            class="action-btn"
            style="
                background:
                rgba(255,255,255,.08);
                color:#9fb4c8;
                box-shadow:none;
            "
            disabled
        >
            Sua publicação
        </button>

        `

        :

        `

        <button
            class="${buttonClass}"
            onclick="
                interest('${post.id}')
            "
        >
            ${button}
        </button>

        `;


    return `

    <article
        class="
            job-card
            ${post.urgent ? "urgent" : ""}
        "
    >

        <div class="card-top">

            <div
                class="
                    type
                    ${typeClass}
                "
            >

                <span>
                    ${typeIcon}
                </span>

                ${typeText}

            </div>


            <div class="time">

                ${safe(post.time)}

            </div>

        </div>


        <div class="job-title">

            ${safe(post.title)}

        </div>


        <div class="job-info">

            <span>
                📍
                ${safe(post.location)}
            </span>


            <span>
                📅
                ${safe(post.date)}
            </span>


            <span>
                ❄
                ${safe(post.category)}
            </span>

        </div>


        <div class="job-description">

            ${safe(post.description)}

        </div>


        <div class="professional">

            <div class="prof-avatar">

                ${safe(post.initials)}

            </div>


            <div class="prof-data">

                <div class="prof-name">

                    ${safe(post.author)}

                </div>


                <div class="prof-rating">

                    <span
                        style="
                            color:#ff8a1d;
                            font-weight:900;
                        "
                    >
                        NOVO
                    </span>

                    &nbsp;•&nbsp;

                    0 serviços BoraTec

                </div>

            </div>

        </div>


        <div class="job-action">

            ${priceHTML}

            ${actionHTML}

        </div>

    </article>

    `;

};


/* =========================================================
   PUBLICAR
========================================================= */

publishPost =
async function(event){

    event.preventDefault();


    if(!boraUser){

        showToast(
            "Usuário não carregado"
        );

        return;

    }


    const button =
        event.target
        .querySelector(
            ".submit"
        );


    const oldText =
        button.textContent;


    button.disabled =
        true;


    button.textContent =
        "Publicando...";


    try{

        const uiType =
            document
            .getElementById(
                "postType"
            )
            .value;


        const title =
            document
            .getElementById(
                "postTitle"
            )
            .value
            .trim();


        const location =
            document
            .getElementById(
                "postLocation"
            )
            .value
            .trim();


        const dateOption =
            document
            .getElementById(
                "postDate"
            )
            .value;


        const category =
            document
            .getElementById(
                "postCategory"
            )
            .value;


        const description =
            document
            .getElementById(
                "postDescription"
            )
            .value
            .trim();


        const priceText =
            document
            .getElementById(
                "postPrice"
            )
            .value
            .replace(
                ",",
                "."
            )
            .trim();


        if(
            !title
            ||
            !location
            ||
            !description
        ){

            showToast(
                "Preencha os campos"
            );

            return;

        }


        const phoneRegex =
            /(?:\(?\d{2}\)?[\s-]?)?(?:9[\s-]?)?\d{4}[\s-]?\d{4}/;


        if(
            phoneRegex.test(
                description
            )
        ){

            showToast(
                "Não coloque telefone na publicação"
            );

            return;

        }


        let databaseType =
            uiType;


        if(uiType === "available"){

            databaseType =
                "technician_available";

        }


        let value =
            null;


        if(priceText){

            const parsed =
                Number(priceText);


            if(!Number.isNaN(parsed)){

                value =
                    parsed;

            }

        }


        const {
            error
        } =
        await boraSupabase
        .from("opportunities")
        .insert({

            author_id:
                boraUser.id,

            type:
                databaseType,

            title:
                title,

            description:
                description,

            category:
                category,

            state:
                boraProfile?.state
                ||
                "RJ",

            city:
                location,

            neighborhood:
                null,

            service_date:
                convertDateOption(
                    dateOption
                ),

            value:
                value,

            value_negotiable:
                value === null,

            urgency:
                dateOption ===
                "Agora",

            status:
                "open"

        });


        if(error){

            throw error;

        }


        document
        .getElementById(
            "publishForm"
        )
        .reset();


        closePublish();


        currentFilter =
            "all";


        document
        .querySelectorAll(
            ".tab"
        )
        .forEach(
            item =>
            item.classList.remove(
                "active"
            )
        );


        document
        .querySelector(
            '[data-filter="all"]'
        )
        ?.classList
        .add(
            "active"
        );


        await loadOpportunities();


        showToast(
            "Oportunidade publicada!"
        );


    }catch(error){

        console.error(
            "Erro publicar:",
            error
        );


        showToast(
            "Não foi possível publicar"
        );


    }finally{

        button.disabled =
            false;


        button.textContent =
            oldText;

    }

};


/* =========================================================
   DATA PUBLICAÇÃO
========================================================= */

function convertDateOption(option){

    const date =
        new Date();


    if(option === "Amanhã"){

        date.setDate(
            date.getDate() + 1
        );

    }


    if(option === "Esta semana"){

        date.setDate(
            date.getDate() + 3
        );

    }


    return date.toISOString();

}


/* =========================================================
   QUERO FAZER
========================================================= */

interest =
async function(opportunityId){

    if(!boraUser){

        return;

    }


    const post =
        posts.find(
            item =>
            String(item.id)
            ===
            String(opportunityId)
        );


    if(!post){

        showToast(
            "Oportunidade não encontrada"
        );

        return;

    }


    if(
        post.authorId
        ===
        boraUser.id
    ){

        showToast(
            "Essa publicação é sua"
        );

        return;

    }


    showToast(
        "Abrindo conversa..."
    );


    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .rpc(
            "express_interest_and_open_chat",
            {
                p_opportunity_id:
                    opportunityId
            }
        );


        if(error){

            throw error;

        }


        if(
            !data
            ||
            data.length === 0
        ){

            throw new Error(
                "Conversa não criada"
            );

        }


        currentConversationId =
            data[0]
            .conversation_id;


        currentConversationTitle =
            post.title;


        await openChat(
            currentConversationId,
            currentConversationTitle
        );


    }catch(error){

        console.error(
            "Erro interesse:",
            error
        );


        showToast(
            "Não foi possível abrir a conversa"
        );

    }

};


/* =========================================================
   CRIAR INTERFACE CHAT
========================================================= */

function createChatInterface(){

    if(
        document.getElementById(
            "boratecChatOverlay"
        )
    ){

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.textContent = `

    #boratecChatOverlay{

        position:fixed;
        inset:0;

        background:#06182b;

        z-index:3000;

        display:none;

        flex-direction:column;

    }


    #boratecChatOverlay.show{

        display:flex;

    }


    .bt-chat-header{

        min-height:68px;

        padding:
        9px 14px;

        display:flex;

        align-items:center;

        gap:12px;

        background:#081e34;

        border-bottom:
        1px solid rgba(255,255,255,.08);

        flex-shrink:0;

    }


    .bt-chat-back{

        width:40px;
        height:40px;

        flex-shrink:0;

        border:none;

        border-radius:12px;

        background:
        rgba(255,255,255,.07);

        color:white;

        font-size:20px;

        cursor:pointer;

    }


    .bt-chat-title{

        flex:1;

        min-width:0;

    }


    .bt-chat-title small{

        display:block;

        color:#ff8a1d;

        font-weight:900;

        font-size:9px;

        letter-spacing:.8px;

        margin-bottom:3px;

    }


    .bt-chat-title strong{

        display:block;

        white-space:nowrap;

        overflow:hidden;

        text-overflow:ellipsis;

        font-size:14px;

    }


    .bt-close-job{

        border:none;

        border-radius:11px;

        padding:
        9px 12px;

        background:
        linear-gradient(
            135deg,
            #ff7900,
            #ff982f
        );

        color:white;

        font-weight:900;

        font-size:10px;

        cursor:pointer;

        white-space:nowrap;

    }


    .bt-job-closed{

        padding:
        8px 11px;

        border-radius:10px;

        background:
        rgba(25,200,117,.13);

        border:
        1px solid rgba(25,200,117,.2);

        color:#50df96;

        font-size:9px;

        font-weight:900;

        white-space:nowrap;

    }


    .bt-chat-status{

        display:none;

        padding:
        10px 14px;

        background:
        rgba(25,200,117,.08);

        border-bottom:
        1px solid rgba(25,200,117,.13);

        color:#5be39f;

        text-align:center;

        font-size:10px;

        font-weight:800;

    }


    .bt-chat-status.show{

        display:block;

    }


    .bt-chat-messages{

        flex:1;

        overflow-y:auto;

        padding:
        18px 14px 110px;

        display:flex;

        flex-direction:column;

        gap:9px;

    }


    .bt-msg{

        max-width:78%;

        padding:
        10px 12px;

        border-radius:15px;

        font-size:12px;

        line-height:1.45;

        word-break:break-word;

    }


    .bt-msg.me{

        align-self:flex-end;

        background:#147ee8;

        color:white;

        border-bottom-right-radius:4px;

    }


    .bt-msg.other{

        align-self:flex-start;

        background:#132f4c;

        color:white;

        border-bottom-left-radius:4px;

    }


    .bt-msg-time{

        display:block;

        margin-top:4px;

        opacity:.65;

        font-size:8px;

        text-align:right;

    }


    .bt-chat-empty{

        margin:auto;

        color:#7690aa;

        text-align:center;

        font-size:12px;

        max-width:300px;

        line-height:1.5;

    }


    .bt-chat-footer{

        position:absolute;

        left:0;
        right:0;
        bottom:0;

        padding:
        10px 12px
        calc(
            10px +
            env(safe-area-inset-bottom)
        );

        display:flex;

        gap:8px;

        background:#081e34;

        border-top:
        1px solid rgba(255,255,255,.08);

    }


    .bt-chat-input{

        flex:1;

        height:46px;

        border:none;
        outline:none;

        border-radius:14px;

        background:#142f4a;

        color:white;

        padding:0 14px;

        font-size:13px;

    }


    .bt-chat-send{

        width:48px;
        height:46px;

        border:none;

        border-radius:14px;

        background:
        linear-gradient(
            135deg,
            #ff7900,
            #ff962e
        );

        color:white;

        font-size:19px;

        cursor:pointer;

    }


    #boratecConversations{

        position:fixed;

        inset:0;

        z-index:2900;

        background:#06182b;

        display:none;

        overflow-y:auto;

    }


    #boratecConversations.show{

        display:block;

    }


    .bt-conv-header{

        height:68px;

        padding:0 16px;

        display:flex;

        align-items:center;

        gap:12px;

        background:#081e34;

        border-bottom:
        1px solid rgba(255,255,255,.08);

        position:sticky;

        top:0;

    }


    .bt-conv-list{

        padding:14px;

    }


    .bt-conv-card{

        width:100%;

        border:none;

        text-align:left;

        padding:14px;

        margin-bottom:9px;

        border-radius:15px;

        background:#102d4a;

        color:white;

        cursor:pointer;

    }


    .bt-conv-card strong{

        display:block;

        font-size:12px;

    }


    .bt-conv-card small{

        display:block;

        color:#ff922f;

        margin-top:5px;

    }


    .bt-conv-empty{

        padding:70px 20px;

        text-align:center;

        color:#7890a7;

    }


    .bt-confirm-overlay{

        position:fixed;

        inset:0;

        z-index:5000;

        background:
        rgba(0,8,17,.85);

        display:flex;

        align-items:center;

        justify-content:center;

        padding:20px;

    }


    .bt-confirm-box{

        width:100%;

        max-width:390px;

        padding:22px;

        border-radius:20px;

        background:#102d4a;

        border:
        1px solid rgba(255,255,255,.08);

        color:white;

        text-align:center;

    }


    .bt-confirm-icon{

        font-size:38px;

        margin-bottom:12px;

    }


    .bt-confirm-box h3{

        font-size:18px;

        margin-bottom:8px;

    }


    .bt-confirm-box p{

        color:#99aec2;

        font-size:11px;

        line-height:1.5;

        margin-bottom:18px;

    }


    .bt-confirm-actions{

        display:grid;

        grid-template-columns:
        1fr 1fr;

        gap:8px;

    }


    .bt-confirm-cancel,
    .bt-confirm-ok{

        height:43px;

        border:none;

        border-radius:11px;

        color:white;

        font-weight:900;

        cursor:pointer;

    }


    .bt-confirm-cancel{

        background:
        rgba(255,255,255,.08);

    }


    .bt-confirm-ok{

        background:
        linear-gradient(
            135deg,
            #ff7900,
            #ff962e
        );

    }


    @media(min-width:800px){

        #boratecChatOverlay,
        #boratecConversations{

            width:760px;

            left:50%;

            right:auto;

            transform:
            translateX(-50%);

        }

    }

    `;


    document.head
    .appendChild(style);


    const holder =
        document.createElement(
            "div"
        );


    holder.innerHTML = `

    <div id="boratecConversations">

        <div class="bt-conv-header">

            <button
                class="bt-chat-back"
                onclick="closeConversations()"
            >
                ←
            </button>

            <div class="bt-chat-title">

                <small>
                    BORATEC
                </small>

                <strong>
                    Mensagens
                </strong>

            </div>

        </div>


        <div
            id="boratecConversationList"
            class="bt-conv-list"
        >
        </div>

    </div>



    <div id="boratecChatOverlay">

        <div class="bt-chat-header">

            <button
                class="bt-chat-back"
                onclick="closeChat()"
            >
                ←
            </button>


            <div class="bt-chat-title">

                <small>
                    CONVERSA PRIVADA
                </small>

                <strong
                    id="boratecChatTitle"
                >
                    Serviço
                </strong>

            </div>


            <div
                id="boratecChatAction"
            >
            </div>

        </div>


        <div
            id="boratecChatStatus"
            class="bt-chat-status"
        >
        </div>


        <div
            id="boratecChatMessages"
            class="bt-chat-messages"
        >
        </div>


        <form
            class="bt-chat-footer"
            onsubmit="sendChatMessage(event)"
        >

            <input
                id="boratecChatInput"
                class="bt-chat-input"
                placeholder="Digite uma mensagem..."
                autocomplete="off"
            >


            <button
                class="bt-chat-send"
                type="submit"
            >
                ➤
            </button>

        </form>

    </div>

    `;


    while(holder.firstChild){

        document.body
        .appendChild(
            holder.firstChild
        );

    }

}


/* =========================================================
   ABRIR CHAT
========================================================= */

async function openChat(
    conversationId,
    title
){

    currentConversationId =
        conversationId;


    currentConversationTitle =
        title
        ||
        "Conversa";


    currentConversationData =
        null;


    document
    .getElementById(
        "boratecConversations"
    )
    ?.classList
    .remove(
        "show"
    );


    const overlay =
        document.getElementById(
            "boratecChatOverlay"
        );


    overlay
    .classList
    .add(
        "show"
    );


    document
    .getElementById(
        "boratecChatTitle"
    )
    .textContent =
        currentConversationTitle;


    document.body.style.overflow =
        "hidden";


    await loadConversationContext();

    await loadChatMessages();

    listenConversationMessages();

}


/* =========================================================
   CONTEXTO DA CONVERSA
========================================================= */

async function loadConversationContext(){

    if(!currentConversationId){

        return;

    }


    try{

        const {
            data:conversation,
            error
        } =
        await boraSupabase
        .from("conversations")
        .select(`
            id,
            opportunity_id,
            interest_id,
            created_at
        `)
        .eq(
            "id",
            currentConversationId
        )
        .single();


        if(error){

            throw error;

        }


        const {
            data:opportunity,
            error:opportunityError
        } =
        await boraSupabase
        .from("opportunities")
        .select(`
            id,
            author_id,
            title,
            value,
            status
        `)
        .eq(
            "id",
            conversation.opportunity_id
        )
        .single();


        if(opportunityError){

            throw opportunityError;

        }


        const {
            data:interestData,
            error:interestError
        } =
        await boraSupabase
        .from("interests")
        .select(`
            id,
            professional_id,
            status
        `)
        .eq(
            "id",
            conversation.interest_id
        )
        .single();


        if(interestError){

            throw interestError;

        }


        currentConversationData = {

            conversationId:
                conversation.id,

            opportunityId:
                conversation.opportunity_id,

            interestId:
                conversation.interest_id,

            opportunityAuthorId:
                opportunity.author_id,

            opportunityTitle:
                opportunity.title,

            opportunityStatus:
                opportunity.status,

            opportunityValue:
                opportunity.value,

            professionalId:
                interestData.professional_id,

            interestStatus:
                interestData.status

        };


        await updateChatAction();


    }catch(error){

        console.error(
            "Erro contexto conversa:",
            error
        );

    }

}


/* =========================================================
   BOTÃO FECHAR COM PROFISSIONAL
========================================================= */

async function updateChatAction(){

    const action =
        document.getElementById(
            "boratecChatAction"
        );


    const status =
        document.getElementById(
            "boratecChatStatus"
        );


    if(
        !action
        ||
        !status
        ||
        !currentConversationData
    ){

        return;

    }


    action.innerHTML =
        "";


    status.classList.remove(
        "show"
    );


    status.textContent =
        "";


    const isPublisher =
        currentConversationData
        .opportunityAuthorId
        ===
        boraUser.id;


    const accepted =
        currentConversationData
        .interestStatus
        ===
        "accepted";


    const assigned =
        currentConversationData
        .opportunityStatus
        ===
        "assigned";


    /*
       SERVIÇO JÁ FECHADO
    */

    if(
        accepted
        &&
        assigned
    ){

        action.innerHTML = `

            <div class="bt-job-closed">
                ✓ FECHADO
            </div>

        `;


        status.textContent =
            isPublisher
            ?
            "🤝 Você fechou este serviço com este profissional."
            :
            "🤝 Você foi escolhido para realizar este serviço.";


        status.classList.add(
            "show"
        );


        return;

    }


    /*
       INTERESSE REJEITADO
    */

    if(
        currentConversationData
        .interestStatus
        ===
        "rejected"
    ){

        status.textContent =
            "Esta oportunidade foi fechada com outro profissional.";


        status.classList.add(
            "show"
        );


        return;

    }


    /*
       SOMENTE QUEM PUBLICOU
       VÊ O BOTÃO
    */

    if(
        isPublisher
        &&
        (
            currentConversationData
            .opportunityStatus
            ===
            "open"
            ||
            currentConversationData
            .opportunityStatus
            ===
            "negotiating"
        )
    ){

        action.innerHTML = `

            <button
                class="bt-close-job"
                onclick="confirmAssignProfessional()"
            >
                🤝 Fechar
            </button>

        `;

    }

}


/* =========================================================
   CONFIRMAR ESCOLHA
========================================================= */

function confirmAssignProfessional(){

    if(
        !currentConversationData
    ){

        return;

    }


    const existing =
        document.getElementById(
            "btAssignConfirm"
        );


    if(existing){

        existing.remove();

    }


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "btAssignConfirm";


    overlay.className =
        "bt-confirm-overlay";


    overlay.innerHTML = `

        <div class="bt-confirm-box">

            <div class="bt-confirm-icon">
                🤝
            </div>


            <h3>
                Fechar com este profissional?
            </h3>


            <p>

                Ao confirmar, este profissional
                será escolhido para realizar o serviço.

                <br><br>

                A oportunidade deixará de aparecer
                no feed público e ficará registrada
                como serviço em andamento.

            </p>


            <div class="bt-confirm-actions">

                <button
                    class="bt-confirm-cancel"
                    onclick="closeAssignConfirmation()"
                >
                    Cancelar
                </button>


                <button
                    id="btConfirmAssignButton"
                    class="bt-confirm-ok"
                    onclick="assignProfessional()"
                >
                    Confirmar
                </button>

            </div>

        </div>

    `;


    document.body
    .appendChild(
        overlay
    );

}


/* =========================================================
   FECHAR CONFIRMAÇÃO
========================================================= */

function closeAssignConfirmation(){

    document
    .getElementById(
        "btAssignConfirm"
    )
    ?.remove();

}


/* =========================================================
   FECHAR COM PROFISSIONAL
========================================================= */

async function assignProfessional(){

    if(
        !currentConversationId
    ){

        return;

    }


    const button =
        document.getElementById(
            "btConfirmAssignButton"
        );


    if(button){

        button.disabled =
            true;


        button.textContent =
            "Fechando...";

    }


    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .rpc(
            "assign_professional",
            {
                p_conversation_id:
                    currentConversationId
            }
        );


        if(error){

            throw error;

        }


        if(
            !data
            ||
            data.length === 0
        ){

            throw new Error(
                "Serviço não criado"
            );

        }


        console.log(
            "🤝 Serviço fechado:",
            data[0]
        );


        closeAssignConfirmation();


        /*
           Atualiza dados da conversa
        */

        await loadConversationContext();


        /*
           Atualiza feed.

           Como agora status = assigned,
           a oportunidade some do feed.
        */

        await loadOpportunities();


        showToast(
            "🤝 Profissional escolhido!"
        );


        /*
           Mensagem automática dentro
           do chat para registrar o fechamento.
        */

        await sendSystemLikeMessage(
            "🤝 Serviço fechado. Profissional selecionado para esta oportunidade."
        );


    }catch(error){

        console.error(
            "Erro ao fechar serviço:",
            error
        );


        showToast(
            "Não foi possível fechar o serviço"
        );


        if(button){

            button.disabled =
                false;


            button.textContent =
                "Confirmar";

        }

    }

}


/* =========================================================
   MENSAGEM AUTOMÁTICA
========================================================= */

async function sendSystemLikeMessage(
    content
){

    if(
        !currentConversationId
        ||
        !boraUser
    ){

        return;

    }


    try{

        const {
            error
        } =
        await boraSupabase
        .from("messages")
        .insert({

            conversation_id:
                currentConversationId,

            sender_id:
                boraUser.id,

            content:
                content

        });


        if(error){

            console.error(
                "Erro mensagem automática:",
                error
            );

        }


    }catch(error){

        console.error(error);

    }

}


/* =========================================================
   FECHAR CHAT
========================================================= */

function closeChat(){

    document
    .getElementById(
        "boratecChatOverlay"
    )
    ?.classList
    .remove(
        "show"
    );


    document.body.style.overflow =
        "";


    stopMessagesChannel();

}


/* =========================================================
   CARREGAR MENSAGENS
========================================================= */

async function loadChatMessages(){

    if(!currentConversationId){

        return;

    }


    const container =
        document.getElementById(
            "boratecChatMessages"
        );


    container.innerHTML = `

        <div class="bt-chat-empty">
            Carregando conversa...
        </div>

    `;


    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from("messages")
        .select(`
            id,
            conversation_id,
            sender_id,
            content,
            created_at
        `)
        .eq(
            "conversation_id",
            currentConversationId
        )
        .order(
            "created_at",
            {
                ascending:true
            }
        );


        if(error){

            throw error;

        }


        renderMessages(
            data
            ||
            []
        );


    }catch(error){

        console.error(
            "Erro mensagens:",
            error
        );


        container.innerHTML = `

            <div class="bt-chat-empty">

                Não foi possível carregar
                as mensagens.

            </div>

        `;

    }

}


/* =========================================================
   RENDER MENSAGENS
========================================================= */

function renderMessages(messages){

    const container =
        document.getElementById(
            "boratecChatMessages"
        );


    if(
        !messages
        ||
        messages.length === 0
    ){

        container.innerHTML = `

            <div class="bt-chat-empty">

                🤝<br><br>

                Conversa criada.<br>

                Combine horário, valor,
                detalhes técnicos e dados
                do cliente por aqui.

            </div>

        `;


        return;

    }


    container.innerHTML =
        messages
        .map(
            message =>
            messageHTML(
                message
            )
        )
        .join("");


    scrollChatBottom();

}


/* =========================================================
   MENSAGEM HTML
========================================================= */

function messageHTML(message){

    const mine =
        message.sender_id
        ===
        boraUser.id;


    const date =
        new Date(
            message.created_at
        );


    const time =
        date
        .toLocaleTimeString(
            "pt-BR",
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        );


    return `

        <div
            class="
                bt-msg
                ${
                    mine
                    ?
                    "me"
                    :
                    "other"
                }
            "
        >

            ${escapeHtml(
                message.content
            )}

            <span class="bt-msg-time">
                ${time}
            </span>

        </div>

    `;

}


/* =========================================================
   ENVIAR MENSAGEM
========================================================= */

async function sendChatMessage(event){

    event.preventDefault();


    if(!currentConversationId){

        return;

    }


    const input =
        document.getElementById(
            "boratecChatInput"
        );


    const content =
        input
        .value
        .trim();


    if(!content){

        return;

    }


    input.value =
        "";


    try{

        const {
            error
        } =
        await boraSupabase
        .from("messages")
        .insert({

            conversation_id:
                currentConversationId,

            sender_id:
                boraUser.id,

            content:
                content

        });


        if(error){

            throw error;

        }


    }catch(error){

        console.error(
            "Erro enviar:",
            error
        );


        input.value =
            content;


        showToast(
            "Mensagem não enviada"
        );

    }

}


/* =========================================================
   REALTIME CHAT
========================================================= */

function listenConversationMessages(){

    stopMessagesChannel();


    if(!currentConversationId){

        return;

    }


    messagesChannel =
        boraSupabase
        .channel(
            `chat-${currentConversationId}`
        )
        .on(
            "postgres_changes",
            {

                event:"INSERT",

                schema:"public",

                table:"messages",

                filter:
                    `conversation_id=eq.${currentConversationId}`

            },

            payload => {

                appendMessage(
                    payload.new
                );

            }
        )
        .subscribe();

}


/* =========================================================
   PARAR REALTIME
========================================================= */

function stopMessagesChannel(){

    if(
        messagesChannel
        &&
        boraSupabase
    ){

        boraSupabase
        .removeChannel(
            messagesChannel
        );

    }


    messagesChannel =
        null;

}


/* =========================================================
   APPEND MENSAGEM
========================================================= */

function appendMessage(message){

    const container =
        document.getElementById(
            "boratecChatMessages"
        );


    if(!container){

        return;

    }


    const empty =
        container
        .querySelector(
            ".bt-chat-empty"
        );


    if(empty){

        container.innerHTML =
            "";

    }


    container
    .insertAdjacentHTML(
        "beforeend",
        messageHTML(
            message
        )
    );


    scrollChatBottom();

}


/* =========================================================
   SCROLL CHAT
========================================================= */

function scrollChatBottom(){

    const container =
        document.getElementById(
            "boratecChatMessages"
        );


    if(!container){

        return;

    }


    requestAnimationFrame(
        () => {

            container.scrollTop =
                container.scrollHeight;

        }
    );

}


/* =========================================================
   NOVOS INTERESSES
========================================================= */

function listenForNewInterests(){

    if(interestsChannel){

        boraSupabase
        .removeChannel(
            interestsChannel
        );

    }


    interestsChannel =
        boraSupabase
        .channel(
            `boratec-interests-${boraUser.id}`
        )
        .on(
            "postgres_changes",
            {

                event:"INSERT",

                schema:"public",

                table:"interests"

            },

            payload => {

                const interestData =
                    payload.new;


                const ownOpportunity =
                    posts.find(
                        post =>
                        post.authorId
                        ===
                        boraUser.id
                        &&
                        String(post.id)
                        ===
                        String(
                            interestData.opportunity_id
                        )
                    );


                if(!ownOpportunity){

                    return;

                }


                showToast(
                    "🔥 Novo profissional interessado!"
                );

            }
        )
        .subscribe();

}


/* =========================================================
   LISTA DE CONVERSAS
========================================================= */

async function openConversations(){

    const overlay =
        document.getElementById(
            "boratecConversations"
        );


    overlay
    .classList
    .add(
        "show"
    );


    document.body.style.overflow =
        "hidden";


    await loadConversations();

}


/* =========================================================
   FECHAR CONVERSAS
========================================================= */

function closeConversations(){

    document
    .getElementById(
        "boratecConversations"
    )
    ?.classList
    .remove(
        "show"
    );


    document.body.style.overflow =
        "";

}


/* =========================================================
   CARREGAR CONVERSAS
========================================================= */

async function loadConversations(){

    const list =
        document.getElementById(
            "boratecConversationList"
        );


    list.innerHTML = `

        <div class="bt-conv-empty">
            Carregando mensagens...
        </div>

    `;


    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from("conversations")
        .select(`
            id,
            opportunity_id,
            interest_id,
            created_at
        `)
        .order(
            "created_at",
            {
                ascending:false
            }
        );


        if(error){

            throw error;

        }


        if(
            !data
            ||
            data.length === 0
        ){

            list.innerHTML = `

                <div class="bt-conv-empty">

                    💬<br><br>

                    Você ainda não possui
                    conversas no BoraTec.

                </div>

            `;


            return;

        }


        const conversations =
            [];


        for(
            const conversation
            of data
        ){

            const details =
                await getConversationDetails(
                    conversation
                );


            conversations.push(
                details
            );

        }


        list.innerHTML =
            conversations
            .map(
                conversation => `

                <button
                    class="bt-conv-card"

                    onclick="
                        openChat(
                            '${conversation.id}',
                            '${escapeJs(
                                conversation.title
                            )}'
                        )
                    "
                >

                    <strong>

                        ${escapeHtml(
                            conversation.title
                        )}

                    </strong>

                    <small>

                        ${escapeHtml(
                            conversation.otherProfessional
                        )}

                    </small>

                </button>

                `
            )
            .join("");


    }catch(error){

        console.error(
            "Erro conversas:",
            error
        );


        list.innerHTML = `

            <div class="bt-conv-empty">

                Não foi possível carregar
                suas conversas.

            </div>

        `;

    }

}


/* =========================================================
   DETALHES CONVERSA
========================================================= */

async function getConversationDetails(
    conversation
){

    let title =
        "Conversa BoraTec";


    let otherProfessional =
        "Profissional BoraTec";


    const {
        data:opportunity
    } =
    await boraSupabase
    .from("opportunities")
    .select(`
        id,
        title,
        author_id
    `)
    .eq(
        "id",
        conversation.opportunity_id
    )
    .maybeSingle();


    if(opportunity?.title){

        title =
            opportunity.title;

    }


    let otherUserId =
        null;


    if(
        opportunity?.author_id
        ===
        boraUser.id
    ){

        const {
            data:interestData
        } =
        await boraSupabase
        .from("interests")
        .select(
            "professional_id"
        )
        .eq(
            "id",
            conversation.interest_id
        )
        .maybeSingle();


        otherUserId =
            interestData
            ?.professional_id
            ||
            null;

    }
    else{

        otherUserId =
            opportunity
            ?.author_id
            ||
            null;

    }


    if(otherUserId){

        const {
            data:profile
        } =
        await boraSupabase
        .from("profiles")
        .select(`
            name,
            professional_name
        `)
        .eq(
            "id",
            otherUserId
        )
        .maybeSingle();


        if(profile){

            otherProfessional =
                profile.professional_name
                ||
                profile.name
                ||
                otherProfessional;

        }

    }


    return {

        id:
            conversation.id,

        title:
            title,

        otherProfessional:
            otherProfessional

    };

}


/* =========================================================
   CHAT DEMO ANTIGO
========================================================= */

openChatDemo =
function(){

    document
    .getElementById(
        "interestOverlay"
    )
    ?.classList
    .remove(
        "show"
    );


    if(currentConversationId){

        openChat(
            currentConversationId,
            currentConversationTitle
        );

    }

};


/* =========================================================
   MENU
========================================================= */

selectNav =
function(
    button,
    page
){

    if(page === "Mensagens"){

        openConversations();

        return;

    }


    if(page === "Perfil"){

        showToast(
            "Perfil será a próxima etapa"
        );

        return;

    }


    if(page === "Início"){

        document
        .querySelectorAll(
            ".nav-button"
        )
        .forEach(
            item =>
            item.classList.remove(
                "active"
            )
        );


        button
        .classList
        .add(
            "active"
        );

    }

};


/* =========================================================
   LOGOUT
========================================================= */

async function logoutBoraTec(){

    try{

        await boraSupabase
        .auth
        .signOut();


        window.location.replace(
            "login.html"
        );


    }catch(error){

        console.error(error);

    }

}


/* =========================================================
   REDIRECT
========================================================= */

function redirectToLogin(){

    window.location.replace(
        "login.html"
    );

}


/* =========================================================
   AUTH LISTENER
========================================================= */

function listenAuthChanges(){

    boraSupabase
    .auth
    .onAuthStateChange(
        (
            event,
            session
        ) => {

            if(
                event ===
                "SIGNED_OUT"
            ){

                window.location.replace(
                    "login.html"
                );

            }


            if(session?.user){

                boraUser =
                    session.user;

            }

        }
    );

}


/* =========================================================
   GLOBAL
========================================================= */

window.logoutBoraTec =
    logoutBoraTec;

window.openChat =
    openChat;

window.closeChat =
    closeChat;

window.sendChatMessage =
    sendChatMessage;

window.openConversations =
    openConversations;

window.closeConversations =
    closeConversations;

window.confirmAssignProfessional =
    confirmAssignProfessional;

window.closeAssignConfirmation =
    closeAssignConfirmation;

window.assignProfessional =
    assignProfessional;

window.loadOpportunities =
    loadOpportunities;

window.getBoraTecUser =
    () => boraUser;

window.getBoraTecProfile =
    () => boraProfile;

window.getBoraTecSupabase =
    () => boraSupabase;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function(){

        await startBoraTec();

    }
);
/* =========================================================
   BORATEC V0.5
   MEUS SERVIÇOS
========================================================= */

let jobsChannel = null;


/* =========================================================
   CRIAR INTERFACE MEUS SERVIÇOS
========================================================= */

function createMyJobsInterface(){

    if(document.getElementById("boratecMyJobs")){
        return;
    }

    const style = document.createElement("style");

    style.textContent = `

    #boratecMyJobs{
        position:fixed;
        inset:0;
        z-index:2850;
        background:#06182b;
        display:none;
        overflow-y:auto;
        color:white;
    }

    #boratecMyJobs.show{
        display:block;
    }

    .bt-jobs-header{
        min-height:68px;
        padding:0 16px;
        display:flex;
        align-items:center;
        gap:12px;
        background:#081e34;
        border-bottom:1px solid rgba(255,255,255,.08);
        position:sticky;
        top:0;
        z-index:2;
    }

    .bt-jobs-header-title{
        flex:1;
    }

    .bt-jobs-header-title small{
        display:block;
        color:#ff8a1d;
        font-size:9px;
        font-weight:900;
        letter-spacing:.8px;
        margin-bottom:3px;
    }

    .bt-jobs-header-title strong{
        font-size:15px;
    }

    .bt-jobs-list{
        padding:14px 14px 110px;
        max-width:760px;
        margin:0 auto;
    }

    .bt-job-item{
        background:#102d4a;
        border:1px solid rgba(255,255,255,.07);
        border-radius:18px;
        padding:16px;
        margin-bottom:12px;
        box-shadow:0 10px 25px rgba(0,0,0,.12);
    }

    .bt-job-item-top{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:10px;
        margin-bottom:11px;
    }

    .bt-job-item-title{
        font-size:14px;
        font-weight:900;
        line-height:1.3;
    }

    .bt-job-role{
        margin-top:4px;
        color:#8fa8bf;
        font-size:9px;
        font-weight:800;
    }

    .bt-job-badge{
        flex-shrink:0;
        padding:7px 9px;
        border-radius:9px;
        font-size:8px;
        font-weight:900;
        letter-spacing:.3px;
        text-align:center;
    }

    .bt-job-badge.assigned{
        background:rgba(255,138,29,.13);
        color:#ff9c43;
    }

    .bt-job-badge.in_progress{
        background:rgba(20,126,232,.15);
        color:#55a8ff;
    }

    .bt-job-badge.awaiting_confirmation{
        background:rgba(255,200,40,.13);
        color:#ffd05a;
    }

    .bt-job-badge.completed{
        background:rgba(25,200,117,.13);
        color:#50df96;
    }

    .bt-job-details{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin:12px 0;
    }

    .bt-job-detail{
        background:rgba(255,255,255,.045);
        border-radius:11px;
        padding:10px;
    }

    .bt-job-detail small{
        display:block;
        color:#8199af;
        font-size:8px;
        margin-bottom:4px;
    }

    .bt-job-detail strong{
        display:block;
        font-size:11px;
        overflow:hidden;
        text-overflow:ellipsis;
    }

    .bt-job-action-button{
        width:100%;
        min-height:45px;
        border:none;
        border-radius:12px;
        margin-top:5px;
        background:linear-gradient(135deg,#ff7900,#ff982f);
        color:white;
        font-size:11px;
        font-weight:900;
        cursor:pointer;
    }

    .bt-job-action-button.blue{
        background:linear-gradient(135deg,#126dcc,#1789f4);
    }

    .bt-job-action-button.green{
        background:linear-gradient(135deg,#16a866,#22c77c);
    }

    .bt-job-waiting{
        margin-top:8px;
        padding:11px;
        border-radius:11px;
        background:rgba(255,255,255,.045);
        color:#9eb2c5;
        font-size:10px;
        line-height:1.45;
        text-align:center;
    }

    .bt-jobs-empty{
        padding:80px 20px;
        color:#7f98af;
        text-align:center;
        line-height:1.6;
        font-size:12px;
    }

    .bt-my-jobs-shortcut{
        position:fixed;
        right:14px;
        bottom:82px;
        z-index:1800;
        border:none;
        border-radius:999px;
        padding:11px 14px;
        background:#102d4a;
        border:1px solid rgba(255,255,255,.10);
        color:white;
        box-shadow:0 8px 25px rgba(0,0,0,.25);
        font-size:10px;
        font-weight:900;
        cursor:pointer;
    }

    @media(min-width:800px){
        #boratecMyJobs{
            width:760px;
            left:50%;
            right:auto;
            transform:translateX(-50%);
        }

        .bt-my-jobs-shortcut{
            right:calc(50% - 365px);
        }
    }

    `;

    document.head.appendChild(style);

    const overlay = document.createElement("div");
    overlay.id = "boratecMyJobs";

    overlay.innerHTML = `
        <div class="bt-jobs-header">
            <button
                class="bt-chat-back"
                onclick="closeMyJobs()"
            >
                ←
            </button>

            <div class="bt-jobs-header-title">
                <small>BORATEC</small>
                <strong>Meus Serviços</strong>
            </div>

            <button
                class="bt-chat-back"
                onclick="loadMyJobs()"
                title="Atualizar"
                style="font-size:16px;"
            >
                ↻
            </button>
        </div>

        <div
            style="
                padding:10px 14px 0;
            "
        >
            <button
                type="button"
                class="bt-secondary"
                onclick="clearMyJobsHistory()"
                style="
                    width:100%;
                    border-color:#7a3434;
                    color:#ff8d88;
                "
            >
                🗑 Limpar histórico concluído/cancelado
            </button>
        </div>

        <div
            id="boratecMyJobsList"
            class="bt-jobs-list"
        ></div>
    `;

    document.body.appendChild(overlay);

    const shortcut = document.createElement("button");
    shortcut.id = "boratecMyJobsShortcut";
    shortcut.className = "bt-my-jobs-shortcut";
    shortcut.innerHTML = "🧰 Meus Serviços";
    shortcut.onclick = openMyJobs;

    document.body.appendChild(shortcut);
}


/* =========================================================
   ABRIR / FECHAR MEUS SERVIÇOS
========================================================= */

async function openMyJobs(){

    const overlay = document.getElementById("boratecMyJobs");

    if(!overlay){
        return;
    }

    document.getElementById("boratecConversations")
        ?.classList.remove("show");

    document.getElementById("boratecChatOverlay")
        ?.classList.remove("show");

    overlay.classList.add("show");

    document.body.style.overflow = "hidden";

    await loadMyJobs();

    listenMyJobsRealtime();
}


function closeMyJobs(){

    document.getElementById("boratecMyJobs")
        ?.classList.remove("show");

    document.body.style.overflow = "";

    stopMyJobsRealtime();
}


/* =========================================================
   CARREGAR MEUS SERVIÇOS
========================================================= */

async function loadMyJobs(){

    const list = document.getElementById("boratecMyJobsList");

    if(!list || !boraUser){
        return;
    }

    list.innerHTML = `
        <div class="bt-jobs-empty">
            Carregando seus serviços...
        </div>
    `;

    try{

        const { data:jobs, error } =
            await boraSupabase
            .from("jobs")
            .select(`
                id,
                opportunity_id,
                publisher_id,
                professional_id,
                agreed_value,
                status,
                created_at
            `)
            .or(
                `publisher_id.eq.${boraUser.id},professional_id.eq.${boraUser.id}`
            )
            .order("created_at", {
                ascending:false
            });

        if(error){
            throw error;
        }

        const {
            data:hiddenRows,
            error:hiddenError
        } =
        await boraSupabase
        .from("job_hidden_history")
        .select("job_id")
        .eq(
            "user_id",
            boraUser.id
        );

        if(hiddenError){
            throw hiddenError;
        }

        const hiddenIds =
            new Set(
                (hiddenRows || [])
                .map(row => row.job_id)
            );

        const visibleJobs =
            (jobs || [])
            .filter(job => !hiddenIds.has(job.id));

        if(visibleJobs.length === 0){

            list.innerHTML = `
                <div class="bt-jobs-empty">
                    🧰<br><br>
                    Você ainda não possui serviços fechados no BoraTec.
                    <br><br>
                    Quando uma oportunidade for fechada com um profissional,
                    ela aparecerá aqui.
                </div>
            `;

            return;
        }

        const cards = [];

        for(const job of visibleJobs){

            const details =
                await getMyJobDetails(job);

            cards.push(
                myJobCardHTML(details)
            );
        }

        list.innerHTML =
            cards.join("");

    }catch(error){

        console.error(
            "Erro Meus Serviços:",
            error
        );

        list.innerHTML = `
            <div class="bt-jobs-empty">
                Não foi possível carregar seus serviços.
            </div>
        `;

        showToast(
            "Erro ao carregar Meus Serviços"
        );
    }
}


/* =========================================================
   OCULTAR / LIMPAR HISTORICO DE MEUS SERVICOS
   - nao apaga jobs
   - nao altera avaliacao/reputacao
   - somente completed/cancelled
========================================================= */

async function hideMyJobForMe(jobId){

    if(
        !boraSupabase
        ||
        !boraUser
        ||
        !jobId
    ){
        return;
    }

    const confirmed =
        window.confirm(
            "Ocultar este serviço do seu histórico?"
        );

    if(!confirmed){
        return;
    }

    try{

        const {
            error
        } =
        await boraSupabase
        .rpc(
            "hide_job_for_me",
            {
                p_job_id:jobId
            }
        );

        if(error){
            throw error;
        }

        await loadMyJobs();

        showToast(
            "Serviço removido do seu histórico"
        );

    }catch(error){

        console.error(
            "Erro ao ocultar serviço:",
            error
        );

        showToast(
            "Não foi possível ocultar este serviço"
        );
    }
}


async function clearMyJobsHistory(){

    if(
        !boraSupabase
        ||
        !boraUser
    ){
        return;
    }

    const confirmed =
        window.confirm(
            "Ocultar todos os serviços concluídos e cancelados do seu histórico?"
        );

    if(!confirmed){
        return;
    }

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .rpc(
            "hide_finished_jobs_for_me"
        );

        if(error){
            throw error;
        }

        await loadMyJobs();

        showToast(
            Number(data || 0) > 0
            ? "Histórico limpo"
            : "Nenhum serviço concluído/cancelado para limpar"
        );

    }catch(error){

        console.error(
            "Erro ao limpar histórico de serviços:",
            error
        );

        showToast(
            "Não foi possível limpar o histórico"
        );
    }
}


window.hideMyJobForMe =
    hideMyJobForMe;

window.clearMyJobsHistory =
    clearMyJobsHistory;


/* =========================================================
   DETALHES DO SERVIÇO
========================================================= */

async function getMyJobDetails(job){

    let opportunity = null;

    const {
        data:opportunityData,
        error:opportunityError
    } =
    await boraSupabase
    .from("opportunities")
    .select(`
        id,
        title,
        description,
        category,
        state,
        city,
        neighborhood,
        service_date,
        value,
        status
    `)
    .eq(
        "id",
        job.opportunity_id
    )
    .maybeSingle();

    if(!opportunityError){
        opportunity = opportunityData;
    }

    const isPublisher =
        job.publisher_id === boraUser.id;

    const otherUserId =
        isPublisher
        ?
        job.professional_id
        :
        job.publisher_id;

    let otherProfile = null;

    if(otherUserId){

        const {
            data:profileData
        } =
        await boraSupabase
        .from("profiles")
        .select(`
            id,
            name,
            professional_name,
            photo_url
        `)
        .eq(
            "id",
            otherUserId
        )
        .maybeSingle();

        otherProfile =
            profileData;
    }

    return {
        ...job,
        opportunity,
        isPublisher,
        otherProfile
    };
}


/* =========================================================
   CARD MEUS SERVIÇOS
========================================================= */

function myJobCardHTML(job){

    const opportunity =
        job.opportunity || {};

    const title =
        opportunity.title
        ||
        "Serviço BoraTec";

    const otherName =
        job.otherProfile?.professional_name
        ||
        job.otherProfile?.name
        ||
        "Profissional BoraTec";

    const value =
        job.agreed_value !== null
        &&
        job.agreed_value !== undefined
        ?
        money(job.agreed_value)
        :
        "A combinar";

    let location = "";

    if(opportunity.neighborhood){
        location += opportunity.neighborhood;
    }

    if(opportunity.city){

        if(location){
            location += " • ";
        }

        location += opportunity.city;
    }

    if(opportunity.state){

        if(location){
            location += " - ";
        }

        location += opportunity.state;
    }

    if(!location){
        location = "Local não informado";
    }

    const role =
        job.isPublisher
        ?
        `Profissional escolhido: ${otherName}`
        :
        `Serviço indicado por: ${otherName}`;

    const statusText =
        getJobStatusText(
            job.status
        );

    const action =
        getJobActionHTML(
            job
        );

    return `
        <article class="bt-job-item">

            <div class="bt-job-item-top">

                <div>
                    <div class="bt-job-item-title">
                        ${escapeHtml(title)}
                    </div>

                    <div class="bt-job-role">
                        ${escapeHtml(role)}
                    </div>
                </div>

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:8px;
                    "
                >
                    ${
                        (
                            job.status === "completed"
                            ||
                            job.status === "cancelled"
                        )
                        ?
                        `
                        <button
                            type="button"
                            title="Ocultar este serviço"
                            aria-label="Ocultar este serviço"
                            onclick="hideMyJobForMe('${escapeHtml(job.id)}')"
                            style="
                                width:34px;
                                height:34px;
                                border-radius:8px;
                                border:1px solid #6b3434;
                                background:#241516;
                                color:#ff8d88;
                                cursor:pointer;
                                font-size:14px;
                            "
                        >
                            🗑
                        </button>
                        `
                        :
                        ""
                    }

                    <div
                        class="bt-job-badge ${escapeHtml(job.status)}"
                    >
                        ${escapeHtml(statusText)}
                    </div>
                </div>

            </div>

            <div class="bt-job-details">

                <div class="bt-job-detail">
                    <small>VALOR</small>
                    <strong>${escapeHtml(value)}</strong>
                </div>

                <div class="bt-job-detail">
                    <small>LOCAL</small>
                    <strong>${escapeHtml(location)}</strong>
                </div>

                <div class="bt-job-detail">
                    <small>CATEGORIA</small>
                    <strong>
                        ${escapeHtml(
                            opportunity.category
                            ||
                            "Serviço técnico"
                        )}
                    </strong>
                </div>

                <div class="bt-job-detail">
                    <small>DATA</small>
                    <strong>
                        ${escapeHtml(
                            formatServiceDate(
                                opportunity.service_date
                            )
                        )}
                    </strong>
                </div>

            </div>

            ${action}

        </article>
    `;
}


/* =========================================================
   TEXTO DO STATUS
========================================================= */

function getJobStatusText(status){

    switch(status){

        case "assigned":
            return "AGUARDANDO INÍCIO";

        case "in_progress":
            return "EM ANDAMENTO";

        case "awaiting_confirmation":
            return "AGUARDANDO CONFIRMAÇÃO";

        case "completed":
            return "CONCLUÍDO ✓";

        case "cancelled":
            return "CANCELADO";

        case "disputed":
            return "EM ANÁLISE";

        default:
            return String(status || "")
                .toUpperCase();
    }
}


/* =========================================================
   AÇÃO POR STATUS / PAPEL
========================================================= */

function getJobActionHTML(job){

    const isProfessional =
        job.professional_id === boraUser.id;

    const isPublisher =
        job.publisher_id === boraUser.id;


    if(job.status === "assigned"){

        if(isProfessional){

            return `
                <button
                    class="bt-job-action-button blue"
                    onclick="startBoraTecJob('${job.id}', this)"
                >
                    ▶ Iniciar serviço
                </button>
            `;
        }

        return `
            <div class="bt-job-waiting">
                ⏳ Aguardando o profissional iniciar o serviço.
            </div>
        `;
    }


    if(job.status === "in_progress"){

        if(isProfessional){

            return `
                <button
                    class="bt-job-action-button"
                    onclick="finishBoraTecJob('${job.id}', this)"
                >
                    ✓ Serviço realizado
                </button>
            `;
        }

        return `
            <div class="bt-job-waiting">
                🔧 O profissional informou que o serviço está em andamento.
            </div>
        `;
    }


    if(job.status === "awaiting_confirmation"){

        if(isPublisher){

            return `
                <button
                    class="bt-job-action-button green"
                    onclick="confirmBoraTecJob('${job.id}', this)"
                >
                    ✓ Confirmar conclusão
                </button>
            `;
        }

        return `
            <div class="bt-job-waiting">
                ⏳ Serviço marcado como realizado.<br>
                Aguardando confirmação de quem publicou.
            </div>
        `;
    }


    if(job.status === "completed"){

        return `
            <div class="bt-job-waiting">
                ✅ Serviço concluído no BoraTec.<br>
                A avaliação será liberada na próxima etapa.
            </div>
        `;
    }


    return `
        <div class="bt-job-waiting">
            ${escapeHtml(
                getJobStatusText(
                    job.status
                )
            )}
        </div>
    `;
}


/* =========================================================
   INICIAR SERVIÇO
========================================================= */

async function startBoraTecJob(
    jobId,
    button
){

    if(!jobId){
        return;
    }

    const oldText =
        button?.textContent
        ||
        "▶ Iniciar serviço";

    if(button){
        button.disabled = true;
        button.textContent = "Iniciando...";
    }

    try{

        const { error } =
            await boraSupabase
            .rpc(
                "start_job",
                {
                    p_job_id:jobId
                }
            );

        if(error){
            throw error;
        }

        showToast(
            "🔧 Serviço iniciado!"
        );

        await loadMyJobs();

    }catch(error){

        console.error(
            "Erro iniciar serviço:",
            error
        );

        showToast(
            "Não foi possível iniciar o serviço"
        );

        if(button){
            button.disabled = false;
            button.textContent = oldText;
        }
    }
}


/* =========================================================
   SERVIÇO REALIZADO
========================================================= */

async function finishBoraTecJob(
    jobId,
    button
){

    if(!jobId){
        return;
    }

    const confirmed =
        window.confirm(
            "Confirmar que o serviço foi realizado?\n\n" +
            "Depois disso, quem publicou precisará confirmar a conclusão."
        );

    if(!confirmed){
        return;
    }

    const oldText =
        button?.textContent
        ||
        "✓ Serviço realizado";

    if(button){
        button.disabled = true;
        button.textContent = "Enviando...";
    }

    try{

        const { error } =
            await boraSupabase
            .rpc(
                "finish_job_execution",
                {
                    p_job_id:jobId
                }
            );

        if(error){
            throw error;
        }

        showToast(
            "✓ Aguardando confirmação"
        );

        await loadMyJobs();

    }catch(error){

        console.error(
            "Erro finalizar execução:",
            error
        );

        showToast(
            "Não foi possível atualizar o serviço"
        );

        if(button){
            button.disabled = false;
            button.textContent = oldText;
        }
    }
}


/* =========================================================
   CONFIRMAR CONCLUSÃO
========================================================= */

async function confirmBoraTecJob(
    jobId,
    button
){

    if(!jobId){
        return;
    }

    const confirmed =
        window.confirm(
            "Confirmar que o serviço foi concluído?\n\n" +
            "Essa confirmação encerrará o serviço no BoraTec."
        );

    if(!confirmed){
        return;
    }

    const oldText =
        button?.textContent
        ||
        "✓ Confirmar conclusão";

    if(button){
        button.disabled = true;
        button.textContent = "Confirmando...";
    }

    try{

        const { error } =
            await boraSupabase
            .rpc(
                "confirm_job_completion",
                {
                    p_job_id:jobId
                }
            );

        if(error){
            throw error;
        }

        showToast(
            "✅ Serviço concluído!"
        );

        await loadMyJobs();

        await loadOpportunities();

    }catch(error){

        console.error(
            "Erro confirmar conclusão:",
            error
        );

        showToast(
            "Não foi possível concluir o serviço"
        );

        if(button){
            button.disabled = false;
            button.textContent = oldText;
        }
    }
}


/* =========================================================
   REALTIME DOS SERVIÇOS
========================================================= */

function listenMyJobsRealtime(){

    stopMyJobsRealtime();

    jobsChannel =
        boraSupabase
        .channel(
            `boratec-jobs-${boraUser.id}`
        )
        .on(
            "postgres_changes",
            {
                event:"*",
                schema:"public",
                table:"jobs"
            },
            async payload => {

                const job =
                    payload.new
                    ||
                    payload.old;

                if(!job){
                    return;
                }

                const belongsToMe =
                    job.publisher_id === boraUser.id
                    ||
                    job.professional_id === boraUser.id;

                if(!belongsToMe){
                    return;
                }

                const overlay =
                    document.getElementById(
                        "boratecMyJobs"
                    );

                if(
                    overlay
                    ?.classList
                    .contains("show")
                ){
                    await loadMyJobs();
                }
            }
        )
        .subscribe();
}


function stopMyJobsRealtime(){

    if(
        jobsChannel
        &&
        boraSupabase
    ){

        boraSupabase
        .removeChannel(
            jobsChannel
        );
    }

    jobsChannel = null;
}


/* =========================================================
   INTEGRAR COM MENU EXISTENTE
========================================================= */

const boraTecSelectNavV04 =
    window.selectNav
    ||
    selectNav;

selectNav =
function(
    button,
    page
){

    const normalized =
        String(page || "")
        .trim()
        .toLowerCase();

    if(
        normalized === "serviços"
        ||
        normalized === "servicos"
        ||
        normalized === "meus serviços"
        ||
        normalized === "meus servicos"
    ){
        openMyJobs();
        return;
    }

    return boraTecSelectNavV04(
        button,
        page
    );
};


/* =========================================================
   GLOBAL V0.6
========================================================= */

window.selectNav =
    selectNav;

window.openMyJobs =
    openMyJobs;

window.closeMyJobs =
    closeMyJobs;

window.loadMyJobs =
    loadMyJobs;

window.startBoraTecJob =
    startBoraTecJob;

window.finishBoraTecJob =
    finishBoraTecJob;

window.confirmBoraTecJob =
    confirmBoraTecJob;


/* =========================================================
   INICIAR INTERFACE V0.6
   O startBoraTec original roda no DOMContentLoaded.
   Esta interface é criada logo depois.
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        createMyJobsInterface();

    }
);
/* =========================================================
   BORATEC V0.6
   AVALIAÇÃO E REPUTAÇÃO
========================================================= */

let currentRatingJob = null;


/* =========================================================
   COMPLEMENTAR DETALHES DO JOB COM AVALIAÇÃO
========================================================= */

const boraTecGetMyJobDetailsV05 =
    getMyJobDetails;

getMyJobDetails =
async function(job){

    const details =
        await boraTecGetMyJobDetailsV05(job);

    let myRating = null;

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from("ratings")
        .select(`
            id,
            job_id,
            reviewer_id,
            reviewed_id,
            technical_score,
            agreement_score,
            customer_care_score,
            financial_score,
            would_recommend,
            comment
        `)
        .eq(
            "job_id",
            job.id
        )
        .eq(
            "reviewer_id",
            boraUser.id
        )
        .maybeSingle();

        if(!error){
            myRating = data;
        }

    }catch(error){

        console.error(
            "Erro ao verificar avaliação:",
            error
        );

    }

    return {
        ...details,
        myRating
    };
};


/* =========================================================
   AÇÃO DO JOB COM AVALIAÇÃO
========================================================= */

const boraTecGetJobActionHTMLV05 =
    getJobActionHTML;

getJobActionHTML =
function(job){

    if(job.status === "completed"){

        if(job.myRating){

            return `
                <div class="bt-job-waiting">
                    ✅ Serviço concluído no BoraTec.<br>
                    ⭐ Sua avaliação já foi enviada.
                </div>
            `;

        }

        return `
            <button
                class="bt-job-action-button"
                onclick="openRatingModal('${job.id}')"
            >
                ⭐ Avaliar
            </button>
        `;
    }

    return boraTecGetJobActionHTMLV05(
        job
    );
};


/* =========================================================
   CRIAR MODAL DE AVALIAÇÃO
========================================================= */

function createRatingInterface(){

    if(
        document.getElementById(
            "boratecRatingOverlay"
        )
    ){
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.textContent = `

    #boratecRatingOverlay{
        position:fixed;
        inset:0;
        z-index:6000;
        display:none;
        align-items:center;
        justify-content:center;
        padding:18px;
        background:rgba(0,8,17,.90);
    }

    #boratecRatingOverlay.show{
        display:flex;
    }

    .bt-rating-box{
        width:100%;
        max-width:430px;
        max-height:92vh;
        overflow-y:auto;
        border-radius:20px;
        background:#102d4a;
        border:1px solid rgba(255,255,255,.08);
        color:white;
        padding:20px;
        box-shadow:0 20px 55px rgba(0,0,0,.35);
    }

    .bt-rating-head{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:14px;
        margin-bottom:16px;
    }

    .bt-rating-head small{
        display:block;
        color:#ff8a1d;
        font-size:9px;
        font-weight:900;
        letter-spacing:.8px;
        margin-bottom:4px;
    }

    .bt-rating-head h3{
        margin:0;
        font-size:18px;
    }

    .bt-rating-close{
        width:38px;
        height:38px;
        flex-shrink:0;
        border:none;
        border-radius:11px;
        background:rgba(255,255,255,.07);
        color:white;
        font-size:18px;
        cursor:pointer;
    }

    .bt-rating-person{
        padding:12px;
        border-radius:13px;
        background:rgba(255,255,255,.045);
        color:#a8bdd0;
        font-size:11px;
        line-height:1.5;
        margin-bottom:14px;
    }

    .bt-rating-field{
        margin-bottom:13px;
    }

    .bt-rating-field label{
        display:block;
        font-size:10px;
        font-weight:900;
        margin-bottom:7px;
    }

    .bt-rating-field select,
    .bt-rating-field textarea{
        width:100%;
        border:1px solid rgba(255,255,255,.08);
        border-radius:11px;
        outline:none;
        background:#0a2239;
        color:white;
        font-family:inherit;
        font-size:12px;
    }

    .bt-rating-field select{
        height:43px;
        padding:0 11px;
    }

    .bt-rating-field textarea{
        min-height:85px;
        resize:vertical;
        padding:11px;
    }

    .bt-rating-recommend{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin-top:7px;
    }

    .bt-rating-choice{
        position:relative;
    }

    .bt-rating-choice input{
        position:absolute;
        opacity:0;
        pointer-events:none;
    }

    .bt-rating-choice label{
        min-height:42px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:11px;
        background:rgba(255,255,255,.06);
        border:1px solid rgba(255,255,255,.08);
        font-size:11px;
        font-weight:900;
        cursor:pointer;
    }

    .bt-rating-choice input:checked + label{
        background:rgba(20,126,232,.20);
        border-color:#147ee8;
        color:#77baff;
    }

    .bt-rating-submit{
        width:100%;
        min-height:47px;
        margin-top:15px;
        border:none;
        border-radius:12px;
        background:linear-gradient(135deg,#ff7900,#ff982f);
        color:white;
        font-weight:900;
        font-size:11px;
        cursor:pointer;
    }

    .bt-rating-submit:disabled{
        opacity:.6;
        cursor:not-allowed;
    }

    `;

    document.head
    .appendChild(style);

    const overlay =
        document.createElement(
            "div"
        );

    overlay.id =
        "boratecRatingOverlay";

    overlay.innerHTML = `

        <div class="bt-rating-box">

            <div class="bt-rating-head">

                <div>
                    <small>BORATEC</small>
                    <h3>Avaliar serviço</h3>
                </div>

                <button
                    class="bt-rating-close"
                    onclick="closeRatingModal()"
                    type="button"
                >
                    ×
                </button>

            </div>

            <div
                id="boratecRatingPerson"
                class="bt-rating-person"
            >
                Carregando...
            </div>

            <form
                id="boratecRatingForm"
                onsubmit="submitBoraTecRating(event)"
            >

                <div class="bt-rating-field">

                    <label id="btRatingTechnicalLabel">
                        Qualidade técnica
                    </label>

                    <select
                        id="btRatingTechnical"
                        required
                    >
                        ${ratingOptionsHTML()}
                    </select>

                </div>


                <div class="bt-rating-field">

                    <label id="btRatingAgreementLabel">
                        Cumprimento do combinado
                    </label>

                    <select
                        id="btRatingAgreement"
                        required
                    >
                        ${ratingOptionsHTML()}
                    </select>

                </div>


                <div class="bt-rating-field">

                    <label id="btRatingCareLabel">
                        Atendimento / postura
                    </label>

                    <select
                        id="btRatingCare"
                        required
                    >
                        ${ratingOptionsHTML()}
                    </select>

                </div>


                <div class="bt-rating-field">

                    <label id="btRatingFinancialLabel">
                        Financeiro / pagamento
                    </label>

                    <select
                        id="btRatingFinancial"
                        required
                    >
                        ${ratingOptionsHTML()}
                    </select>

                </div>


                <div class="bt-rating-field">

                    <label>
                        Você recomendaria?
                    </label>

                    <div class="bt-rating-recommend">

                        <div class="bt-rating-choice">

                            <input
                                id="btRecommendYes"
                                type="radio"
                                name="btRecommend"
                                value="yes"
                                checked
                            >

                            <label for="btRecommendYes">
                                👍 Sim
                            </label>

                        </div>


                        <div class="bt-rating-choice">

                            <input
                                id="btRecommendNo"
                                type="radio"
                                name="btRecommend"
                                value="no"
                            >

                            <label for="btRecommendNo">
                                👎 Não
                            </label>

                        </div>

                    </div>

                </div>


                <div class="bt-rating-field">

                    <label>
                        Comentário (opcional)
                    </label>

                    <textarea
                        id="btRatingComment"
                        maxlength="500"
                        placeholder="Conte como foi a experiência..."
                    ></textarea>

                </div>


                <button
                    id="btRatingSubmit"
                    class="bt-rating-submit"
                    type="submit"
                >
                    ⭐ Enviar avaliação
                </button>

            </form>

        </div>

    `;

    document.body
    .appendChild(
        overlay
    );
}


/* =========================================================
   OPÇÕES 0 A 10
========================================================= */

function ratingOptionsHTML(){

    let html =
        '<option value="">Selecione uma nota</option>';

    for(
        let score = 10;
        score >= 0;
        score--
    ){

        html +=
            `<option value="${score}">${score}</option>`;

    }

    return html;
}


/* =========================================================
   ABRIR AVALIAÇÃO
========================================================= */

async function openRatingModal(jobId){

    if(!jobId){
        return;
    }

    currentRatingJob =
        null;

    try{

        const {
            data:job,
            error
        } =
        await boraSupabase
        .from("jobs")
        .select(`
            id,
            opportunity_id,
            publisher_id,
            professional_id,
            status
        `)
        .eq(
            "id",
            jobId
        )
        .single();

        if(error){
            throw error;
        }

        if(job.status !== "completed"){

            showToast(
                "Este serviço ainda não foi concluído"
            );

            return;
        }

        const isPublisher =
            job.publisher_id ===
            boraUser.id;

        const reviewedId =
            isPublisher
            ?
            job.professional_id
            :
            job.publisher_id;

        const {
            data:profile
        } =
        await boraSupabase
        .from("profiles")
        .select(`
            id,
            name,
            professional_name
        `)
        .eq(
            "id",
            reviewedId
        )
        .maybeSingle();


        currentRatingJob = {
            ...job,
            isPublisher,
            reviewedId,
            reviewedName:
                profile?.professional_name
                ||
                profile?.name
                ||
                "Profissional BoraTec"
        };


        document
        .getElementById(
            "boratecRatingPerson"
        )
        .textContent =
            `Você está avaliando: ${currentRatingJob.reviewedName}`;


        if(isPublisher){

            document
            .getElementById(
                "btRatingTechnicalLabel"
            )
            .textContent =
                "Qualidade técnica";

            document
            .getElementById(
                "btRatingAgreementLabel"
            )
            .textContent =
                "Cumprimento do combinado";

            document
            .getElementById(
                "btRatingCareLabel"
            )
            .textContent =
                "Atendimento / postura";

            document
            .getElementById(
                "btRatingFinancialLabel"
            )
            .textContent =
                "Financeiro / negociação";

        }
        else{

            document
            .getElementById(
                "btRatingTechnicalLabel"
            )
            .textContent =
                "Organização do serviço";

            document
            .getElementById(
                "btRatingAgreementLabel"
            )
            .textContent =
                "Cumprimento do combinado";

            document
            .getElementById(
                "btRatingCareLabel"
            )
            .textContent =
                "Comunicação / postura";

            document
            .getElementById(
                "btRatingFinancialLabel"
            )
            .textContent =
                "Financeiro / pagamento";

        }


        document
        .getElementById(
            "boratecRatingForm"
        )
        .reset();


        document
        .getElementById(
            "btRecommendYes"
        )
        .checked =
            true;


        document
        .getElementById(
            "boratecRatingOverlay"
        )
        .classList
        .add(
            "show"
        );


    }catch(error){

        console.error(
            "Erro abrir avaliação:",
            error
        );

        showToast(
            "Não foi possível abrir a avaliação"
        );

    }
}


/* =========================================================
   FECHAR AVALIAÇÃO
========================================================= */

function closeRatingModal(){

    document
    .getElementById(
        "boratecRatingOverlay"
    )
    ?.classList
    .remove(
        "show"
    );

    currentRatingJob =
        null;
}


/* =========================================================
   ENVIAR AVALIAÇÃO
========================================================= */

async function submitBoraTecRating(event){

    event.preventDefault();


    if(!currentRatingJob){

        showToast(
            "Serviço não carregado"
        );

        return;

    }


    const technical =
        Number(
            document
            .getElementById(
                "btRatingTechnical"
            )
            .value
        );


    const agreement =
        Number(
            document
            .getElementById(
                "btRatingAgreement"
            )
            .value
        );


    const care =
        Number(
            document
            .getElementById(
                "btRatingCare"
            )
            .value
        );


    const financial =
        Number(
            document
            .getElementById(
                "btRatingFinancial"
            )
            .value
        );


    const validScores =
        [
            technical,
            agreement,
            care,
            financial
        ]
        .every(
            score =>
                Number.isInteger(score)
                &&
                score >= 0
                &&
                score <= 10
        );


    if(!validScores){

        showToast(
            "Selecione todas as notas"
        );

        return;

    }


    const recommend =
        document
        .querySelector(
            'input[name="btRecommend"]:checked'
        )
        ?.value
        ===
        "yes";


    const comment =
        document
        .getElementById(
            "btRatingComment"
        )
        .value
        .trim();


    const button =
        document
        .getElementById(
            "btRatingSubmit"
        );


    button.disabled =
        true;


    button.textContent =
        "Enviando...";


    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .rpc(
            "rate_job",
            {

                p_job_id:
                    currentRatingJob.id,

                p_technical_score:
                    technical,

                p_agreement_score:
                    agreement,

                p_customer_care_score:
                    care,

                p_financial_score:
                    financial,

                p_would_recommend:
                    recommend,

                p_comment:
                    comment
                    ||
                    null

            }
        );


        if(error){
            throw error;
        }


        console.log(
            "⭐ Avaliação registrada:",
            data
        );


        closeRatingModal();


        showToast(
            "⭐ Avaliação enviada!"
        );


        await loadMyJobs();


    }catch(error){

        console.error(
            "Erro enviar avaliação:",
            error
        );


        let message =
            "Não foi possível enviar a avaliação";


        if(
            String(
                error?.message
                ||
                ""
            )
            .toLowerCase()
            .includes(
                "já avaliou"
            )
        ){

            message =
                "Você já avaliou este serviço";

        }


        showToast(
            message
        );


    }finally{

        button.disabled =
            false;


        button.textContent =
            "⭐ Enviar avaliação";

    }
}


/* =========================================================
   GLOBAL V0.6
========================================================= */

window.openRatingModal =
    openRatingModal;

window.closeRatingModal =
    closeRatingModal;

window.submitBoraTecRating =
    submitBoraTecRating;


/* =========================================================
   INICIAR INTERFACE DE AVALIAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function(){

        createRatingInterface();

    }
);

/* =========================================================
   BORATEC R11 PWA
   REPUTAÇÃO + PERFIL + INTERESSADOS + FILTROS + NOTIFICAÇÕES
========================================================= */

let btAllPosts = [];
let btNotificationsChannel = null;
let btCurrentProfileId = null;
let btProfileConversationInterestId = null;
let btDirectoryMode = null;


const btFeedFilters = {
    type: "",
    city: "",
    category: "",
    minValue: ""
};


/* =========================================================
   ESTILOS / INTERFACES V1.0
========================================================= */

function createBoraTecV1Interface(){

    if(document.getElementById("btV1Style")){
        return;
    }

    const style = document.createElement("style");
    style.id = "btV1Style";

    style.textContent = `
    .bt-v1-floating{
        position:fixed;
        z-index:3500;
        border:none;
        color:#fff;
        cursor:pointer;
        box-shadow:0 10px 28px rgba(0,0,0,.28);
        font-family:inherit;
    }

    #btFilterButton{
        left:16px;
        bottom:88px;
        min-height:42px;
        padding:0 14px;
        border-radius:13px;
        background:#123b60;
        border:1px solid rgba(255,255,255,.10);
        font-size:11px;
        font-weight:900;
    }

    #btNotificationButton{
        top:14px;
        right:70px;
        width:42px;
        height:42px;
        border-radius:50%;
        background:#123b60;
        border:1px solid rgba(255,255,255,.10);
        font-size:17px;
    }

    #btNotificationBadge{
        position:absolute;
        top:-5px;
        right:-5px;
        min-width:19px;
        height:19px;
        padding:0 5px;
        display:none;
        align-items:center;
        justify-content:center;
        border-radius:20px;
        background:#ff7900;
        color:#fff;
        font-size:9px;
        font-weight:900;
        border:2px solid #071b2d;
    }

    .bt-v1-overlay{
        position:fixed;
        inset:0;
        z-index:7000;
        display:none;
        align-items:center;
        justify-content:center;
        padding:14px;
        background:rgba(1,9,18,.92);
    }

    .bt-v1-overlay.show{
        display:flex;
    }

    #btProfileOverlay{
        z-index:7200;
    }

    #btInterestedOverlay{
        z-index:7100;
    }

    #btNotificationsOverlay,
    #btFilterOverlay{
        z-index:7000;
    }

    .bt-v1-panel{
        width:100%;
        max-width:470px;
        max-height:92vh;
        overflow:auto;
        background:#0f2d49;
        color:#fff;
        border:1px solid rgba(255,255,255,.08);
        border-radius:20px;
        box-shadow:0 20px 70px rgba(0,0,0,.38);
    }

    .bt-v1-head{
        position:sticky;
        top:0;
        z-index:2;
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:17px;
        background:#0f2d49;
        border-bottom:1px solid rgba(255,255,255,.07);
    }

    .bt-v1-head small{
        display:block;
        color:#ff8a1d;
        font-size:9px;
        font-weight:900;
        letter-spacing:.8px;
        margin-bottom:3px;
    }

    .bt-v1-head h3{
        margin:0;
        font-size:17px;
    }

    .bt-v1-close{
        width:38px;
        height:38px;
        flex:0 0 auto;
        border:none;
        border-radius:11px;
        color:#fff;
        background:rgba(255,255,255,.07);
        cursor:pointer;
        font-size:18px;
    }

    .bt-v1-body{
        padding:16px;
    }

    .bt-field{
        margin-bottom:12px;
    }

    .bt-field label{
        display:block;
        margin-bottom:6px;
        font-size:10px;
        font-weight:900;
        color:#dbe8f4;
    }

    .bt-field input,
    .bt-field select,
    .bt-field textarea{
        width:100%;
        min-height:43px;
        box-sizing:border-box;
        border-radius:11px;
        border:1px solid rgba(255,255,255,.09);
        background:#092039;
        color:#fff;
        padding:10px 11px;
        outline:none;
        font-family:inherit;
        font-size:12px;
    }

    .bt-field textarea{
        min-height:88px;
        resize:vertical;
    }

    .bt-grid-2{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
    }

    .bt-primary{
        width:100%;
        min-height:45px;
        border:none;
        border-radius:12px;
        background:linear-gradient(135deg,#ff7900,#ff9a35);
        color:#fff;
        font-size:11px;
        font-weight:900;
        cursor:pointer;
    }

    .bt-secondary{
        min-height:39px;
        border:1px solid rgba(255,255,255,.10);
        border-radius:11px;
        padding:0 12px;
        background:rgba(255,255,255,.06);
        color:#fff;
        font-size:10px;
        font-weight:900;
        cursor:pointer;
    }

    .bt-empty{
        padding:34px 16px;
        color:#8fa9bf;
        text-align:center;
        line-height:1.6;
        font-size:12px;
    }

    .bt-profile-top{
        display:flex;
        align-items:center;
        gap:13px;
        margin-bottom:15px;
    }

    .bt-profile-avatar{
        width:62px;
        height:62px;
        flex:0 0 auto;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:50%;
        background:#153f65;
        color:#fff;
        font-weight:900;
        font-size:17px;
        overflow:hidden;
    }

    .bt-profile-avatar img{
        width:100%;
        height:100%;
        object-fit:cover;
    }

    .bt-profile-name{
        font-size:18px;
        font-weight:900;
        margin-bottom:4px;
    }

    .bt-profile-place{
        color:#91aac0;
        font-size:11px;
    }

    .bt-reputation-hero{
        padding:14px;
        border-radius:14px;
        background:rgba(255,255,255,.045);
        margin-bottom:14px;
    }

    .bt-reputation-score{
        display:flex;
        align-items:center;
        gap:8px;
        margin-bottom:7px;
    }

    .bt-reputation-score strong{
        font-size:25px;
        color:#ff9b34;
    }

    .bt-reputation-score span{
        color:#adc0d2;
        font-size:10px;
    }

    .bt-metrics{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin-top:12px;
    }

    .bt-metric{
        padding:10px;
        border-radius:11px;
        background:#09223a;
    }

    .bt-metric small{
        display:block;
        color:#829cb3;
        font-size:9px;
        margin-bottom:3px;
    }

    .bt-metric strong{
        font-size:14px;
    }

    .bt-chip-wrap{
        display:flex;
        flex-wrap:wrap;
        gap:6px;
        margin-top:7px;
    }

    .bt-chip{
        padding:6px 9px;
        border-radius:30px;
        background:rgba(20,126,232,.15);
        border:1px solid rgba(20,126,232,.28);
        color:#89c4ff;
        font-size:9px;
        font-weight:800;
    }

    .bt-section-title{
        margin:15px 0 7px;
        font-size:10px;
        font-weight:900;
        color:#ff9a34;
        letter-spacing:.5px;
    }

    .bt-interested-card,
    .bt-notification-card{
        padding:13px;
        margin-bottom:9px;
        border-radius:14px;
        background:rgba(255,255,255,.045);
        border:1px solid rgba(255,255,255,.06);
    }

    .bt-interested-name{
        font-size:13px;
        font-weight:900;
        margin-bottom:5px;
    }

    .bt-interested-meta{
        color:#95acc0;
        font-size:10px;
        line-height:1.55;
    }

    .bt-interested-actions{
        display:flex;
        gap:8px;
        margin-top:10px;
    }

    .bt-interested-actions button{
        flex:1;
    }

    .bt-notification-card.unread{
        border-color:rgba(255,136,25,.35);
        background:rgba(255,136,25,.07);
    }

    .bt-notification-title{
        font-size:12px;
        font-weight:900;
        margin-bottom:4px;
    }

    .bt-notification-body{
        color:#a4b7c9;
        font-size:10px;
        line-height:1.5;
    }

    .bt-notification-time{
        margin-top:7px;
        color:#637e95;
        font-size:9px;
    }

    .bt-prof-click{
        cursor:pointer;
    }

    .bt-prof-click:hover{
        opacity:.9;
    }

    .bt-feed-rep-new{
        color:#ff8a1d;
        font-weight:900;
    }

    .bt-feed-rep{
        color:#ffc06d;
        font-weight:900;
    }

    @media(max-width:520px){
        .bt-grid-2{
            grid-template-columns:1fr;
        }
    }
    `;

    document.head.appendChild(style);

    const holder = document.createElement("div");
    holder.innerHTML = `

        <button
            id="btFilterButton"
            class="bt-v1-floating"
            type="button"
            onclick="openFeedFilters()"
        >
            🔎 Filtros
        </button>

        <button
            id="btNotificationButton"
            class="bt-v1-floating"
            type="button"
            onclick="openNotifications()"
            aria-label="Notificações"
        >
            🔔
            <span id="btNotificationBadge">0</span>
        </button>


        <div id="btFilterOverlay" class="bt-v1-overlay">
            <div class="bt-v1-panel">

                <div class="bt-v1-head">
                    <div>
                        <small>BORATEC</small>
                        <h3>Filtrar oportunidades</h3>
                    </div>

                    <button
                        class="bt-v1-close"
                        type="button"
                        onclick="closeFeedFilters()"
                    >×</button>
                </div>

                <div class="bt-v1-body">

                    <div class="bt-field">
                        <label>Tipo</label>
                        <select id="btFilterType">
                            <option value="">Todos</option>
                            <option value="service">Serviços</option>
                            <option value="helper">Precisa de ajudante</option>
                            <option value="available">Profissional disponível</option>
                        </select>
                    </div>

                    <div class="bt-field">
                        <label>Cidade / região</label>
                        <input
                            id="btFilterCity"
                            placeholder="Ex.: Cabo Frio"
                        >
                    </div>

                    <div class="bt-field">
                        <label>Especialidade / categoria</label>
                        <input
                            id="btFilterCategory"
                            placeholder="Ex.: Ar-condicionado"
                        >
                    </div>

                    <div class="bt-field">
                        <label>Valor mínimo</label>
                        <input
                            id="btFilterMinValue"
                            type="number"
                            min="0"
                            step="1"
                            placeholder="Ex.: 300"
                        >
                    </div>

                    <div class="bt-grid-2">
                        <button
                            class="bt-secondary"
                            type="button"
                            onclick="clearFeedFilters()"
                        >
                            Limpar
                        </button>

                        <button
                            class="bt-primary"
                            type="button"
                            onclick="applyFeedFiltersFromUI()"
                        >
                            Aplicar filtros
                        </button>
                    </div>

                </div>
            </div>
        </div>


        <div id="btProfileOverlay" class="bt-v1-overlay">
            <div class="bt-v1-panel">
                <div class="bt-v1-head">
                    <div>
                        <small>PERFIL PROFISSIONAL</small>
                        <h3 id="btProfileHeader">BoraTec</h3>
                    </div>

                    <button
                        class="bt-v1-close"
                        type="button"
                        onclick="closePublicProfile()"
                    >×</button>
                </div>

                <div
                    id="btProfileBody"
                    class="bt-v1-body"
                >
                    <div class="bt-empty">Carregando perfil...</div>
                </div>
            </div>
        </div>


        <div id="btInterestedOverlay" class="bt-v1-overlay">
            <div class="bt-v1-panel">
                <div class="bt-v1-head">
                    <div>
                        <small>OPORTUNIDADE</small>
                        <h3>Profissionais interessados</h3>
                    </div>

                    <button
                        class="bt-v1-close"
                        type="button"
                        onclick="closeInterestedProfessionals()"
                    >×</button>
                </div>

                <div
                    id="btInterestedBody"
                    class="bt-v1-body"
                >
                    <div class="bt-empty">Carregando interessados...</div>
                </div>
            </div>
        </div>


        <div id="btNotificationsOverlay" class="bt-v1-overlay">
            <div class="bt-v1-panel">
                <div class="bt-v1-head">
                    <div>
                        <small>BORATEC</small>
                        <h3>Notificações</h3>
                    </div>

                    <button
                        class="bt-v1-close"
                        type="button"
                        onclick="closeNotifications()"
                    >×</button>
                </div>

                <div class="bt-v1-body">

                    <button
                        class="bt-secondary"
                        type="button"
                        style="width:100%;margin-bottom:8px;"
                        onclick="markAllNotificationsRead()"
                    >
                        ✓ Marcar todas como lidas
                    </button>

                    <button
                        class="bt-secondary"
                        type="button"
                        style="
                            width:100%;
                            margin-bottom:12px;
                            border-color:#7a3434;
                            color:#ff8d88;
                        "
                        onclick="clearAllNotifications()"
                    >
                        🗑 Limpar notificações
                    </button>

                    <div id="btNotificationsBody">
                        <div class="bt-empty">Carregando notificações...</div>
                    </div>

                </div>
            </div>
        </div>
    `;

    while(holder.firstChild){
        document.body.appendChild(holder.firstChild);
    }
}


/* =========================================================
   FEED COM REPUTAÇÃO
========================================================= */

loadOpportunities =
async function(){

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from("opportunities")
        .select(`
            id,
            author_id,
            type,
            title,
            description,
            category,
            state,
            city,
            neighborhood,
            service_date,
            value,
            value_negotiable,
            urgency,
            status,
            created_at,
            profiles (
                id,
                name,
                professional_name,
                photo_url
            )
        `)
        .eq("status","open")
        .order("created_at",{ ascending:false });


        if(error){
            throw error;
        }

        const authorIds =
            [...new Set(
                (data || [])
                .map(item => item.author_id)
                .filter(Boolean)
            )];

        const reputationMap = new Map();

        if(authorIds.length){

            const {
                data:reputations,
                error:repError
            } =
            await boraSupabase
            .from("v_profile_reputation")
            .select(`
                id,
                reputation,
                ratings_count,
                completed_jobs,
                recommend_percent
            `)
            .in("id", authorIds);

            if(!repError){

                (reputations || [])
                .forEach(rep => {
                    reputationMap.set(
                        rep.id,
                        rep
                    );
                });
            }
            else{
                console.warn(
                    "Reputação do feed não carregada:",
                    repError
                );
            }
        }

        btAllPosts =
            (data || [])
            .map(item => {

                const post =
                    convertDatabaseOpportunity(item);

                const rep =
                    reputationMap.get(item.author_id)
                    ||
                    {};

                post.rating =
                    Number(rep.reputation || 0);

                post.ratingsCount =
                    Number(rep.ratings_count || 0);

                post.jobs =
                    Number(rep.completed_jobs || 0);

                post.recommendPercent =
                    Number(rep.recommend_percent || 0);

                post.photoUrl =
                    item.profiles?.photo_url
                    ||
                    null;

                post.cityRaw =
                    item.city
                    ||
                    "";

                post.categoryRaw =
                    item.category
                    ||
                    "";

                return post;
            });

        applyCurrentFeedFilters();

    }catch(error){

        console.error(
            "Erro oportunidades V1:",
            error
        );

        showToast(
            "Erro ao carregar oportunidades"
        );
    }
};


/* =========================================================
   CARD V1.0
========================================================= */

cardHTML =
function(post){

    let typeText = "SERVIÇO";
    let typeClass = "";
    let typeIcon = "🔥";
    let button = "Quero fazer";
    let buttonClass = "action-btn";

    if(post.type === "service"){
        typeText =
            post.urgent
            ? "SERVIÇO URGENTE"
            : "SERVIÇO";
    }

    if(post.type === "helper"){
        typeText = "PRECISO DE AJUDANTE";
        typeClass = "helper";
        typeIcon = "👷";
        button = "Tenho interesse";
    }

    if(post.type === "available"){

        const isHelperAvailable =
            post.databaseType ===
            "helper_available";

        typeText =
            isHelperAvailable
            ? "AJUDANTE DISPONÍVEL"
            : "PROFISSIONAL DISPONÍVEL";

        typeClass = "available";

        typeIcon =
            isHelperAvailable
            ? "👷"
            : "👨‍🔧";

        button = "Conversar";

        buttonClass =
            "action-btn orange";
    }

    const priceHTML =
        post.price !== null
        &&
        post.price !== undefined
        ?
        `
        <div class="price">
            <small>Valor informado</small>
            <strong>${money(post.price)}</strong>
        </div>
        `
        :
        `
        <div class="price">
            <small>Valor</small>
            <strong
                style="font-size:12px;color:#9bb0c4;"
            >
                A combinar
            </strong>
        </div>
        `;

    const isOwnPost =
        boraUser
        &&
        post.authorId === boraUser.id;

    const actionHTML =
        isOwnPost
        ?
        `
        <div style="display:flex;gap:7px;width:100%;">

            <button
                class="action-btn orange"
                style="flex:1;"
                onclick="openInterestedProfessionals('${post.id}')"
            >
                👥 Interessados
            </button>

            <button
                class="action-btn"
                style="
                    flex:0 0 auto;
                    background:rgba(255,76,91,.13);
                    color:#ff7b86;
                    box-shadow:none;
                    border:1px solid rgba(255,76,91,.22);
                "
                onclick="cancelOpportunity('${post.id}')"
                title="Cancelar publicação"
            >
                🗑
            </button>

        </div>
        `
        :
        `
        <button
            class="${buttonClass}"
            onclick="interest('${post.id}')"
        >
            ${button}
        </button>
        `;

    const reputationHTML =
        Number(post.ratingsCount || 0) > 0
        ?
        `
        <span class="bt-feed-rep">
            ⭐ ${Number(post.rating || 0).toFixed(1)}
        </span>
        &nbsp;•&nbsp;
        ${Number(post.jobs || 0)} serviços
        &nbsp;•&nbsp;
        ${Number(post.recommendPercent || 0).toFixed(0)}% recomendam
        `
        :
        `
        <span class="bt-feed-rep-new">NOVO</span>
        &nbsp;•&nbsp;
        ${Number(post.jobs || 0)} serviços BoraTec
        `;

    const avatarHTML =
        post.photoUrl
        ?
        `
        <img
            src="${escapeHtml(post.photoUrl)}"
            alt="Perfil"
            style="
                width:100%;
                height:100%;
                object-fit:cover;
                border-radius:50%;
            "
        >
        `
        :
        safe(post.initials);

    return `
    <article
        class="job-card ${post.urgent ? "urgent" : ""}"
    >

        <div class="card-top">

            <div class="type ${typeClass}">
                <span>${typeIcon}</span>
                ${typeText}
            </div>

            <div class="time">
                ${safe(post.time)}
            </div>

        </div>

        <div class="job-title">
            ${safe(post.title)}
        </div>

        <div class="job-info">
            <span>📍 ${safe(post.location)}</span>
            <span>📅 ${safe(post.date)}</span>
            <span>❄ ${safe(post.category)}</span>
        </div>

        <div class="job-description">
            ${safe(post.description)}
        </div>

        <div
            class="professional bt-prof-click"
            onclick="openPublicProfile('${post.authorId}')"
            title="Ver perfil profissional"
        >

            <div class="prof-avatar">
                ${avatarHTML}
            </div>

            <div class="prof-data">

                <div class="prof-name">
                    ${safe(post.author)}
                </div>

                <div class="prof-rating">
                    ${reputationHTML}
                </div>

            </div>

        </div>

        <div class="job-action">
            ${priceHTML}
            ${actionHTML}
        </div>

    </article>
    `;
};


/* =========================================================
   FILTROS
========================================================= */

function openFeedFilters(){

    document
    .getElementById("btFilterType")
    .value =
        btFeedFilters.type;

    document
    .getElementById("btFilterCity")
    .value =
        btFeedFilters.city;

    document
    .getElementById("btFilterCategory")
    .value =
        btFeedFilters.category;

    document
    .getElementById("btFilterMinValue")
    .value =
        btFeedFilters.minValue;

    document
    .getElementById("btFilterOverlay")
    .classList.add("show");
}

function closeFeedFilters(){
    document
    .getElementById("btFilterOverlay")
    ?.classList.remove("show");
}

function applyFeedFiltersFromUI(){

    btFeedFilters.type =
        document
        .getElementById("btFilterType")
        .value;

    btFeedFilters.city =
        document
        .getElementById("btFilterCity")
        .value
        .trim();

    btFeedFilters.category =
        document
        .getElementById("btFilterCategory")
        .value
        .trim();

    btFeedFilters.minValue =
        document
        .getElementById("btFilterMinValue")
        .value
        .trim();

    applyCurrentFeedFilters();
    closeFeedFilters();
}

function clearFeedFilters(){

    btFeedFilters.type = "";
    btFeedFilters.city = "";
    btFeedFilters.category = "";
    btFeedFilters.minValue = "";

    document.getElementById("btFilterType").value = "";
    document.getElementById("btFilterCity").value = "";
    document.getElementById("btFilterCategory").value = "";
    document.getElementById("btFilterMinValue").value = "";

    applyCurrentFeedFilters();
    closeFeedFilters();
}

function applyCurrentFeedFilters(){

    const normalize =
        value =>
        String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"")
        .toLowerCase();

    const minValue =
        btFeedFilters.minValue
        ? Number(btFeedFilters.minValue)
        : null;

    posts =
        btApplyMainTabFilter(
            btAllPosts
        )
        .filter(post => {

            if(
                btFeedFilters.type
                &&
                post.type !==
                btFeedFilters.type
            ){
                return false;
            }

            if(
                btFeedFilters.city
                &&
                !normalize(
                    post.location
                )
                .includes(
                    normalize(
                        btFeedFilters.city
                    )
                )
            ){
                return false;
            }

            if(
                btFeedFilters.category
                &&
                !normalize(
                    post.category
                )
                .includes(
                    normalize(
                        btFeedFilters.category
                    )
                )
            ){
                return false;
            }

            if(
                minValue !== null
                &&
                Number.isFinite(
                    minValue
                )
            ){
                if(
                    post.price === null
                    ||
                    post.price === undefined
                    ||
                    Number(post.price)
                    <
                    minValue
                ){
                    return false;
                }
            }

            return true;
        });

    if(
        typeof currentFilter
        !==
        "undefined"
    ){
        currentFilter =
            "all";
    }

    renderFeed();

    btUpdateFeedHeaderForMainTab();

    const button =
        document
        .getElementById(
            "btFilterButton"
        );

    const activeCount =
        [
            btFeedFilters.type,
            btFeedFilters.city,
            btFeedFilters.category,
            btFeedFilters.minValue
        ]
        .filter(Boolean)
        .length;

    if(button){
        button.textContent =
            activeCount
            ? `🔎 Filtros (${activeCount})`
            : "🔎 Filtros";
    }
}


/* =========================================================
   PERFIL PÚBLICO / PRÓPRIO PERFIL
========================================================= */

const BT_SPECIALTY_OPTIONS = [
    "Instalação de ar-condicionado",
    "Manutenção de ar-condicionado",
    "Limpeza / higienização",
    "Refrigeração comercial",
    "Geladeira e freezer",
    "Câmara fria",
    "Elétrica",
    "Ajudante",
    "Outros"
];

function btSpecialtyCheckboxes(selected){

    const selectedSet =
        new Set(
            Array.isArray(selected)
            ? selected
            : []
        );

    return BT_SPECIALTY_OPTIONS
    .map((item,index) => `
        <label class="bt-specialty-option">
            <input
                type="checkbox"
                class="btOwnSpecialtyCheck"
                value="${escapeHtml(item)}"
                ${selectedSet.has(item) ? "checked" : ""}
            >
            <span>${escapeHtml(item)}</span>
        </label>
    `)
    .join("");
}


async function openPublicProfile(profileId){

    if(!profileId){
        return;
    }

    btCurrentProfileId = profileId;

    // No celular alguns navegadores mantêm o modal anterior
    // na pilha visual por um instante. Fechamos explicitamente.
    document
    .getElementById("btInterestedOverlay")
    ?.classList.remove("show");

    // Perfil aberto fora da lista de interessados:
    // não herda conversa contextual antiga.
    if(!window.__btOpeningInterestedProfile){
        btProfileConversationInterestId = null;
    }

    window.__btOpeningInterestedProfile = false;

    const overlay =
        document.getElementById("btProfileOverlay");

    const body =
        document.getElementById("btProfileBody");

    overlay.classList.add("show");

    body.innerHTML =
        `<div class="bt-empty">Carregando perfil...</div>`;

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .rpc(
            "get_public_profile",
            {
                p_profile_id: profileId
            }
        );

        if(error){
            throw error;
        }

        if(!data){
            throw new Error("Perfil não encontrado");
        }

        renderPublicProfile(data);

    }catch(error){

        console.error(
            "Erro perfil público:",
            error
        );

        body.innerHTML =
            `<div class="bt-empty">Não foi possível carregar o perfil.</div>`;
    }
}

function closePublicProfile(){
    document
    .getElementById("btProfileOverlay")
    ?.classList.remove("show");
}

let btPendingProfilePhoto = null;

function previewOwnProfilePhoto(event){

    const file =
        event?.target?.files?.[0];

    if(!file){
        return;
    }

    if(!file.type?.startsWith("image/")){
        showToast("Escolha uma imagem válida");
        event.target.value = "";
        return;
    }

    const maxBytes =
        5 * 1024 * 1024;

    if(file.size > maxBytes){
        showToast("A foto deve ter no máximo 5 MB");
        event.target.value = "";
        return;
    }

    btPendingProfilePhoto = file;

    const preview =
        document.getElementById(
            "btOwnPhotoPreview"
        );

    if(preview){
        preview.src =
            URL.createObjectURL(file);

        preview.style.display =
            "block";
    }

    const initials =
        document.getElementById(
            "btOwnPhotoInitials"
        );

    if(initials){
        initials.style.display =
            "none";
    }

    const status =
        document.getElementById(
            "btOwnPhotoStatus"
        );

    if(status){
        status.textContent =
            "Nova foto selecionada. Toque em Salvar meu perfil.";
    }
}

async function uploadOwnProfilePhoto(){

    if(
        !btPendingProfilePhoto
        ||
        !boraUser
    ){
        return (
            boraProfile?.photo_url
            ||
            btCurrentProfile?.photo_url
            ||
            null
        );
    }

    const file =
        btPendingProfilePhoto;

    const originalName =
        String(
            file.name
            ||
            ""
        );

    const extMatch =
        originalName
        .toLowerCase()
        .match(/\.([a-z0-9]{2,5})$/);

    const extension =
        extMatch?.[1]
        ||
        (
            file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
            ? "webp"
            : "jpg"
        );

    const objectPath =
        `${boraUser.id}/avatar-${Date.now()}.${extension}`;

    const {
        error:uploadError
    } =
    await boraSupabase
    .storage
    .from("profile-photos")
    .upload(
        objectPath,
        file,
        {
            cacheControl:"3600",
            upsert:false
        }
    );

    if(uploadError){
        throw uploadError;
    }

    const {
        data:publicData
    } =
    boraSupabase
    .storage
    .from("profile-photos")
    .getPublicUrl(
        objectPath
    );

    const publicUrl =
        publicData?.publicUrl;

    if(!publicUrl){
        throw new Error(
            "Não foi possível obter a URL da foto"
        );
    }

    return publicUrl;
}


function renderPublicProfile(profile){

    const body =
        document.getElementById("btProfileBody");

    const header =
        document.getElementById("btProfileHeader");

    const professionalName =
        profile.professional_name
        ||
        profile.name
        ||
        "Profissional BoraTec";

    header.textContent =
        professionalName;

    const ratingsCount =
        Number(profile.ratings_count || 0);

    const reputation =
        Number(profile.reputation || 0);

    const completed =
        Number(profile.completed_jobs || 0);

    const recommend =
        Number(profile.recommend_percent || 0);

    const isAvailable =
        profile.is_available !== false;

    const isOwn =
        boraUser
        &&
        profile.id === boraUser.id;

    const avatar =
        profile.photo_url
        ?
        `<img src="${escapeHtml(profile.photo_url)}" alt="Perfil">`
        :
        escapeHtml(
            getInitials(professionalName)
        );

    const specialties =
        Array.isArray(profile.specialties)
        ? profile.specialties
        : [];

    const reviews =
        Array.isArray(profile.recent_reviews)
        ? profile.recent_reviews
        : [];

    const reputationTitle =
        ratingsCount > 0
        ?
        `⭐ ${reputation.toFixed(1)}`
        :
        "NOVO";

    body.innerHTML = `

        <div class="bt-profile-top">

            <div class="bt-profile-avatar">
                ${avatar}
            </div>

            <div>
                <div class="bt-profile-name">
                    ${escapeHtml(professionalName)}
                </div>

                <div class="bt-availability ${isAvailable ? "" : "off"}">
                    ${
                        isAvailable
                        ? "🟢 DISPONÍVEL AGORA"
                        : "⚪ INDISPONÍVEL NO MOMENTO"
                    }
                </div>
            </div>

        </div>


        <div class="bt-reputation-hero">

            <div class="bt-reputation-score">
                <strong>${reputationTitle}</strong>
                <span>
                    ${
                        ratingsCount > 0
                        ? `${ratingsCount} avaliações recebidas`
                        : "Ainda sem avaliações"
                    }
                </span>
            </div>

            <div class="bt-metrics">

                <div class="bt-metric">
                    <small>Serviços concluídos</small>
                    <strong>${completed}</strong>
                </div>

                <div class="bt-metric">
                    <small>Recomendam</small>
                    <strong>
                        ${
                            ratingsCount > 0
                            ? `${recommend.toFixed(0)}%`
                            : "—"
                        }
                    </strong>
                </div>

                <div class="bt-metric">
                    <small>Técnica / organização</small>
                    <strong>
                        ${
                            ratingsCount > 0
                            ? Number(profile.technical_avg || 0).toFixed(1)
                            : "—"
                        }
                    </strong>
                </div>

                <div class="bt-metric">
                    <small>Cumpriu combinado</small>
                    <strong>
                        ${
                            ratingsCount > 0
                            ? Number(profile.agreement_avg || 0).toFixed(1)
                            : "—"
                        }
                    </strong>
                </div>

                <div class="bt-metric">
                    <small>Atendimento / postura</small>
                    <strong>
                        ${
                            ratingsCount > 0
                            ? Number(profile.customer_care_avg || 0).toFixed(1)
                            : "—"
                        }
                    </strong>
                </div>

                <div class="bt-metric">
                    <small>Financeiro</small>
                    <strong>
                        ${
                            ratingsCount > 0
                            ? Number(profile.financial_avg || 0).toFixed(1)
                            : "—"
                        }
                    </strong>
                </div>

            </div>
        </div>


        <div class="bt-section-title">
            ESPECIALIDADES
        </div>

        <div class="bt-chip-wrap">

            ${
                specialties.length
                ?
                specialties
                .map(item =>
                    `<span class="bt-chip">🔧 ${escapeHtml(item)}</span>`
                )
                .join("")
                :
                `<span style="color:#7892a8;font-size:10px;">Não informadas</span>`
            }

        </div>


        <div class="bt-section-title">
            SOBRE
        </div>

        <div
            style="
                color:#a8bacb;
                font-size:11px;
                line-height:1.6;
            "
        >
            ${
                profile.bio
                ? escapeHtml(profile.bio)
                : "Este profissional ainda não adicionou uma apresentação."
            }
        </div>


        <div class="bt-section-title">
            AVALIAÇÕES RECEBIDAS
        </div>

        ${
            reviews.length
            ?
            reviews
            .map(review => `
                <div class="bt-review-card">
                    <div class="bt-review-top">
                        <span>${escapeHtml(review.reviewer_name || "Profissional BoraTec")}</span>
                        <span>⭐ ${Number(review.score || 0).toFixed(1)}</span>
                    </div>

                    <div class="bt-review-comment">
                        ${
                            review.comment
                            ? escapeHtml(review.comment)
                            : (
                                review.would_recommend
                                ? "Recomenda este profissional."
                                : "Avaliação registrada sem comentário."
                            )
                        }
                    </div>
                </div>
            `)
            .join("")
            :
            `<div style="color:#7892a8;font-size:10px;">Ainda não há avaliações para exibir.</div>`
        }


        ${
            !isOwn
            &&
            btProfileConversationInterestId
            ?
            `
            <button
                class="bt-primary"
                type="button"
                style="margin-top:16px;"
                onclick="chatFromPublicProfile('${escapeJs(professionalName)}')"
            >
                💬 Conversar
            </button>
            `
            :
            ""
        }


        ${
            isOwn
            ?
            `
            <div class="bt-section-title">
                EDITAR MEU PERFIL
            </div>

            <div class="bt-field">
                <label>Foto de perfil</label>

                <div
                    style="
                        display:flex;
                        align-items:center;
                        gap:12px;
                        margin-top:8px;
                    "
                >
                    <div
                        style="
                            width:68px;
                            height:68px;
                            flex:0 0 68px;
                            border-radius:12px;
                            overflow:hidden;
                            border:1px solid #40505a;
                            background:#10171b;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                        "
                    >
                        ${
                            profile.photo_url
                            ?
                            `
                            <img
                                id="btOwnPhotoPreview"
                                src="${escapeHtml(profile.photo_url)}"
                                alt="Minha foto"
                                style="
                                    width:100%;
                                    height:100%;
                                    object-fit:cover;
                                    display:block;
                                "
                            >
                            <span
                                id="btOwnPhotoInitials"
                                style="display:none;"
                            ></span>
                            `
                            :
                            `
                            <img
                                id="btOwnPhotoPreview"
                                alt="Minha foto"
                                style="
                                    width:100%;
                                    height:100%;
                                    object-fit:cover;
                                    display:none;
                                "
                            >
                            <span
                                id="btOwnPhotoInitials"
                                style="
                                    color:#08baf0;
                                    font-weight:950;
                                    font-size:18px;
                                "
                            >
                                ${escapeHtml(getInitials(professionalName))}
                            </span>
                            `
                        }
                    </div>

                    <div style="flex:1;min-width:0;">
                        <label
                            for="btOwnPhotoFile"
                            style="
                                display:inline-flex;
                                align-items:center;
                                justify-content:center;
                                min-height:38px;
                                padding:0 13px;
                                border-radius:8px;
                                border:1px solid #22c9f6;
                                background:linear-gradient(180deg,#0aaee0,#087fae);
                                color:white;
                                font-size:10px;
                                font-weight:900;
                                cursor:pointer;
                            "
                        >
                            📷 Escolher foto
                        </label>

                        <input
                            id="btOwnPhotoFile"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onchange="previewOwnProfilePhoto(event)"
                            style="display:none;"
                        >

                        <div
                            id="btOwnPhotoStatus"
                            style="
                                margin-top:7px;
                                color:#7f96a9;
                                font-size:9px;
                                line-height:1.35;
                            "
                        >
                            JPG, PNG ou WEBP. Máximo 5 MB.
                        </div>
                    </div>
                </div>
            </div>

            <div class="bt-field">
                <label>Nome profissional</label>
                <input
                    id="btOwnProfessionalName"
                    value="${escapeHtml(profile.professional_name || "")}"
                    placeholder="Ex.: Rocha Refrigeração"
                >
            </div>

            <div class="bt-field">
                <label>Apresentação</label>
                <textarea
                    id="btOwnBio"
                    placeholder="Conte sua experiência e o tipo de serviço que realiza..."
                >${escapeHtml(profile.bio || "")}</textarea>
            </div>

            <div class="bt-field">
                <label>Disponibilidade</label>
                <select id="btOwnAvailability">
                    <option value="true" ${isAvailable ? "selected" : ""}>
                        🟢 Disponível agora
                    </option>
                    <option value="false" ${!isAvailable ? "selected" : ""}>
                        ⚪ Indisponível no momento
                    </option>
                </select>
            </div>

            <div class="bt-field">
                <label>Como quero aparecer no BoraTec</label>

                <label class="bt-specialty-option" style="margin-top:8px;">
                    <input
                        type="checkbox"
                        id="btRoleProfessional"
                        ${(!Array.isArray(profile.roles) || profile.roles.includes("professional")) ? "checked" : ""}
                    >
                    <span>👨‍🔧 Profissional / Técnico</span>
                </label>

                <label class="bt-specialty-option" style="margin-top:8px;">
                    <input
                        type="checkbox"
                        id="btRoleHelper"
                        ${(Array.isArray(profile.roles) && profile.roles.includes("helper")) ? "checked" : ""}
                    >
                    <span>👷 Ajudante</span>
                </label>
            </div>

            <div class="bt-field">
                <label>Especialidades</label>
                <div class="bt-specialty-grid">
                    ${btSpecialtyCheckboxes(specialties)}
                </div>
            </div>

            <button
                class="bt-primary"
                type="button"
                onclick="saveOwnProfessionalProfile()"
            >
                Salvar meu perfil
            </button>
            `
            :
            ""
        }
    `;
}

async function chatFromPublicProfile(
    professionalName
){

    const interestId =
        btProfileConversationInterestId;

    if(!interestId){

        showToast(
            "Conversa não encontrada"
        );

        return;
    }

    closePublicProfile();

    await openInterestConversation(
        interestId,
        professionalName
        ||
        "Profissional"
    );
}


async function saveOwnProfessionalProfile(){

    if(
        !boraUser
        ||
        btCurrentProfileId !== boraUser.id
    ){
        return;
    }

    const professionalName =
        document
        .getElementById("btOwnProfessionalName")
        .value
        .trim();

    const bio =
        document
        .getElementById("btOwnBio")
        .value
        .trim();

    const isAvailable =
        document
        .getElementById("btOwnAvailability")
        .value === "true";

    const specialties =
        Array
        .from(
            document.querySelectorAll(
                ".btOwnSpecialtyCheck:checked"
            )
        )
        .map(input => input.value);

    const roles = [];

    if(
        document
        .getElementById("btRoleProfessional")
        ?.checked
    ){
        roles.push("professional");
    }

    if(
        document
        .getElementById("btRoleHelper")
        ?.checked
    ){
        roles.push("helper");
    }

    if(roles.length === 0){
        showToast("Marque Profissional/Técnico ou Ajudante");
        return;
    }

    if(!professionalName){

        showToast(
            "Informe seu nome profissional"
        );

        return;
    }

    try{

        const photoUrl =
            await uploadOwnProfilePhoto();

        const {
            error
        } =
        await boraSupabase
        .from("profiles")
        .update({
            professional_name:
                professionalName,
            bio:
                bio || null,
            specialties,
            roles,
            is_available:
                isAvailable,
            photo_url:
                photoUrl,
            updated_at:
                new Date().toISOString()
        })
        .eq("id", boraUser.id);

        if(error){
            throw error;
        }

        btPendingProfilePhoto = null;

        await loadBoraTecProfile();
        updateBoraTecUserInterface();
        await loadOpportunities();

        showToast(
            "✅ Perfil profissional atualizado"
        );

        await openPublicProfile(
            boraUser.id
        );

    }catch(error){

        console.error(
            "Erro salvar perfil:",
            error
        );

        showToast(
            "Não foi possível salvar o perfil"
        );
    }
}


window.previewOwnProfilePhoto =
    previewOwnProfilePhoto;

/* =========================================================
   INTERESSADOS / COMPARAÇÃO
========================================================= */

async function openInterestedProfessionals(opportunityId){

    if(!opportunityId){
        return;
    }

    const overlay =
        document
        .getElementById("btInterestedOverlay");

    const body =
        document
        .getElementById("btInterestedBody");

    overlay.classList.add("show");

    body.innerHTML =
        `<div class="bt-empty">Carregando interessados...</div>`;

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .rpc(
            "get_opportunity_interests",
            {
                p_opportunity_id:
                    opportunityId
            }
        );

        if(error){
            throw error;
        }

        if(
            !data
            ||
            data.length === 0
        ){

            body.innerHTML = `
                <div class="bt-empty">
                    👥<br><br>
                    Ainda não há profissionais interessados nesta oportunidade.
                </div>
            `;

            return;
        }

        body.innerHTML =
            data
            .map((item,index) => {

                const ratings =
                    Number(item.ratings_count || 0);

                const reputation =
                    Number(item.reputation || 0);

                const repText =
                    ratings > 0
                    ?
                    `⭐ ${reputation.toFixed(1)} • ${Number(item.completed_jobs || 0)} serviços • ${Number(item.recommend_percent || 0).toFixed(0)}% recomendam`
                    :
                    `NOVO • ${Number(item.completed_jobs || 0)} serviços`;

                const specialties =
                    Array.isArray(item.specialties)
                    &&
                    item.specialties.length
                    ?
                    item.specialties.join(" • ")
                    :
                    "Especialidades não informadas";

                return `
                <div class="bt-interested-card">

                    <div
                        style="
                            color:#ff9430;
                            font-size:9px;
                            font-weight:900;
                            margin-bottom:5px;
                        "
                    >
                        #${index + 1} NA COMPARAÇÃO
                    </div>

                    <div class="bt-interested-name">
                        ${escapeHtml(item.professional_name || "Profissional")}
                    </div>

                    <div class="bt-interested-meta">
                        ${escapeHtml(repText)}<br>
                        🔧 ${escapeHtml(specialties)}
                    </div>

                    <div class="bt-interested-actions">

                        <button
                            class="bt-secondary"
                            type="button"
                            onclick="openInterestedProfile(
                                '${item.professional_id}',
                                '${item.interest_id}'
                            )"
                        >
                            Ver perfil
                        </button>

                        <button
                            class="bt-primary"
                            type="button"
                            onclick="openInterestConversation('${item.interest_id}','${escapeJs(item.professional_name || "Profissional")}')"
                        >
                            💬 Conversar
                        </button>

                    </div>

                </div>
                `;
            })
            .join("");

    }catch(error){

        console.error(
            "Erro interessados:",
            error
        );

        body.innerHTML =
            `<div class="bt-empty">Não foi possível carregar os interessados.</div>`;
    }
}

function openInterestedProfile(
    profileId,
    interestId
){

    btProfileConversationInterestId =
        interestId
        ||
        null;

    window.__btOpeningInterestedProfile =
        true;

    const interestedOverlay =
        document.getElementById(
            "btInterestedOverlay"
        );

    if(interestedOverlay){
        interestedOverlay.classList.remove("show");
        interestedOverlay.style.display = "none";
    }

    // Garante uma troca limpa de tela também em navegadores móveis.
    requestAnimationFrame(
        () => {

            if(interestedOverlay){
                interestedOverlay.style.display = "";
            }

            openPublicProfile(
                profileId
            );
        }
    );
}

function closeInterestedProfessionals(){
    document
    .getElementById("btInterestedOverlay")
    ?.classList.remove("show");
}

async function openInterestConversation(
    interestId,
    professionalName
){

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from("conversations")
        .select(`
            id,
            opportunity_id,
            interest_id
        `)
        .eq("interest_id", interestId)
        .maybeSingle();

        if(error){
            throw error;
        }

        if(!data?.id){
            showToast(
                "Conversa ainda não encontrada"
            );
            return;
        }

        closeInterestedProfessionals();

        openChat(
            data.id,
            professionalName || "Conversa"
        );

    }catch(error){

        console.error(
            "Erro abrir conversa do interessado:",
            error
        );

        showToast(
            "Não foi possível abrir a conversa"
        );
    }
}


/* =========================================================
   NOTIFICAÇÕES
========================================================= */

async function openNotifications(){

    document
    .getElementById("btNotificationsOverlay")
    .classList.add("show");

    await loadNotifications();
}

function closeNotifications(){
    document
    .getElementById("btNotificationsOverlay")
    ?.classList.remove("show");
}

async function loadNotifications(){

    const body =
        document
        .getElementById("btNotificationsBody");

    if(!body){
        return;
    }

    body.innerHTML =
        `<div class="bt-empty">Carregando notificações...</div>`;

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from("notifications")
        .select(`
            id,
            type,
            title,
            body,
            entity_type,
            entity_id,
            is_read,
            created_at
        `)
        .order(
            "created_at",
            { ascending:false }
        )
        .limit(50);

        if(error){
            throw error;
        }

        if(
            !data
            ||
            data.length === 0
        ){

            body.innerHTML = `
                <div class="bt-empty">
                    🔔<br><br>
                    Você ainda não possui notificações.
                </div>
            `;

            await refreshNotificationBadge();
            return;
        }

        body.innerHTML =
            data
            .map(item => `

                <div
                    class="
                        bt-notification-card
                        ${item.is_read ? "" : "unread"}
                    "
                    onclick="openNotificationItem(
                        '${item.id}',
                        '${escapeJs(item.entity_type || "")}',
                        '${item.entity_id || ""}'
                    )"
                    style="cursor:pointer;"
                >

                    <div class="bt-notification-title">
                        ${escapeHtml(item.title || "Notificação")}
                    </div>

                    <div class="bt-notification-body">
                        ${escapeHtml(item.body || "")}
                    </div>

                    <div class="bt-notification-time">
                        ${escapeHtml(timeAgo(item.created_at))}
                    </div>

                </div>

            `)
            .join("");

        await refreshNotificationBadge();

    }catch(error){

        console.error(
            "Erro notificações:",
            error
        );

        body.innerHTML =
            `<div class="bt-empty">Não foi possível carregar as notificações.</div>`;
    }
}

async function refreshNotificationBadge(){

    if(!boraSupabase || !boraUser){
        return;
    }

    try{

        const {
            count,
            error
        } =
        await boraSupabase
        .from("notifications")
        .select(
            "id",
            {
                count:"exact",
                head:true
            }
        )
        .eq("is_read",false);

        if(error){
            throw error;
        }

        const badge =
            document
            .getElementById("btNotificationBadge");

        if(!badge){
            return;
        }

        const total =
            Number(count || 0);

        badge.textContent =
            total > 99
            ? "99+"
            : String(total);

        badge.style.display =
            total > 0
            ? "flex"
            : "none";

    }catch(error){

        console.warn(
            "Contador notificações:",
            error
        );
    }
}

async function markAllNotificationsRead(){

    try{

        const {
            error
        } =
        await boraSupabase
        .rpc("read_all_notifications");

        if(error){
            throw error;
        }

        await loadNotifications();

    }catch(error){

        console.error(
            "Erro marcar notificações:",
            error
        );

        showToast(
            "Não foi possível atualizar notificações"
        );
    }
}

async function clearAllNotifications(){

    if(!boraSupabase || !boraUser){
        return;
    }

    const confirmed =
        window.confirm(
            "Apagar definitivamente todas as suas notificações?"
        );

    if(!confirmed){
        return;
    }

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .rpc("clear_all_notifications");

        if(error){
            throw error;
        }

        await loadNotifications();
        await refreshNotificationBadge();

        showToast(
            Number(data || 0) > 0
            ? "Notificações apagadas"
            : "Nenhuma notificação para apagar"
        );

    }catch(error){

        console.error(
            "Erro limpar notificações:",
            error
        );

        showToast(
            "Não foi possível limpar as notificações"
        );
    }
}


async function openNotificationItem(
    notificationId,
    entityType,
    entityId
){

    try{

        await boraSupabase
        .rpc(
            "read_notification",
            {
                p_notification_id:
                    notificationId
            }
        );

    }catch(error){

        console.warn(
            "Falha marcar notificação:",
            error
        );
    }

    closeNotifications();

    await refreshNotificationBadge();

    if(
        entityType === "conversation"
        &&
        entityId
    ){
        openChat(
            entityId,
            "Conversa BoraTec"
        );
        return;
    }

    if(
        entityType === "job"
        &&
        entityId
    ){
        openMyJobs();
        return;
    }

    if(
        entityType === "opportunity"
        &&
        entityId
    ){
        openInterestedProfessionals(
            entityId
        );
        return;
    }
}

function listenNotificationsRealtime(){

    if(
        !boraSupabase
        ||
        !boraUser
    ){
        return;
    }

    if(btNotificationsChannel){

        boraSupabase
        .removeChannel(
            btNotificationsChannel
        );
    }

    btNotificationsChannel =
        boraSupabase
        .channel(
            `boratec-notifications-${boraUser.id}`
        )
        .on(
            "postgres_changes",
            {
                event:"INSERT",
                schema:"public",
                table:"notifications",
                filter:
                    `user_id=eq.${boraUser.id}`
            },
            async payload => {

                showToast(
                    `🔔 ${payload.new?.title || "Nova notificação"}`
                );

                await refreshNotificationBadge();

                const overlay =
                    document
                    .getElementById(
                        "btNotificationsOverlay"
                    );

                if(
                    overlay
                    ?.classList
                    .contains("show")
                ){
                    await loadNotifications();
                }
            }
        )
        .subscribe();
}


/* =========================================================
   CANCELAR / REMOVER PUBLICAÇÃO
   Não apaga o histórico do banco: muda para "cancelled".
========================================================= */

async function cancelOpportunity(
    opportunityId
){

    if(
        !opportunityId
        ||
        !boraUser
        ||
        !boraSupabase
    ){
        return;
    }

    const confirmed =
        window.confirm(
            "Cancelar esta publicação? Ela vai sair do feed."
        );

    if(!confirmed){
        return;
    }

    try{

        const {
            error
        } =
        await boraSupabase
        .from("opportunities")
        .update({
            status:"cancelled",
            updated_at:
                new Date()
                .toISOString()
        })
        .eq(
            "id",
            opportunityId
        )
        .eq(
            "author_id",
            boraUser.id
        )
        .in(
            "status",
            ["open","negotiating"]
        );

        if(error){
            throw error;
        }

        showToast(
            "🗑 Publicação cancelada"
        );

        await loadOpportunities();

    }catch(error){

        console.error(
            "Erro ao cancelar publicação:",
            error
        );

        showToast(
            "Não foi possível cancelar a publicação"
        );
    }
}


window.cancelOpportunity =
    cancelOpportunity;


/* =========================================================
   ATALHO: SOU AJUDANTE / ESTOU DISPONÍVEL
========================================================= */

function setupHelperAvailabilityPublishOption(){

    const options =
        document.getElementById(
            "publishOptions"
        );

    if(!options){
        return;
    }

    const buttons =
        Array.from(
            options.querySelectorAll(
                ".publish-option"
            )
        );

    const oldAvailableButton =
        buttons.find(button => {

            const onclick =
                button.getAttribute(
                    "onclick"
                )
                ||
                "";

            return onclick.includes(
                "available"
            )
            ||
            button.getAttribute(
                "data-bt-helper-toggle"
            )
            ===
            "true";
        })
        ||
        buttons[2];

    if(!oldAvailableButton){
        return;
    }

    oldAvailableButton.removeAttribute(
        "data-bt-helper-toggle"
    );

    oldAvailableButton.setAttribute(
        "onclick",
        "selectPublishType('technician_available')"
    );

    const icon =
        oldAvailableButton
        .querySelector(
            ".option-icon"
        );

    const strong =
        oldAvailableButton
        .querySelector(
            "strong"
        );

    const span =
        oldAvailableButton
        .querySelector(
            "span"
        );

    if(icon){
        icon.textContent =
            "👨‍🔧";
    }

    if(strong){
        strong.textContent =
            "Sou profissional / Estou disponível";
    }

    if(span){
        span.textContent =
            "Publique onde e quando você está disponível para trabalhar";
    }

    if(
        !document.getElementById(
            "btHelperAvailablePublishOption"
        )
    ){

        const helperButton =
            document.createElement(
                "button"
            );

        helperButton.type =
            "button";

        helperButton.id =
            "btHelperAvailablePublishOption";

        helperButton.className =
            "publish-option";

        helperButton.setAttribute(
            "onclick",
            "selectPublishType('helper_available')"
        );

        helperButton.innerHTML = `
            <div class="option-icon">
                👷
            </div>

            <div>
                <strong>
                    Sou ajudante / Estou disponível
                </strong>

                <span>
                    Publique onde e quando você pode trabalhar como ajudante
                </span>
            </div>
        `;

        options.appendChild(
            helperButton
        );
    }
}


async function activateHelperAvailability(){

    if(
        !boraUser
        ||
        !boraSupabase
    ){
        showToast(
            "Usuário ainda não carregado"
        );
        return;
    }

    try{

        const currentRoles =
            Array.isArray(
                boraProfile?.roles
            )
            ?
            [...boraProfile.roles]
            :
            ["professional"];

        if(
            !currentRoles.includes(
                "helper"
            )
        ){
            currentRoles.push(
                "helper"
            );
        }

        const {
            error
        } =
        await boraSupabase
        .from("profiles")
        .update({
            roles:
                currentRoles,
            is_available:
                true,
            updated_at:
                new Date()
                .toISOString()
        })
        .eq(
            "id",
            boraUser.id
        );

        if(error){
            throw error;
        }

        await loadBoraTecProfile();

        updateBoraTecUserInterface();

        setupHelperAvailabilityPublishOption();

        closePublish();

        showToast(
            "✅ Você está disponível como ajudante"
        );

        await openPeopleDirectory();

    }catch(error){

        console.error(
            "Erro ao ativar ajudante:",
            error
        );

        showToast(
            "Não foi possível ativar sua disponibilidade"
        );
    }
}


window.activateHelperAvailability =
    activateHelperAvailability;


async function deactivateHelperAvailability(){

    if(
        !boraUser
        ||
        !boraSupabase
    ){
        return;
    }

    const confirmed =
        window.confirm(
            "Parar de aparecer como disponível?"
        );

    if(!confirmed){
        return;
    }

    try{

        const {
            error
        } =
        await boraSupabase
        .from("profiles")
        .update({
            is_available:false,
            updated_at:
                new Date()
                .toISOString()
        })
        .eq(
            "id",
            boraUser.id
        );

        if(error){
            throw error;
        }

        await loadBoraTecProfile();

        updateBoraTecUserInterface();

        setupHelperAvailabilityPublishOption();

        closePublish();

        showToast(
            "⚪ Você saiu dos disponíveis"
        );

        await loadOpportunities();

    }catch(error){

        console.error(
            "Erro ao desativar disponibilidade:",
            error
        );

        showToast(
            "Não foi possível alterar sua disponibilidade"
        );
    }
}


window.deactivateHelperAvailability =
    deactivateHelperAvailability;





/* =========================================================
   BORATEC V1.4
   ABAS:
   TODOS | SERVIÇOS | PROFISSIONAIS
========================================================= */

let btMainTab =
    "all";


function setupV14MainTabs(){

    const tabs =
        document.querySelector(
            ".tabs"
        );

    if(!tabs){
        return;
    }

    tabs.innerHTML = `
        <button
            class="tab active"
            data-filter="all"
            onclick="changeFilter('all',this)"
        >
            Todos
        </button>

        <button
            class="tab"
            data-filter="services"
            onclick="changeFilter('services',this)"
        >
            Serviços
        </button>

        <button
            class="tab"
            data-filter="professionals"
            onclick="changeFilter('professionals',this)"
        >
            Profissionais
        </button>
    `;
}


function btApplyMainTabFilter(
    list
){

    const source =
        Array.isArray(list)
        ? list
        : [];

    if(
        btMainTab ===
        "services"
    ){
        return source.filter(
            post =>
                post.databaseType ===
                "service"
                ||
                post.databaseType ===
                "helper"
        );
    }

    if(
        btMainTab ===
        "professionals"
    ){
        return source.filter(
            post =>
                post.databaseType ===
                "technician_available"
                ||
                post.databaseType ===
                "helper_available"
        );
    }

    return source;
}


function btUpdateFeedHeaderForMainTab(){

    const title =
        document.querySelector(
            ".feed-header h2"
        );

    const subtitle =
        document.querySelector(
            ".feed-header p"
        );

    if(btMainTab === "services"){

        if(title){
            title.textContent =
                "Serviços disponíveis";
        }

        if(subtitle){
            subtitle.textContent =
                "Serviços e pedidos de ajudante publicados na rede";
        }

        return;
    }

    if(
        btMainTab ===
        "professionals"
    ){

        if(title){
            title.textContent =
                "Profissionais disponíveis";
        }

        if(subtitle){
            subtitle.textContent =
                "Técnicos e ajudantes que publicaram disponibilidade";
        }

        return;
    }

    if(title){
        title.textContent =
            "Oportunidades agora";
    }

    if(subtitle){
        subtitle.textContent =
            "Todas as publicações recentes da rede";
    }
}


/* =========================================================
   DATA / HORA DA DISPONIBILIDADE
========================================================= */

function setupAvailabilityDateTimeField(){

    if(
        document.getElementById(
            "btAvailabilityDateTimeField"
        )
    ){
        return;
    }

    const dateSelect =
        document.getElementById(
            "postDate"
        );

    if(!dateSelect){
        return;
    }

    const originalField =
        dateSelect.closest(
            ".field"
        );

    if(!originalField){
        return;
    }

    const field =
        document.createElement(
            "div"
        );

    field.id =
        "btAvailabilityDateTimeField";

    field.className =
        "field";

    field.style.display =
        "none";

    field.innerHTML = `
        <label>
            DIA E HORÁRIO DISPONÍVEL
        </label>

        <input
            id="btAvailabilityDateTime"
            class="input"
            type="datetime-local"
        >
    `;

    originalField.insertAdjacentElement(
        "afterend",
        field
    );
}


function btIsAvailabilityType(
    type
){

    return (
        type ===
        "technician_available"
        ||
        type ===
        "helper_available"
        ||
        type ===
        "available"
    );
}


const btOriginalSelectPublishType =
    window.selectPublishType;


window.selectPublishType =
function(type){

    const normalizedType =
        type === "available"
        ? "technician_available"
        : type;

    if(
        typeof btOriginalSelectPublishType
        ===
        "function"
    ){
        btOriginalSelectPublishType(
            normalizedType
        );
    }

    const hiddenType =
        document.getElementById(
            "postType"
        );

    if(hiddenType){
        hiddenType.value =
            normalizedType;
    }

    setupAvailabilityDateTimeField();

    const isAvailability =
        btIsAvailabilityType(
            normalizedType
        );

    const normalDate =
        document
        .getElementById(
            "postDate"
        )
        ?.closest(
            ".field"
        );

    const availabilityField =
        document.getElementById(
            "btAvailabilityDateTimeField"
        );

    if(normalDate){
        normalDate.style.display =
            isAvailability
            ? "none"
            : "";
    }

    if(availabilityField){
        availabilityField.style.display =
            isAvailability
            ? ""
            : "none";
    }

    const titleInput =
        document.getElementById(
            "postTitle"
        );

    const description =
        document.getElementById(
            "postDescription"
        );

    const sheetSmall =
        document.getElementById(
            "sheetSmall"
        );

    const sheetTitle =
        document.getElementById(
            "sheetTitle"
        );

    if(
        normalizedType ===
        "helper_available"
    ){

        if(sheetSmall){
            sheetSmall.textContent =
                "SOU AJUDANTE";
        }

        if(sheetTitle){
            sheetTitle.textContent =
                "Publique sua disponibilidade";
        }

        if(titleInput){
            titleInput.placeholder =
                "Ex.: Ajudante de refrigeração disponível";
        }

        if(description){
            description.placeholder =
                "Ex.: Posso ajudar em instalação, manutenção e limpeza.";
        }

        return;
    }

    if(
        normalizedType ===
        "technician_available"
    ){

        if(sheetSmall){
            sheetSmall.textContent =
                "SOU PROFISSIONAL";
        }

        if(sheetTitle){
            sheetTitle.textContent =
                "Publique sua disponibilidade";
        }

        if(titleInput){
            titleInput.placeholder =
                "Ex.: Técnico de refrigeração disponível";
        }

        if(description){
            description.placeholder =
                "Ex.: Disponível para instalações e manutenção.";
        }

        return;
    }

    if(titleInput){
        titleInput.placeholder =
            "Ex.: Instalação de split 12.000 BTUs";
    }
};


/* =========================================================
   PUBLICAÇÃO V1.4
   disponibilidade agora é uma publicação real
========================================================= */

publishPost =
async function(event){

    event.preventDefault();

    if(!boraUser){
        showToast(
            "Usuário não carregado"
        );
        return;
    }

    const button =
        event.target
        .querySelector(
            ".submit"
        );

    const oldText =
        button?.textContent
        ||
        "Publicar";

    if(button){
        button.disabled =
            true;

        button.textContent =
            "Publicando...";
    }

    try{

        const uiType =
            document
            .getElementById(
                "postType"
            )
            .value;

        const title =
            document
            .getElementById(
                "postTitle"
            )
            .value
            .trim();

        const location =
            document
            .getElementById(
                "postLocation"
            )
            .value
            .trim();

        const category =
            document
            .getElementById(
                "postCategory"
            )
            .value;

        const description =
            document
            .getElementById(
                "postDescription"
            )
            .value
            .trim();

        const priceText =
            document
            .getElementById(
                "postPrice"
            )
            .value
            .replace(
                ",",
                "."
            )
            .trim();

        if(
            !title
            ||
            !location
            ||
            !description
        ){
            showToast(
                "Preencha os campos"
            );
            return;
        }

        const phoneRegex =
            /(?:\(?\d{2}\)?[\s-]?)?(?:9[\s-]?)?\d{4}[\s-]?\d{4}/;

        if(
            phoneRegex.test(
                description
            )
        ){
            showToast(
                "Não coloque telefone na publicação"
            );
            return;
        }

        const isAvailability =
            btIsAvailabilityType(
                uiType
            );

        let serviceDate =
            null;

        let urgency =
            false;

        if(isAvailability){

            const dateTimeValue =
                document
                .getElementById(
                    "btAvailabilityDateTime"
                )
                ?.value
                ||
                "";

            if(!dateTimeValue){

                showToast(
                    "Informe o dia e horário em que estará disponível"
                );

                return;
            }

            const parsed =
                new Date(
                    dateTimeValue
                );

            if(
                Number.isNaN(
                    parsed.getTime()
                )
            ){
                showToast(
                    "Data ou horário inválido"
                );

                return;
            }

            serviceDate =
                parsed.toISOString();

        }else{

            const dateOption =
                document
                .getElementById(
                    "postDate"
                )
                .value;

            serviceDate =
                convertDateOption(
                    dateOption
                );

            urgency =
                dateOption ===
                "Agora";
        }

        let value =
            null;

        if(priceText){

            const parsedValue =
                Number(
                    priceText
                );

            if(
                !Number.isNaN(
                    parsedValue
                )
            ){
                value =
                    parsedValue;
            }
        }

        const databaseType =
            uiType === "available"
            ? "technician_available"
            : uiType;

        const {
            error
        } =
        await boraSupabase
        .from("opportunities")
        .insert({

            author_id:
                boraUser.id,

            type:
                databaseType,

            title,

            description,

            category,

            state:
                boraProfile?.state
                ||
                "RJ",

            city:
                location,

            neighborhood:
                null,

            service_date:
                serviceDate,

            value,

            value_negotiable:
                value === null,

            urgency,

            status:
                "open"
        });

        if(error){
            throw error;
        }

        document
        .getElementById(
            "publishForm"
        )
        .reset();

        closePublish();

        btMainTab =
            databaseType ===
            "technician_available"
            ||
            databaseType ===
            "helper_available"
            ? "professionals"
            : "all";

        setupV14MainTabs();

        document
        .querySelectorAll(
            ".tab"
        )
        .forEach(
            tab =>
                tab.classList.toggle(
                    "active",
                    tab.dataset.filter
                    ===
                    btMainTab
                )
        );

        btUpdateFeedHeaderForMainTab();

        await loadOpportunities();

        showToast(
            isAvailability
            ? "✅ Disponibilidade publicada"
            : "✅ Publicação criada"
        );

    }catch(error){

        console.error(
            "Erro ao publicar:",
            error
        );

        showToast(
            "Erro ao publicar"
        );

    }finally{

        if(button){
            button.disabled =
                false;

            button.textContent =
                oldText;
        }
    }
};


window.publishPost =
    publishPost;


/* =========================================================
   DIRETÓRIO DE DISPONÍVEIS
   - mostra profissionais e ajudantes juntos
   - só entra quem estiver is_available = true
========================================================= */

function btSetFeedHeaderForDirectory(){

    const title =
        document.querySelector(".feed-header h2");

    const subtitle =
        document.querySelector(".feed-header p");

    if(title){
        title.textContent =
            "Disponíveis agora";
    }

    if(subtitle){
        subtitle.textContent =
            "Profissionais e ajudantes disponíveis para novas oportunidades";
    }
}


function btRestoreFeedHeader(){

    const title =
        document.querySelector(".feed-header h2");

    const subtitle =
        document.querySelector(".feed-header p");

    if(title){
        title.textContent =
            "Oportunidades agora";
    }

    if(subtitle){
        subtitle.textContent =
            "Publicações recentes da rede";
    }
}


function btSetDirectoryTabActive(filter){

    document
    .querySelectorAll(".tab")
    .forEach(tab => {

        const tabFilter =
            tab.getAttribute("data-filter");

        tab.classList.toggle(
            "active",
            tabFilter === filter
        );
    });
}


function btPersonRolesLabel(roles){

    const list =
        Array.isArray(roles)
        ? roles
        : [];

    const isProfessional =
        list.includes("professional");

    const isHelper =
        list.includes("helper");

    if(
        isProfessional
        &&
        isHelper
    ){
        return "👨‍🔧 Profissional • 👷 Ajudante";
    }

    if(isHelper){
        return "👷 Ajudante";
    }

    return "👨‍🔧 Profissional";
}


async function openPeopleDirectory(){

    btDirectoryMode =
        "available";

    btSetDirectoryTabActive(
        "available_directory"
    );

    btSetFeedHeaderForDirectory();

    const feed =
        document.getElementById("feed");

    const count =
        document.getElementById("feedCount");

    if(!feed){
        return;
    }

    feed.innerHTML =
        `<div class="bt-directory-empty">Carregando disponíveis...</div>`;

    if(count){
        count.textContent = "carregando";
    }

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .rpc(
            "get_available_people"
        );

        if(error){
            throw error;
        }

        const people =
            Array.isArray(data)
            ? data
            : [];

        if(count){
            count.textContent =
                `${people.length} ${
                    people.length === 1
                    ? "disponível"
                    : "disponíveis"
                }`;
        }

        if(people.length === 0){

            feed.innerHTML =
                `<div class="bt-directory-empty">
                    Nenhum profissional ou ajudante disponível agora.
                </div>`;

            return;
        }

        feed.innerHTML =
            people
            .map(person => {

                const name =
                    person.professional_name
                    ||
                    person.name
                    ||
                    "Profissional BoraTec";

                const avatar =
                    person.photo_url
                    ?
                    `<img src="${escapeHtml(person.photo_url)}" alt="Perfil">`
                    :
                    escapeHtml(
                        getInitials(name)
                    );

                const ratingsCount =
                    Number(
                        person.ratings_count
                        ||
                        0
                    );

                const reputation =
                    ratingsCount > 0
                    ?
                    `⭐ ${Number(person.reputation || 0).toFixed(1)}`
                    :
                    "NOVO";

                const completed =
                    Number(
                        person.completed_jobs
                        ||
                        0
                    );

                const recommend =
                    ratingsCount > 0
                    ?
                    `${Number(person.recommend_percent || 0).toFixed(0)}% recomendam`
                    :
                    "sem avaliações";

                const specialties =
                    Array.isArray(person.specialties)
                    &&
                    person.specialties.length
                    ?
                    person.specialties
                    .slice(0,4)
                    .join(" • ")
                    :
                    "Especialidades não informadas";

                const rolesLabel =
                    btPersonRolesLabel(
                        person.roles
                    );

                return `
                    <div class="bt-directory-card">

                        <div class="bt-directory-top">

                            <div class="bt-directory-avatar">
                                ${avatar}
                            </div>

                            <div>
                                <div class="bt-directory-name">
                                    ${escapeHtml(name)}
                                </div>

                                <div class="bt-directory-meta">
                                    ${escapeHtml(rolesLabel)}<br>
                                    🟢 Disponível agora<br>
                                    ${escapeHtml(reputation)}
                                    • ${completed} serviços
                                    • ${escapeHtml(recommend)}
                                </div>
                            </div>

                        </div>

                        <div class="bt-directory-specialties">
                            🔧 ${escapeHtml(specialties)}
                        </div>

                        <div class="bt-directory-actions">

                            <button
                                class="bt-secondary"
                                type="button"
                                onclick="openPublicProfile('${person.id}')"
                            >
                                Ver perfil
                            </button>

                        </div>

                    </div>
                `;
            })
            .join("");

    }catch(error){

        console.error(
            "Erro ao carregar disponíveis:",
            error
        );

        feed.innerHTML =
            `<div class="bt-directory-empty">
                Não foi possível carregar os disponíveis agora.
            </div>`;

        if(count){
            count.textContent = "erro";
        }
    }
}


function closePeopleDirectory(){

    btDirectoryMode = null;

    btRestoreFeedHeader();

    loadOpportunities();
}


const btOriginalChangeFilter =
    window.changeFilter
    ||
    changeFilter;

changeFilter =
function(filter,button){

    if(
        filter === "available_directory"
    ){
        openPeopleDirectory();
        return;
    }

    btDirectoryMode = null;

    btRestoreFeedHeader();

    return btOriginalChangeFilter(
        filter,
        button
    );
};

window.changeFilter =
    changeFilter;

window.openPeopleDirectory =
    openPeopleDirectory;


/* =========================================================
   NAVEGAÇÃO DAS 3 ABAS V1.4
========================================================= */

changeFilter =
function(filter,button){

    const normalized =
        String(filter || "")
        .trim()
        .toLowerCase();

    if(
        normalized ===
        "services"
        ||
        normalized ===
        "service"
    ){
        btMainTab =
            "services";
    }
    else if(
        normalized ===
        "professionals"
        ||
        normalized ===
        "available"
        ||
        normalized ===
        "available_directory"
    ){
        btMainTab =
            "professionals";
    }
    else{
        btMainTab =
            "all";
    }

    document
    .querySelectorAll(
        ".tab"
    )
    .forEach(
        tab =>
            tab.classList.remove(
                "active"
            )
    );

    if(button){
        button.classList.add(
            "active"
        );
    }
    else{
        document
        .querySelector(
            `[data-filter="${btMainTab}"]`
        )
        ?.classList
        .add(
            "active"
        );
    }

    if(
        typeof currentFilter
        !==
        "undefined"
    ){
        currentFilter =
            "all";
    }

    applyCurrentFeedFilters();
};


window.changeFilter =
    changeFilter;


/* =========================================================
   EXCLUIR CONVERSA PARA MIM
========================================================= */

function setupBoraTecDeleteStyles(){

    if(
        document.getElementById(
            "btDeleteActionsStyle"
        )
    ){
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "btDeleteActionsStyle";

    style.textContent = `
        .bt-conv-row{
            display:flex;
            align-items:stretch;
            gap:7px;
            margin-bottom:8px;
        }

        .bt-conv-row .bt-conv-card{
            flex:1;
            margin:0;
        }

        .bt-conv-delete{
            width:46px;
            flex:0 0 46px;
            border-radius:13px;
            border:1px solid rgba(255,76,91,.20);
            background:rgba(255,76,91,.10);
            color:#ff7b86;
            cursor:pointer;
            font-size:16px;
        }
    `;

    document.head.appendChild(
        style
    );
}


async function hideConversationForMe(
    conversationId
){

    if(
        !conversationId
        ||
        !boraUser
        ||
        !boraSupabase
    ){
        return;
    }

    const confirmed =
        window.confirm(
            "Excluir esta conversa da sua lista? A outra pessoa continuará com o histórico dela."
        );

    if(!confirmed){
        return;
    }

    try{

        const {
            error
        } =
        await boraSupabase
        .from("conversation_members")
        .update({
            hidden_at:
                new Date()
                .toISOString()
        })
        .eq(
            "conversation_id",
            conversationId
        )
        .eq(
            "user_id",
            boraUser.id
        );

        if(error){
            throw error;
        }

        if(
            currentConversationId
            ===
            conversationId
        ){
            closeChat();
        }

        showToast(
            "🗑 Conversa removida"
        );

        await loadConversations();

    }catch(error){

        console.error(
            "Erro ao excluir conversa:",
            error
        );

        showToast(
            "Não foi possível excluir a conversa"
        );
    }
}


loadConversations =
async function(){

    const list =
        document.getElementById(
            "boratecConversationList"
        );

    if(!list){
        return;
    }

    list.innerHTML = `
        <div class="bt-conv-empty">
            Carregando mensagens...
        </div>
    `;

    try{

        const {
            data:memberships,
            error:membershipsError
        } =
        await boraSupabase
        .from("conversation_members")
        .select(`
            conversation_id,
            hidden_at
        `)
        .eq(
            "user_id",
            boraUser.id
        )
        .is(
            "hidden_at",
            null
        );

        if(membershipsError){
            throw membershipsError;
        }

        const ids =
            (memberships || [])
            .map(
                item =>
                    item.conversation_id
            );

        if(ids.length === 0){

            list.innerHTML = `
                <div class="bt-conv-empty">
                    💬<br><br>
                    Você ainda não possui
                    conversas no BoraTec.
                </div>
            `;

            return;
        }

        const {
            data,
            error
        } =
        await boraSupabase
        .from("conversations")
        .select(`
            id,
            opportunity_id,
            interest_id,
            created_at
        `)
        .in(
            "id",
            ids
        )
        .order(
            "created_at",
            {
                ascending:false
            }
        );

        if(error){
            throw error;
        }

        const conversations = [];

        for(
            const conversation
            of (data || [])
        ){

            const details =
                await getConversationDetails(
                    conversation
                );

            conversations.push(
                details
            );
        }

        if(
            conversations.length === 0
        ){

            list.innerHTML = `
                <div class="bt-conv-empty">
                    💬<br><br>
                    Você ainda não possui
                    conversas no BoraTec.
                </div>
            `;

            return;
        }

        list.innerHTML =
            conversations
            .map(
                conversation => `

                <div class="bt-conv-row">

                    <button
                        class="bt-conv-card"
                        onclick="
                            openChat(
                                '${conversation.id}',
                                '${escapeJs(
                                    conversation.title
                                )}'
                            )
                        "
                    >

                        <strong>
                            ${escapeHtml(
                                conversation.title
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                conversation.otherProfessional
                            )}
                        </small>

                    </button>

                    <button
                        class="bt-conv-delete"
                        type="button"
                        onclick="
                            hideConversationForMe(
                                '${conversation.id}'
                            )
                        "
                        title="Excluir conversa"
                    >
                        🗑
                    </button>

                </div>
                `
            )
            .join("");

    }catch(error){

        console.error(
            "Erro conversas:",
            error
        );

        list.innerHTML = `
            <div class="bt-conv-empty">
                Não foi possível carregar
                suas conversas.
            </div>
        `;
    }
};


window.hideConversationForMe =
    hideConversationForMe;



/* =========================================================
   COMUNIDADE BORATEC V1.5
   CHAT PÚBLICO ENTRE PROFISSIONAIS
========================================================= */

let btCommunityChannel = null;
let btCommunityOpened = false;
let btCommunityReplyTo = null;


function createCommunityInterface(){

    if(
        document.getElementById(
            "btCommunityOverlay"
        )
    ){
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "btCommunityStyle";

    style.textContent = `
        #btCommunityOverlay{
            position:fixed;
            inset:0;
            z-index:7600;
            display:none;
            flex-direction:column;
            background:#06182b;
            color:#fff;
        }

        #btCommunityOverlay.show{
            display:flex;
        }

        .bt-community-head{
            min-height:68px;
            padding:9px 14px;
            display:flex;
            align-items:center;
            gap:10px;
            flex-shrink:0;
            background:#081e34;
            border-bottom:1px solid rgba(255,255,255,.08);
        }

        .bt-community-back{
            width:40px;
            height:40px;
            border:0;
            border-radius:12px;
            background:rgba(255,255,255,.07);
            color:#fff;
            font-size:20px;
            cursor:pointer;
        }

        .bt-community-title{
            flex:1;
            min-width:0;
        }

        .bt-community-title small{
            display:block;
            color:#ff8a1d;
            font-size:9px;
            font-weight:900;
            letter-spacing:.9px;
            margin-bottom:2px;
        }

        .bt-community-title strong{
            display:block;
            font-size:16px;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }

        .bt-community-online{
            font-size:10px;
            color:#8fa7bc;
            margin-top:3px;
        }

        #btCommunityMessages{
            flex:1;
            overflow:auto;
            padding:15px 12px 24px;
            scroll-behavior:smooth;
        }

        .bt-community-empty{
            text-align:center;
            color:#8fa7bc;
            padding:50px 22px;
            line-height:1.55;
            font-size:13px;
        }

        .bt-community-message{
            display:flex;
            gap:9px;
            align-items:flex-start;
            margin-bottom:14px;
        }

        .bt-community-avatar{
            width:38px;
            height:38px;
            flex:0 0 38px;
            border-radius:50%;
            border:1px solid rgba(255,255,255,.09);
            background:#123b60;
            display:flex;
            align-items:center;
            justify-content:center;
            overflow:hidden;
            color:#fff;
            font-size:11px;
            font-weight:900;
            cursor:pointer;
        }

        .bt-community-avatar img{
            width:100%;
            height:100%;
            object-fit:cover;
        }

        .bt-community-bubble{
            min-width:0;
            flex:1;
        }

        .bt-community-meta{
            display:flex;
            align-items:center;
            gap:6px;
            flex-wrap:wrap;
            margin-bottom:4px;
        }

        .bt-community-name{
            border:0;
            padding:0;
            background:none;
            color:#fff;
            font-family:inherit;
            font-size:12px;
            font-weight:900;
            cursor:pointer;
        }

        .bt-community-rep{
            font-size:10px;
            color:#ff9a38;
            font-weight:800;
        }

        .bt-community-time{
            font-size:9px;
            color:#718aa0;
        }

        .bt-community-delete{
            margin-left:auto;
            width:28px;
            height:28px;
            border:0;
            border-radius:8px;
            background:rgba(255,76,91,.10);
            color:#ff7b86;
            cursor:pointer;
            font-size:12px;
        }

        .bt-community-text{
            display:inline-block;
            max-width:100%;
            padding:10px 12px;
            border-radius:4px 14px 14px 14px;
            background:#0d2943;
            border:1px solid rgba(255,255,255,.055);
            color:#eef6ff;
            font-size:13px;
            line-height:1.45;
            white-space:pre-wrap;
            word-break:break-word;
        }

        .bt-community-message.own .bt-community-text{
            background:#123b60;
        }

        .bt-community-compose{
            padding:9px 10px calc(9px + env(safe-area-inset-bottom));
            display:flex;
            gap:8px;
            align-items:flex-end;
            flex-shrink:0;
            background:#081e34;
            border-top:1px solid rgba(255,255,255,.08);
        }

        #btCommunityInput{
            min-height:44px;
            max-height:110px;
            flex:1;
            resize:none;
            border:1px solid rgba(255,255,255,.09);
            border-radius:14px;
            background:#0b2239;
            color:#fff;
            outline:none;
            padding:12px 13px;
            font-family:inherit;
            font-size:13px;
            line-height:1.35;
        }

        #btCommunityInput::placeholder{
            color:#6f879d;
        }

        #btCommunitySend{
            width:46px;
            height:46px;
            flex:0 0 46px;
            border:0;
            border-radius:14px;
            background:#ff7900;
            color:#fff;
            font-size:18px;
            font-weight:900;
            cursor:pointer;
            box-shadow:0 8px 22px rgba(255,121,0,.18);
        }

        #btCommunitySend:disabled{
            opacity:.55;
            cursor:default;
        }

        .bt-community-info{
            padding:7px 13px;
            flex-shrink:0;
            background:#071c30;
            color:#7f98ad;
            border-bottom:1px solid rgba(255,255,255,.05);
            font-size:9px;
            text-align:center;
        }

        .bt-community-nav-icon{
            position:relative;
        }

        .bt-community-actions{
            display:flex;
            align-items:center;
            gap:8px;
            margin-top:6px;
        }

        .bt-community-action{
            border:0;
            background:transparent;
            color:#8fa7bc;
            padding:3px 5px;
            border-radius:7px;
            font-family:inherit;
            font-size:10px;
            font-weight:800;
            cursor:pointer;
        }

        .bt-community-action:hover{
            background:rgba(255,255,255,.05);
        }

        .bt-community-action.liked{
            color:#ff9a38;
        }

        .bt-community-reply-preview{
            margin-bottom:6px;
            padding:7px 9px;
            border-left:3px solid #ff7900;
            border-radius:7px;
            background:rgba(255,255,255,.045);
            cursor:pointer;
        }

        .bt-community-reply-preview strong{
            display:block;
            color:#ff9a38;
            font-size:9px;
            margin-bottom:2px;
        }

        .bt-community-reply-preview span{
            display:block;
            color:#9eb1c2;
            font-size:10px;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }

        #btCommunityReplyBar{
            display:none;
            align-items:center;
            gap:8px;
            padding:7px 12px;
            flex-shrink:0;
            background:#0a2239;
            border-top:1px solid rgba(255,255,255,.06);
        }

        #btCommunityReplyBar.show{
            display:flex;
        }

        .bt-community-reply-bar-text{
            flex:1;
            min-width:0;
            font-size:10px;
            color:#9eb1c2;
            white-space:nowrap;
            overflow:hidden;
            text-overflow:ellipsis;
        }

        .bt-community-reply-bar-text strong{
            color:#ff9a38;
        }

        .bt-community-reply-cancel{
            width:28px;
            height:28px;
            border:0;
            border-radius:8px;
            background:rgba(255,255,255,.06);
            color:#fff;
            cursor:pointer;
        }

        .bt-community-message.bt-community-highlight{
            animation:btCommunityHighlight 1.4s ease;
        }

        @keyframes btCommunityHighlight{
            0%,100%{background:transparent;}
            35%{background:rgba(255,121,0,.12);}
        }
    `;

    document.head.appendChild(
        style
    );


    const overlay =
        document.createElement(
            "section"
        );

    overlay.id =
        "btCommunityOverlay";

    overlay.innerHTML = `
        <div class="bt-community-head">

            <button
                class="bt-community-back"
                type="button"
                onclick="closeCommunity()"
            >
                ‹
            </button>

            <div class="bt-community-title">
                <small>BORATEC</small>
                <strong>💬 Comunidade</strong>
                <div class="bt-community-online">
                    Profissionais trocando informações em tempo real
                </div>
            </div>

        </div>

        <div class="bt-community-info">
            Espaço público para usuários BoraTec • respeite os demais profissionais
        </div>

        <div id="btCommunityMessages">
            <div class="bt-community-empty">
                Carregando comunidade...
            </div>
        </div>

        <div id="btCommunityReplyBar">
            <div class="bt-community-reply-bar-text" id="btCommunityReplyText"></div>
            <button
                class="bt-community-reply-cancel"
                type="button"
                onclick="cancelCommunityReply()"
                title="Cancelar resposta"
            >
                ✕
            </button>
        </div>

        <form
            class="bt-community-compose"
            onsubmit="sendCommunityMessage(event)"
        >
            <textarea
                id="btCommunityInput"
                maxlength="1000"
                rows="1"
                placeholder="Compartilhe uma dúvida, dica ou informação..."
            ></textarea>

            <button
                id="btCommunitySend"
                type="submit"
                aria-label="Enviar"
            >
                ➤
            </button>
        </form>
    `;

    document.body.appendChild(
        overlay
    );


    const input =
        document.getElementById(
            "btCommunityInput"
        );

    input?.addEventListener(
        "input",
        () => {

            input.style.height =
                "auto";

            input.style.height =
                Math.min(
                    input.scrollHeight,
                    110
                )
                +
                "px";
        }
    );
}


function setupCommunityNav(){

    const nav =
        document.querySelector(
            ".bottom-nav"
        );

    if(!nav){
        return;
    }

    if(
        document.getElementById(
            "btCommunityNavButton"
        )
    ){
        return;
    }

    const button =
        document.createElement(
            "button"
        );

    button.id =
        "btCommunityNavButton";

    button.className =
        "nav-button";

    button.type =
        "button";

    button.setAttribute(
        "onclick",
        "selectNav(this,'Comunidade')"
    );

    button.innerHTML = `
        <span class="bt-community-nav-icon">
            ◉
        </span>
        Comunidade
    `;

    const profileButton =
        Array.from(
            nav.querySelectorAll(
                ".nav-button"
            )
        )
        .find(
            item =>
                (
                    item.getAttribute(
                        "onclick"
                    )
                    ||
                    ""
                )
                .toLowerCase()
                .includes(
                    "perfil"
                )
        );

    if(profileButton){
        nav.insertBefore(
            button,
            profileButton
        );
    }
    else{
        nav.appendChild(
            button
        );
    }
}


function btCommunityInitials(
    name
){

    return String(
        name
        ||
        "BT"
    )
    .trim()
    .split(/\s+/)
    .slice(0,2)
    .map(
        part =>
            part[0]
            ||
            ""
    )
    .join("")
    .toUpperCase();
}


function btCommunityTime(
    createdAt
){

    if(!createdAt){
        return "";
    }

    const date =
        new Date(
            createdAt
        );

    if(
        Number.isNaN(
            date.getTime()
        )
    ){
        return "";
    }

    const today =
        new Date();

    const sameDay =
        date.getFullYear()
        ===
        today.getFullYear()
        &&
        date.getMonth()
        ===
        today.getMonth()
        &&
        date.getDate()
        ===
        today.getDate();

    if(sameDay){
        return date
        .toLocaleTimeString(
            "pt-BR",
            {
                hour:"2-digit",
                minute:"2-digit"
            }
        );
    }

    return date
    .toLocaleDateString(
        "pt-BR",
        {
            day:"2-digit",
            month:"2-digit"
        }
    )
    +
    " "
    +
    date
    .toLocaleTimeString(
        "pt-BR",
        {
            hour:"2-digit",
            minute:"2-digit"
        }
    );
}


async function loadCommunityMessages(
    scrollToBottom = true
){

    const container =
        document.getElementById(
            "btCommunityMessages"
        );

    if(
        !container
        ||
        !boraSupabase
    ){
        return;
    }

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from(
            "community_messages"
        )
        .select(`
            id,
            sender_id,
            content,
            reply_to_id,
            created_at,
            profiles (
                id,
                name,
                professional_name,
                photo_url
            )
        `)
        .order(
            "created_at",
            {
                ascending:true
            }
        )
        .limit(
            200
        );

        if(error){
            throw error;
        }

        const messages =
            data
            ||
            [];

        const messageMap =
            new Map(
                messages.map(
                    item => [
                        item.id,
                        item
                    ]
                )
            );

        const senderIds =
            [
                ...new Set(
                    messages
                    .map(
                        item =>
                            item.sender_id
                    )
                    .filter(Boolean)
                )
            ];

        const reputationMap =
            new Map();

        if(senderIds.length){

            const {
                data:reputations,
                error:repError
            } =
            await boraSupabase
            .from(
                "v_profile_reputation"
            )
            .select(`
                id,
                reputation,
                ratings_count,
                completed_jobs
            `)
            .in(
                "id",
                senderIds
            );

            if(!repError){

                (reputations || [])
                .forEach(
                    rep =>
                        reputationMap.set(
                            rep.id,
                            rep
                        )
                );
            }
        }


        const messageIds =
            messages
            .map(
                item =>
                    item.id
            );

        const likesCount =
            new Map();

        const myLikes =
            new Set();

        if(messageIds.length){

            const {
                data:likes,
                error:likesError
            } =
            await boraSupabase
            .from(
                "community_message_likes"
            )
            .select(`
                message_id,
                user_id
            `)
            .in(
                "message_id",
                messageIds
            );

            if(!likesError){

                (likes || [])
                .forEach(
                    like => {

                        likesCount.set(
                            like.message_id,
                            (
                                likesCount.get(
                                    like.message_id
                                )
                                ||
                                0
                            )
                            +
                            1
                        );

                        if(
                            boraUser
                            &&
                            like.user_id
                            ===
                            boraUser.id
                        ){
                            myLikes.add(
                                like.message_id
                            );
                        }
                    }
                );
            }
        }


        if(messages.length === 0){

            container.innerHTML = `
                <div class="bt-community-empty">
                    💬<br><br>
                    A comunidade ainda está vazia.<br>
                    Seja o primeiro a compartilhar uma dúvida, dica ou informação.
                </div>
            `;

            return;
        }


        container.innerHTML =
            messages
            .map(
                message => {

                    const profile =
                        message.profiles
                        ||
                        {};

                    const displayName =
                        profile.professional_name
                        ||
                        profile.name
                        ||
                        "Profissional BoraTec";

                    const reputation =
                        reputationMap.get(
                            message.sender_id
                        )
                        ||
                        {};

                    const ratingCount =
                        Number(
                            reputation.ratings_count
                            ||
                            0
                        );

                    const repHTML =
                        ratingCount > 0
                        ?
                        `⭐ ${Number(
                            reputation.reputation
                            ||
                            0
                        ).toFixed(1)}`
                        :
                        "NOVO";

                    const avatarHTML =
                        profile.photo_url
                        ?
                        `
                        <img
                            src="${escapeHtml(profile.photo_url)}"
                            alt=""
                        >
                        `
                        :
                        escapeHtml(
                            btCommunityInitials(
                                displayName
                            )
                        );

                    const own =
                        boraUser
                        &&
                        message.sender_id
                        ===
                        boraUser.id;

                    const deleteHTML =
                        own
                        ?
                        `
                        <button
                            class="bt-community-delete"
                            type="button"
                            onclick="deleteCommunityMessage('${message.id}')"
                            title="Apagar minha mensagem"
                        >
                            🗑
                        </button>
                        `
                        :
                        "";

                    const parent =
                        message.reply_to_id
                        ?
                        messageMap.get(
                            message.reply_to_id
                        )
                        :
                        null;

                    let replyHTML =
                        "";

                    if(parent){

                        const parentProfile =
                            parent.profiles
                            ||
                            {};

                        const parentName =
                            parentProfile.professional_name
                            ||
                            parentProfile.name
                            ||
                            "Profissional BoraTec";

                        const shortText =
                            String(
                                parent.content
                                ||
                                ""
                            )
                            .replace(/\s+/g," ")
                            .slice(0,90);

                        replyHTML = `
                            <div
                                class="bt-community-reply-preview"
                                onclick="goToCommunityMessage('${parent.id}')"
                            >
                                <strong>↩ ${escapeHtml(parentName)}</strong>
                                <span>${escapeHtml(shortText)}</span>
                            </div>
                        `;
                    }

                    const usefulCount =
                        likesCount.get(
                            message.id
                        )
                        ||
                        0;

                    const liked =
                        myLikes.has(
                            message.id
                        );

                    return `
                        <div
                            class="bt-community-message ${own ? "own" : ""}"
                            id="btCommunityMessage_${message.id}"
                            data-community-message-id="${message.id}"
                        >

                            <button
                                class="bt-community-avatar"
                                type="button"
                                onclick="openPublicProfile('${message.sender_id}')"
                            >
                                ${avatarHTML}
                            </button>

                            <div class="bt-community-bubble">

                                <div class="bt-community-meta">

                                    <button
                                        class="bt-community-name"
                                        type="button"
                                        onclick="openPublicProfile('${message.sender_id}')"
                                    >
                                        ${escapeHtml(displayName)}
                                    </button>

                                    <span class="bt-community-rep">
                                        ${repHTML}
                                    </span>

                                    <span class="bt-community-time">
                                        ${escapeHtml(
                                            btCommunityTime(
                                                message.created_at
                                            )
                                        )}
                                    </span>

                                    ${deleteHTML}

                                </div>

                                ${replyHTML}

                                <div class="bt-community-text">${escapeHtml(message.content)}</div>

                                <div class="bt-community-actions">

                                    <button
                                        class="bt-community-action ${liked ? "liked" : ""}"
                                        type="button"
                                        onclick="toggleCommunityUseful('${message.id}')"
                                    >
                                        👍 Útil${usefulCount ? ` ${usefulCount}` : ""}
                                    </button>

                                    <button
                                        class="bt-community-action"
                                        type="button"
                                        onclick="replyCommunityMessage(
                                            '${message.id}',
                                            '${message.sender_id}'
                                        )"
                                    >
                                        ↩ Responder
                                    </button>

                                </div>

                            </div>

                        </div>
                    `;
                }
            )
            .join("");


        if(scrollToBottom){

            requestAnimationFrame(
                () => {

                    container.scrollTop =
                        container.scrollHeight;
                }
            );
        }

    }catch(error){

        console.error(
            "Erro comunidade:",
            error
        );

        container.innerHTML = `
            <div class="bt-community-empty">
                Não foi possível carregar a comunidade.
            </div>
        `;
    }
}


function replyCommunityMessage(
    messageId,
    senderId
){

    const messageElement =
        document.querySelector(
            `[data-community-message-id="${messageId}"]`
        );

    if(!messageElement){
        return;
    }

    const name =
        messageElement
        .querySelector(
            ".bt-community-name"
        )
        ?.textContent
        ?.trim()
        ||
        "Profissional";

    const content =
        messageElement
        .querySelector(
            ".bt-community-text"
        )
        ?.textContent
        ?.trim()
        ||
        "";

    btCommunityReplyTo = {
        id:
            messageId,
        senderId:
            senderId,
        name:
            name,
        content:
            content
    };

    const bar =
        document.getElementById(
            "btCommunityReplyBar"
        );

    const text =
        document.getElementById(
            "btCommunityReplyText"
        );

    if(text){
        text.innerHTML =
            `<strong>↩ Respondendo ${escapeHtml(name)}</strong> — ${escapeHtml(content.slice(0,80))}`;
    }

    bar
    ?.classList
    .add(
        "show"
    );

    const input =
        document.getElementById(
            "btCommunityInput"
        );

    if(input){
        input.placeholder =
            `Responder ${name}...`;

        input.focus();
    }
}


function cancelCommunityReply(){

    btCommunityReplyTo =
        null;

    document
    .getElementById(
        "btCommunityReplyBar"
    )
    ?.classList
    .remove(
        "show"
    );

    const input =
        document.getElementById(
            "btCommunityInput"
        );

    if(input){
        input.placeholder =
            "Compartilhe uma dúvida, dica ou informação...";
    }
}


function goToCommunityMessage(
    messageId
){

    const element =
        document.getElementById(
            `btCommunityMessage_${messageId}`
        );

    if(!element){
        return;
    }

    element.scrollIntoView({
        behavior:"smooth",
        block:"center"
    });

    element.classList.remove(
        "bt-community-highlight"
    );

    void element.offsetWidth;

    element.classList.add(
        "bt-community-highlight"
    );
}


async function toggleCommunityUseful(
    messageId
){

    if(
        !messageId
        ||
        !boraUser
        ||
        !boraSupabase
    ){
        return;
    }

    try{

        const {
            data:existing,
            error:checkError
        } =
        await boraSupabase
        .from(
            "community_message_likes"
        )
        .select(
            "id"
        )
        .eq(
            "message_id",
            messageId
        )
        .eq(
            "user_id",
            boraUser.id
        )
        .maybeSingle();

        if(checkError){
            throw checkError;
        }

        if(existing?.id){

            const {
                error
            } =
            await boraSupabase
            .from(
                "community_message_likes"
            )
            .delete()
            .eq(
                "id",
                existing.id
            )
            .eq(
                "user_id",
                boraUser.id
            );

            if(error){
                throw error;
            }

        }
        else{

            const {
                error
            } =
            await boraSupabase
            .from(
                "community_message_likes"
            )
            .insert({
                message_id:
                    messageId,
                user_id:
                    boraUser.id
            });

            if(error){
                throw error;
            }
        }

        await loadCommunityMessages(
            false
        );

    }catch(error){

        console.error(
            "Erro Útil comunidade:",
            error
        );

        showToast(
            "Não foi possível registrar como útil"
        );
    }
}


async function sendCommunityMessage(
    event
){

    event.preventDefault();

    if(
        !boraUser
        ||
        !boraSupabase
    ){
        showToast(
            "Usuário não carregado"
        );
        return;
    }

    const input =
        document.getElementById(
            "btCommunityInput"
        );

    const button =
        document.getElementById(
            "btCommunitySend"
        );

    const content =
        String(
            input?.value
            ||
            ""
        )
        .trim();

    if(!content){
        return;
    }

    if(content.length > 1000){
        showToast(
            "Mensagem muito longa"
        );
        return;
    }

    try{

        if(button){
            button.disabled =
                true;
        }

        const {
            error
        } =
        await boraSupabase
        .from(
            "community_messages"
        )
        .insert({
            sender_id:
                boraUser.id,
            content:
                content,
            reply_to_id:
                btCommunityReplyTo?.id
                ||
                null
        });

        if(error){
            throw error;
        }

        if(input){
            input.value =
                "";

            input.style.height =
                "auto";
        }

        cancelCommunityReply();

        await loadCommunityMessages(
            true
        );

    }catch(error){

        console.error(
            "Erro ao enviar comunidade:",
            error
        );

        showToast(
            "Não foi possível enviar a mensagem"
        );

    }finally{

        if(button){
            button.disabled =
                false;
        }

        input?.focus();
    }
}


async function deleteCommunityMessage(
    messageId
){

    if(
        !messageId
        ||
        !boraUser
        ||
        !boraSupabase
    ){
        return;
    }

    const confirmed =
        window.confirm(
            "Apagar esta mensagem da comunidade?"
        );

    if(!confirmed){
        return;
    }

    try{

        const {
            error
        } =
        await boraSupabase
        .from(
            "community_messages"
        )
        .delete()
        .eq(
            "id",
            messageId
        )
        .eq(
            "sender_id",
            boraUser.id
        );

        if(error){
            throw error;
        }

        showToast(
            "🗑 Mensagem apagada"
        );

        await loadCommunityMessages(
            false
        );

    }catch(error){

        console.error(
            "Erro ao apagar mensagem comunidade:",
            error
        );

        showToast(
            "Não foi possível apagar a mensagem"
        );
    }
}


function listenCommunityRealtime(){

    if(
        !boraSupabase
        ||
        btCommunityChannel
    ){
        return;
    }

    btCommunityChannel =
        boraSupabase
        .channel(
            "boratec-community"
        )
        .on(
            "postgres_changes",
            {
                event:"*",
                schema:"public",
                table:"community_messages"
            },
            async () => {

                if(btCommunityOpened){
                    await loadCommunityMessages(
                        true
                    );
                }
            }
        )
        .on(
            "postgres_changes",
            {
                event:"*",
                schema:"public",
                table:"community_message_likes"
            },
            async () => {

                if(btCommunityOpened){
                    await loadCommunityMessages(
                        false
                    );
                }
            }
        )
        .subscribe();
}


async function openCommunity(){

    closeBoraTecHome();

    createCommunityInterface();

    setupCommunityNav();

    const overlay =
        document.getElementById(
            "btCommunityOverlay"
        );

    overlay
    ?.classList
    .add(
        "show"
    );

    document.body.style.overflow =
        "hidden";

    btCommunityOpened =
        true;

    document
    .querySelectorAll(
        ".bottom-nav .nav-button"
    )
    .forEach(
        button =>
            button.classList.remove(
                "active"
            )
    );

    document
    .getElementById(
        "btCommunityNavButton"
    )
    ?.classList
    .add(
        "active"
    );

    await loadCommunityMessages(
        true
    );

    listenCommunityRealtime();

    setTimeout(
        () => {
            document
            .getElementById(
                "btCommunityInput"
            )
            ?.focus();
        },
        120
    );
}


function closeCommunity(){

    document
    .getElementById(
        "btCommunityOverlay"
    )
    ?.classList
    .remove(
        "show"
    );

    document.body.style.overflow =
        "";

    btCommunityOpened =
        false;

    document
    .getElementById(
        "btCommunityNavButton"
    )
    ?.classList
    .remove(
        "active"
    );

    const homeButton =
        Array.from(
            document.querySelectorAll(
                ".bottom-nav .nav-button"
            )
        )
        .find(
            item =>
                (
                    item.getAttribute(
                        "onclick"
                    )
                    ||
                    ""
                )
                .toLowerCase()
                .includes(
                    "início"
                )
                ||
                (
                    item.getAttribute(
                        "onclick"
                    )
                    ||
                    ""
                )
                .toLowerCase()
                .includes(
                    "inicio"
                )
        );

    homeButton
    ?.classList
    .add(
        "active"
    );
}


window.openCommunity =
    openCommunity;

window.closeCommunity =
    closeCommunity;

window.sendCommunityMessage =
    sendCommunityMessage;

window.deleteCommunityMessage =
    deleteCommunityMessage;

window.replyCommunityMessage =
    replyCommunityMessage;

window.cancelCommunityReply =
    cancelCommunityReply;

window.goToCommunityMessage =
    goToCommunityMessage;

window.toggleCommunityUseful =
    toggleCommunityUseful;


/* =========================================================
   BORATEC V1.7 — MODO APP / PWA + TELA INICIAL
========================================================= */

let btHomeOpened = false;


function setupBoraTecPWA(){

    try{

        const head =
            document.head;

        const ensureLink =
            (
                rel,
                href,
                extra = {}
            ) => {

                let link =
                    document.querySelector(
                        `link[rel="${rel}"]`
                    );

                if(!link){
                    link =
                        document.createElement(
                            "link"
                        );

                    link.rel =
                        rel;

                    head.appendChild(
                        link
                    );
                }

                link.href =
                    href;

                Object.entries(
                    extra
                )
                .forEach(
                    ([key,value]) => {

                        link.setAttribute(
                            key,
                            value
                        );
                    }
                );
            };


        const ensureMeta =
            (
                name,
                content
            ) => {

                let meta =
                    document.querySelector(
                        `meta[name="${name}"]`
                    );

                if(!meta){
                    meta =
                        document.createElement(
                            "meta"
                        );

                    meta.name =
                        name;

                    head.appendChild(
                        meta
                    );
                }

                meta.content =
                    content;
            };


        ensureLink(
            "manifest",
            "./manifest.json"
        );

        ensureLink(
            "icon",
            "./icons/icon-192.png",
            {
                type:"image/png",
                sizes:"192x192"
            }
        );

        ensureLink(
            "apple-touch-icon",
            "./icons/apple-touch-icon.png",
            {
                sizes:"180x180"
            }
        );

        ensureMeta(
            "theme-color",
            "#06182b"
        );

        ensureMeta(
            "mobile-web-app-capable",
            "yes"
        );

        ensureMeta(
            "apple-mobile-web-app-capable",
            "yes"
        );

        ensureMeta(
            "apple-mobile-web-app-status-bar-style",
            "black-translucent"
        );

        ensureMeta(
            "apple-mobile-web-app-title",
            "BoraTec"
        );

        ensureMeta(
            "application-name",
            "BoraTec"
        );


        if(
            "serviceWorker"
            in
            navigator
        ){

            window.addEventListener(
                "load",
                async () => {

                    try{

                        const registration =
                            await navigator
                            .serviceWorker
                            .register(
                                "./service-worker.js",
                                {
                                    scope:"./",
                                    updateViaCache:"none"
                                }
                            );

                        await registration.update();

                    }catch(error){

                        console.error(
                            "Erro Service Worker:",
                            error
                        );
                    }
                }
            );
        }

    }catch(error){

        console.error(
            "Erro PWA:",
            error
        );
    }
}


let boraTecDeferredInstallPrompt = null;

function isBoraTecStandalone(){
    return (
        window.matchMedia?.("(display-mode: standalone)")?.matches
        ||
        window.navigator.standalone === true
    );
}

function updateBoraTecInstallButton(){

    const button =
        document.getElementById(
            "btHomeInstallButton"
        )
        ||
        document.getElementById(
            "btHomeInstall"
        );

    if(!button){
        return;
    }

    if(isBoraTecStandalone()){
        button.style.display = "none";
        return;
    }

    button.style.display = "flex";
}

async function installBoraTecApp(){

    if(isBoraTecStandalone()){
        showToast?.("BoraTec já está instalado");
        updateBoraTecInstallButton();
        return;
    }

    if(boraTecDeferredInstallPrompt){

        try{

            boraTecDeferredInstallPrompt.prompt();

            const choice =
                await boraTecDeferredInstallPrompt.userChoice;

            if(choice?.outcome === "accepted"){
                showToast?.("Instalação iniciada");
            }

            boraTecDeferredInstallPrompt = null;
            updateBoraTecInstallButton();

            return;

        }catch(error){

            console.error(
                "Erro ao abrir instalação:",
                error
            );
        }
    }

    const isIOS =
        /iphone|ipad|ipod/i
        .test(
            navigator.userAgent
        );

    if(isIOS){

        alert(
            "Para instalar o BoraTec no iPhone:\n\n" +
            "1. Toque em Compartilhar.\n" +
            "2. Escolha \"Adicionar à Tela de Início\"."
        );

        return;
    }

    alert(
        "Para instalar o BoraTec:\n\n" +
        "Abra o menu do navegador (⋮) e escolha " +
        "\"Instalar app\" ou \"Adicionar à tela inicial\"."
    );
}

window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();

        boraTecDeferredInstallPrompt =
            event;

        updateBoraTecInstallButton();
    }
);

window.addEventListener(
    "appinstalled",
    () => {

        boraTecDeferredInstallPrompt = null;
        updateBoraTecInstallButton();

        showToast?.(
            "📲 BoraTec instalado!"
        );
    }
);

window.installBoraTecApp =
    installBoraTecApp;

function createBoraTecHome(){

    if(document.getElementById("btHomeScreen")){
        return;
    }

    const style = document.createElement("style");
    style.id = "btHomeV182Style";

    style.textContent = `
        #btHomeScreen{
            position:fixed;
            inset:0;
            z-index:6400;
            display:none;
            overflow-y:auto;
            background:
                radial-gradient(circle at 85% -10%,rgba(19,120,190,.18),transparent 34%),
                linear-gradient(180deg,#06182b 0%,#071a2e 100%);
            color:#fff;
        }

        #btHomeScreen.show{ display:block; }

        .bt-home-shell{
            width:min(100%,680px);
            margin:0 auto;
            padding:22px 18px 110px;
            box-sizing:border-box;
        }

        .bt-v182-top{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:14px;
            margin-bottom:24px;
        }

        .bt-v182-brand{
            display:flex;
            align-items:center;
            gap:11px;
        }

        .bt-v182-brand img{
            width:44px;
            height:44px;
            border-radius:13px;
            object-fit:cover;
            box-shadow:0 8px 22px rgba(0,0,0,.24);
        }

        .bt-v182-brand-name{
            font-size:20px;
            line-height:1;
            font-weight:950;
            letter-spacing:-.4px;
        }

        .bt-v182-brand-tag{
            color:#7890a7;
            font-size:9px;
            margin-top:5px;
            text-transform:uppercase;
            letter-spacing:.7px;
        }

        .bt-v182-avatar{
            width:44px;
            height:44px;
            border-radius:50%;
            border:2px solid rgba(255,132,0,.75);
            background:#0d2943;
            color:#fff;
            display:flex;
            align-items:center;
            justify-content:center;
            font-weight:900;
            overflow:hidden;
            cursor:pointer;
            flex:0 0 auto;
        }

        .bt-v182-avatar img{
            width:100%;
            height:100%;
            object-fit:cover;
        }

        .bt-v182-user-button{
            max-width:190px;
            min-width:0;
            padding:5px 8px 5px 5px;
            border:1px solid rgba(119,151,178,.20);
            border-radius:12px;
            background:rgba(10,25,36,.72);
            color:#fff;
            display:flex;
            align-items:center;
            gap:8px;
            cursor:pointer;
            text-align:left;
        }

        .bt-v182-user-data{
            min-width:0;
            display:flex;
            flex-direction:column;
            line-height:1.08;
        }

        .bt-v182-user-data strong{
            max-width:118px;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            font-size:11px;
            font-weight:900;
            color:#f4f7f8;
        }

        .bt-v182-user-data small{
            margin-top:4px;
            color:#7f96a9;
            font-size:8px;
            font-weight:800;
            text-transform:uppercase;
            letter-spacing:.45px;
        }

        @media(max-width:420px){
            .bt-v182-user-button{
                max-width:154px;
            }

            .bt-v182-user-data strong{
                max-width:86px;
            }
        }

        .bt-v182-welcome{ margin-bottom:22px; }

        .bt-v182-kicker{
            color:#8097ac;
            font-size:12px;
            font-weight:800;
            text-transform:uppercase;
            letter-spacing:.7px;
        }

        .bt-v182-title{
            margin-top:5px;
            font-size:28px;
            line-height:1.1;
            font-weight:950;
            letter-spacing:-.8px;
        }

        .bt-v182-title span{ color:#ff8500; }

        .bt-v182-subtitle{
            margin-top:8px;
            color:#8ea4b7;
            font-size:13px;
            line-height:1.45;
        }

        .bt-v182-section-title{
            font-size:14px;
            font-weight:900;
            margin:0 0 11px;
        }

        .bt-v182-actions{
            position:relative;
            height:246px;
            margin:0 -18px 8px;
            overflow:hidden;
            touch-action:pan-y;
            user-select:none;
        }

        .bt-v182-action{
            position:absolute;
            top:10px;
            left:50%;
            width:min(72vw,250px);
            min-height:220px;
            border:1px solid rgba(119,151,178,.18);
            border-radius:22px;
            padding:22px 18px;
            text-align:center;
            color:#fff;
            background:linear-gradient(145deg,rgba(15,45,70,.98),rgba(9,35,58,.98));
            box-shadow:0 16px 38px rgba(0,0,0,.22);
            cursor:pointer;
            box-sizing:border-box;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            opacity:0;
            pointer-events:none;
            transform:translateX(-50%) scale(.72);
            transition:transform .32s cubic-bezier(.22,.61,.36,1),opacity .32s ease,filter .32s ease;
            will-change:transform,opacity;
        }

        .bt-v182-action.primary{
            border-color:rgba(255,132,0,.34);
            background:linear-gradient(145deg,rgba(255,132,0,.13),rgba(11,38,62,.98));
        }

        .bt-v182-action.bt-carousel-active{
            z-index:5;
            opacity:1;
            pointer-events:auto;
            filter:none;
            transform:translateX(-50%) scale(1);
        }

        .bt-v182-action.bt-carousel-prev{
            z-index:3;
            opacity:.38;
            filter:brightness(.62);
            transform:translateX(-112%) scale(.80) rotateY(10deg);
        }

        .bt-v182-action.bt-carousel-next{
            z-index:3;
            opacity:.38;
            filter:brightness(.62);
            transform:translateX(12%) scale(.80) rotateY(-10deg);
        }

        .bt-v182-action.bt-carousel-hidden{
            z-index:1;
            opacity:0;
            pointer-events:none;
            transform:translateX(-50%) scale(.64);
        }

        .bt-v182-action.bt-carousel-active:active{
            transform:translateX(-50%) scale(.985);
        }

        .bt-v182-action-icon{
            width:68px;
            height:68px;
            border-radius:18px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:34px;
            background:rgba(255,255,255,.055);
            margin-bottom:18px;
        }

        .bt-v182-action strong{
            display:block;
            font-size:19px;
            line-height:1.08;
            font-weight:950;
            margin-bottom:9px;
        }

        .bt-v182-action small{
            display:block;
            max-width:190px;
            color:#8098ad;
            font-size:11px;
            line-height:1.42;
        }

        .bt-home-carousel-controls{
            display:flex;
            align-items:center;
            justify-content:center;
            gap:12px;
            margin:3px 0 24px;
        }

        .bt-home-carousel-arrow{
            width:42px;
            height:42px;
            border-radius:13px;
            border:1px solid rgba(119,151,178,.20);
            background:#0b243b;
            color:#fff;
            font-size:24px;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
        }

        .bt-home-carousel-arrow:active{
            transform:scale(.96);
        }

        .bt-home-carousel-dots{
            min-width:104px;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:6px;
        }

        .bt-home-carousel-dot{
            width:6px;
            height:6px;
            border-radius:99px;
            background:rgba(128,151,172,.30);
            transition:width .2s ease,background .2s ease;
        }

        .bt-home-carousel-dot.active{
            width:18px;
            background:#ff8500;
        }

        .bt-v182-recent-head{
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:12px;
            margin-bottom:10px;
        }

        .bt-v182-feed-link{
            border:0;
            background:transparent;
            color:#ff8500;
            font-size:11px;
            font-weight:900;
            cursor:pointer;
        }

        #btHomeRecentList{ min-height:82px; }

        #btInstallAppButton{
            width:100%;
            min-height:42px;
            margin-top:24px;
            border:1px solid rgba(255,132,0,.38);
            border-radius:14px;
            background:rgba(255,132,0,.07);
            color:#fff;
            font-weight:850;
            display:none;
        }

        #btInstallAppButton.show{ display:block; }

        html.bt-standalone #btInstallAppButton,
        body.bt-standalone #btInstallAppButton{
            display:none !important;
        }

        @media (min-width:760px){
            .bt-home-shell{ padding-top:28px; }

            .bt-v182-actions{
                height:268px;
                margin-left:-34px;
                margin-right:-34px;
            }

            .bt-v182-action{
                width:260px;
                min-height:236px;
            }
        }
    `;

    document.head.appendChild(style);

    const home = document.createElement("section");
    home.id = "btHomeScreen";

    home.innerHTML = `
        <div class="bt-home-shell">

            <div class="bt-v182-top">
                <div class="bt-v182-brand">
                    <img src="./icons/icon-192.png" alt="BoraTec">

                    <div>
                        <div class="bt-v182-brand-name">BoraTec</div>
                        <div class="bt-v182-brand-tag">
                            Profissionais conectando profissionais
                        </div>
                    </div>
                </div>

                <button
                    id="btHomeUserButton"
                    class="bt-v182-user-button"
                    type="button"
                    onclick="selectNav(null,'Perfil')"
                    aria-label="Abrir meu perfil"
                >
                    <span
                        id="btHomeAvatar"
                        class="bt-v182-avatar"
                    >
                        BT
                    </span>

                    <span class="bt-v182-user-data">
                        <strong id="btHomeUserName">
                            Meu perfil
                        </strong>

                        <small>
                            Editar perfil
                        </small>
                    </span>
                </button>
            </div>

            <div class="bt-v182-welcome">
                <div id="btHomeGreeting" class="bt-v182-kicker">Olá</div>

                <div class="bt-v182-title">
                    O que você precisa <span>hoje?</span>
                </div>

                <div class="bt-v182-subtitle">
                    Gere trabalho, encontre apoio e conecte-se com profissionais da rede.
                </div>
            </div>

            <div class="bt-v182-section-title">Acesso rápido</div>

            <div class="bt-v182-actions">

                <button
                    class="bt-v182-action primary"
                    type="button"
                    onclick="btHomeOpenPublish('service')"
                >
                    <div class="bt-v182-action-icon">🔥</div>
                    <strong>Repassar serviço</strong>
                    <small>Publique um atendimento que você não consegue realizar.</small>
                </button>

                <button
                    class="bt-v182-action"
                    type="button"
                    onclick="btHomeOpenPublish('helper')"
                >
                    <div class="bt-v182-action-icon">👷</div>
                    <strong>Preciso de ajudante</strong>
                    <small>Encontre apoio para instalação, manutenção ou obra.</small>
                </button>

                <button
                    class="bt-v182-action"
                    type="button"
                    onclick="btHomeOpenPublish('technician_available')"
                >
                    <div class="bt-v182-action-icon">🧰</div>
                    <strong>Estou disponível</strong>
                    <small>Avise à rede onde e quando você pode atender.</small>
                </button>

                <button
                    class="bt-v182-action"
                    type="button"
                    onclick="openBoraTecFeedTab('Profissionais')"
                >
                    <div class="bt-v182-action-icon">🔎</div>
                    <strong>Encontrar profissional</strong>
                    <small>Veja técnicos e ajudantes disponíveis na rede.</small>
                </button>

                <button
                    class="bt-v182-action"
                    type="button"
                    onclick="openCommunityFromHome()"
                >
                    <div class="bt-v182-action-icon">💬</div>
                    <strong>Comunidade</strong>
                    <small>Troque dúvidas, dicas e informações com profissionais da rede.</small>
                </button>

                <button
                    class="bt-v182-action"
                    type="button"
                    onclick="openTechnicalAreaFromHome()"
                >
                    <div class="bt-v182-action-icon">🛠️</div>
                    <strong>Área Técnica</strong>
                    <small>Gases, calculadoras, códigos de erro, manuais e ferramentas técnicas.</small>
                </button>

            </div>

            <div class="bt-home-carousel-controls">
                <button
                    id="btHomeCarouselPrev"
                    class="bt-home-carousel-arrow"
                    type="button"
                    aria-label="Anterior"
                >‹</button>

                <div
                    id="btHomeCarouselDots"
                    class="bt-home-carousel-dots"
                    aria-hidden="true"
                ></div>

                <button
                    id="btHomeCarouselNext"
                    class="bt-home-carousel-arrow"
                    type="button"
                    aria-label="Próximo"
                >›</button>
            </div>

            <button id="btInstallAppButton" type="button">
                📲 Instalar BoraTec
            </button>

        </div>
    `;

    document.body.appendChild(home);

    setupBoraTecHomeCarousel();
    updateBoraTecInstallButton();

    const installBtn = document.getElementById("btInstallAppButton");

    if(installBtn){
        installBtn.addEventListener("click", async () => {

            if(isBoraTecStandalone()){
                installBtn.style.display = "flex";
                return;
            }

            if(!btInstallPrompt){
                showToast(
                    "No Chrome: toque em ⋮ e escolha Instalar app / Adicionar à tela inicial"
                );
                return;
            }

            btInstallPrompt.prompt();
            await btInstallPrompt.userChoice;
            btInstallPrompt = null;
            installBtn.classList.remove("show");
        });
    }
}


function setupBoraTecHomeCarousel(){

    const home =
        document.getElementById(
            "btHomeScreen"
        );

    if(!home){
        return;
    }

    const rail =
        home.querySelector(
            ".bt-v182-actions"
        );

    const dotsBox =
        document.getElementById(
            "btHomeCarouselDots"
        );

    const prev =
        document.getElementById(
            "btHomeCarouselPrev"
        );

    const next =
        document.getElementById(
            "btHomeCarouselNext"
        );

    if(!rail || !dotsBox || !prev || !next){
        return;
    }

    const cards =
        Array.from(
            rail.querySelectorAll(
                ".bt-v182-action"
            )
        );

    if(cards.length < 2){
        return;
    }

    let current = 0;
    let pointerStartX = null;
    let dragged = false;

    dotsBox.innerHTML =
        cards
        .map(
            (_,index) =>
                `<span class="bt-home-carousel-dot${index === 0 ? " active" : ""}"></span>`
        )
        .join("");

    const dots =
        Array.from(
            dotsBox.querySelectorAll(
                ".bt-home-carousel-dot"
            )
        );

    function normalize(index){
        return ((index % cards.length) + cards.length) % cards.length;
    }

    function render(){

        const previous = normalize(current - 1);
        const following = normalize(current + 1);

        cards.forEach(
            (card,index) => {

                card.classList.remove(
                    "bt-carousel-active",
                    "bt-carousel-prev",
                    "bt-carousel-next",
                    "bt-carousel-hidden"
                );

                if(index === current){
                    card.classList.add("bt-carousel-active");
                }
                else if(index === previous){
                    card.classList.add("bt-carousel-prev");
                }
                else if(index === following){
                    card.classList.add("bt-carousel-next");
                }
                else{
                    card.classList.add("bt-carousel-hidden");
                }
            }
        );

        dots.forEach(
            (dot,index) =>
                dot.classList.toggle(
                    "active",
                    index === current
                )
        );
    }

    function move(direction){
        current = normalize(current + direction);
        render();
    }

    prev.onclick = () => move(-1);
    next.onclick = () => move(1);

    rail.addEventListener(
        "pointerdown",
        event => {

            if(
                event.pointerType === "mouse"
                &&
                event.button !== 0
            ){
                return;
            }

            pointerStartX = event.clientX;
            dragged = false;
        }
    );

    rail.addEventListener(
        "pointermove",
        event => {

            if(pointerStartX === null){
                return;
            }

            if(
                Math.abs(
                    event.clientX - pointerStartX
                ) > 10
            ){
                dragged = true;
            }
        }
    );

    rail.addEventListener(
        "pointerup",
        event => {

            if(pointerStartX === null){
                return;
            }

            const delta =
                event.clientX - pointerStartX;

            pointerStartX = null;

            if(Math.abs(delta) >= 42){

                if(delta < 0){
                    move(1);
                }
                else{
                    move(-1);
                }
            }

            window.setTimeout(
                () => {
                    dragged = false;
                },
                0
            );
        }
    );

    rail.addEventListener(
        "pointercancel",
        () => {
            pointerStartX = null;
            dragged = false;
        }
    );

    rail.addEventListener(
        "click",
        event => {

            if(!dragged){
                return;
            }

            event.preventDefault();
            event.stopPropagation();
        },
        true
    );

    render();
}


async function loadBoraTecHome(){

    const profile =
        boraProfile ||
        window.btCurrentProfile ||
        {};

    const displayName =
        profile.professional_name ||
        profile.name ||
        "Profissional";

    const firstName =
        String(displayName).trim().split(/\s+/)[0] ||
        "Profissional";

    const hour = new Date().getHours();

    const greeting =
        hour < 12
        ? "Bom dia"
        : hour < 18
        ? "Boa tarde"
        : "Boa noite";

    const greetingEl = document.getElementById("btHomeGreeting");

    if(greetingEl){
        greetingEl.textContent = `${greeting}, ${firstName}`;
    }

    const avatar =
        document.getElementById("btHomeAvatar");

    const userNameEl =
        document.getElementById("btHomeUserName");

    if(userNameEl){
        userNameEl.textContent = displayName;
    }

    if(avatar){

        const initials =
            String(displayName)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0,2)
            .map(part => part[0])
            .join("")
            .toUpperCase() ||
            "BT";

        avatar.innerHTML =
            profile.photo_url
            ? `<img src="${escapeHTML(profile.photo_url)}" alt="Minha foto de perfil">`
            : escapeHTML(initials);
    }

    const list = document.getElementById("btHomeRecentList");

    if(!list){
        return;
    }

    try{

        const {data,error} =
            await boraSupabase
            .from("opportunities")
            .select("*")
            .eq("status","open")
            .order("created_at",{ascending:false})
            .limit(4);

        if(error){
            throw error;
        }

        if(!data || !data.length){

            list.innerHTML = `
                <div style="
                    min-height:90px;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    text-align:center;
                    color:#7991a7;
                    font-size:12px;
                    border:1px dashed rgba(121,145,167,.16);
                    border-radius:16px;
                    padding:18px;
                ">
                    Nenhuma oportunidade aberta no momento.
                </div>
            `;

            return;
        }

        list.innerHTML =
            data.map(item => {

                const city =
                    item.city
                    ? `📍 ${escapeHTML(item.city)}`
                    : "";

                const value =
                    item.value !== null &&
                    item.value !== undefined
                    ? `R$ ${Number(item.value).toLocaleString("pt-BR",{
                        minimumFractionDigits:2,
                        maximumFractionDigits:2
                    })}`
                    : item.value_negotiable
                    ? "A combinar"
                    : "";

                return `
                    <div
                        style="
                            width:100%;
                            margin-bottom:9px;
                            padding:13px 14px;
                            border:1px solid rgba(120,153,180,.16);
                            border-radius:15px;
                            background:#0b243b;
                            color:#fff;
                            text-align:left;
                            box-sizing:border-box;
                        "
                    >
                        <div style="
                            font-size:13px;
                            font-weight:900;
                            margin-bottom:6px;
                        ">
                            ${escapeHTML(item.title || "Oportunidade")}
                        </div>

                        <div style="
                            display:flex;
                            gap:8px;
                            flex-wrap:wrap;
                            color:#7f98ae;
                            font-size:10.5px;
                        ">
                            ${city ? `<span>${city}</span>` : ""}
                            ${item.category ? `<span>🧰 ${escapeHTML(item.category)}</span>` : ""}
                            ${value ? `<span style="color:#ff9b32;font-weight:800">${value}</span>` : ""}
                        </div>
                    </div>
                `;
            }).join("");

    }catch(error){

        console.error("Erro ao carregar Home:", error);

        list.innerHTML = `
            <div style="
                color:#8097ac;
                font-size:12px;
                padding:18px 0;
                text-align:center;
            ">
                Não foi possível carregar as oportunidades agora.
            </div>
        `;
    }
}


async function openBoraTecHome(){

    createBoraTecHome();

    btHomeOpened =
        true;

    document
    .getElementById(
        "btHomeScreen"
    )
    ?.classList
    .add(
        "show"
    );

    document.body.style.overflow =
        "hidden";

    try{
        if(typeof window.renderBoraTecV18Home === "function"){
            await window.renderBoraTecV18Home();
        }else{
            await loadBoraTecHome();
        }
    }catch(error){
        console.error("Erro ao abrir Home V1.8:", error);
        await loadBoraTecHome();
    }
}


function closeBoraTecHome(){

    btHomeOpened =
        false;

    document
    .getElementById(
        "btHomeScreen"
    )
    ?.classList
    .remove(
        "show"
    );

    document.body.style.overflow =
        "";
}


function btHomeOpenPublish(
    type
){

    closeBoraTecHome();

    if(
        typeof window.selectPublishType
        ===
        "function"
    ){
        window.selectPublishType(
            type
        );
    }
}


function btHomeOpenProfessionals(){

    closeBoraTecHome();

    if(
        typeof window.changeFilter
        ===
        "function"
    ){
        window.changeFilter(
            null,
            "professionals"
        );
    }
}


function openCommunityFromHome(){

    closeBoraTecHome();

    openCommunity();
}


function openTechnicalAreaFromHome(){

    if(
        typeof window.openTechnicalArea
        ===
        "function"
    ){

        closeBoraTecHome();

        window.openTechnicalArea();
        return;
    }

    if(
        typeof window.showToast
        ===
        "function"
    ){

        window.showToast(
            "Área Técnica em preparação"
        );
    }
}


function openMyBoraTecProfileFromHome(){

    if(boraUser?.id){

        closeBoraTecHome();

        openPublicProfile(
            boraUser.id
        );
    }
}


/* =========================================================
   ÁREA TÉCNICA BORATEC R12.3
   MÓDULO ISOLADO - CARROSSEL HORIZONTAL NO PADRÃO DA HOME
========================================================= */

function createTechnicalArea(){

    if(document.getElementById("btTechnicalAreaScreen")){
        return;
    }

    if(!document.getElementById("btTechnicalAreaStyle")){

        const style = document.createElement("style");
        style.id = "btTechnicalAreaStyle";

        style.textContent = `
            #btTechnicalAreaScreen{
                position:fixed;
                inset:0;
                z-index:6500;
                display:none;
                overflow-y:auto;
                background:
                    radial-gradient(circle at 82% -8%,rgba(0,188,255,.16),transparent 32%),
                    linear-gradient(180deg,#06182b 0%,#071a2e 100%);
                color:#fff;
            }

            #btTechnicalAreaScreen.show{ display:block; }

            .bt-tech-shell{
                width:min(100%,680px);
                margin:0 auto;
                padding:20px 18px 110px;
                box-sizing:border-box;
            }

            .bt-tech-top{
                display:flex;
                align-items:center;
                gap:12px;
                margin-bottom:20px;
            }

            .bt-tech-back{
                width:42px;
                height:42px;
                border-radius:13px;
                border:1px solid rgba(119,151,178,.22);
                background:#0b243b;
                color:#fff;
                font-size:25px;
                line-height:1;
                display:flex;
                align-items:center;
                justify-content:center;
                cursor:pointer;
                flex:0 0 auto;
            }

            .bt-tech-heading{ min-width:0; }

            .bt-tech-heading small{
                display:block;
                color:#5ecfff;
                font-size:9px;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.85px;
                margin-bottom:4px;
            }

            .bt-tech-heading strong{
                display:block;
                font-size:22px;
                line-height:1.05;
                font-weight:950;
                letter-spacing:-.45px;
            }

            .bt-tech-intro{
                margin-bottom:18px;
            }

            .bt-tech-intro strong{
                display:block;
                font-size:14px;
                font-weight:950;
                margin-bottom:5px;
            }

            .bt-tech-intro span{
                display:block;
                color:#86a0b5;
                font-size:11px;
                line-height:1.4;
            }

            .bt-tech-actions{
                position:relative;
                height:246px;
                margin:0 -18px 8px;
                overflow:hidden;
                touch-action:pan-y;
                user-select:none;
            }

            .bt-tech-card{
                position:absolute;
                top:10px;
                left:50%;
                width:min(72vw,250px);
                min-height:220px;
                border:1px solid rgba(119,151,178,.18);
                border-radius:22px;
                padding:22px 18px;
                text-align:center;
                color:#fff;
                background:linear-gradient(145deg,rgba(15,45,70,.98),rgba(9,35,58,.98));
                box-shadow:0 16px 38px rgba(0,0,0,.22);
                cursor:pointer;
                box-sizing:border-box;
                display:flex;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                opacity:0;
                pointer-events:none;
                transform:translateX(-50%) scale(.72);
                transition:transform .32s cubic-bezier(.22,.61,.36,1),opacity .32s ease,filter .32s ease;
                will-change:transform,opacity;
            }

            .bt-tech-card.bt-tech-carousel-active{
                z-index:5;
                opacity:1;
                pointer-events:auto;
                filter:none;
                transform:translateX(-50%) scale(1);
            }

            .bt-tech-card.bt-tech-carousel-prev{
                z-index:3;
                opacity:.38;
                filter:brightness(.62);
                transform:translateX(-112%) scale(.80) rotateY(10deg);
            }

            .bt-tech-card.bt-tech-carousel-next{
                z-index:3;
                opacity:.38;
                filter:brightness(.62);
                transform:translateX(12%) scale(.80) rotateY(-10deg);
            }

            .bt-tech-card.bt-tech-carousel-hidden{
                z-index:1;
                opacity:0;
                pointer-events:none;
                transform:translateX(-50%) scale(.64);
            }

            .bt-tech-card.bt-tech-carousel-active:active{
                transform:translateX(-50%) scale(.985);
            }

            .bt-tech-card-icon{
                width:68px;
                height:68px;
                border-radius:18px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:34px;
                background:rgba(94,207,255,.08);
                border:1px solid rgba(94,207,255,.12);
                margin-bottom:18px;
            }

            .bt-tech-card strong{
                display:block;
                font-size:19px;
                line-height:1.08;
                font-weight:950;
                margin-bottom:9px;
            }

            .bt-tech-card small{
                display:block;
                max-width:190px;
                color:#8098ad;
                font-size:11px;
                line-height:1.42;
            }

            .bt-tech-carousel-controls{
                display:flex;
                align-items:center;
                justify-content:center;
                gap:12px;
                margin:3px 0 24px;
            }

            .bt-tech-carousel-arrow{
                width:42px;
                height:42px;
                border-radius:13px;
                border:1px solid rgba(119,151,178,.20);
                background:#0b243b;
                color:#fff;
                font-size:24px;
                display:flex;
                align-items:center;
                justify-content:center;
                cursor:pointer;
            }

            .bt-tech-carousel-arrow:active{ transform:scale(.96); }

            .bt-tech-carousel-dots{
                min-width:104px;
                display:flex;
                align-items:center;
                justify-content:center;
                gap:6px;
            }

            .bt-tech-carousel-dot{
                width:6px;
                height:6px;
                border-radius:99px;
                background:rgba(128,151,172,.30);
                transition:width .2s ease,background .2s ease;
            }

            .bt-tech-carousel-dot.active{
                width:18px;
                background:#5ecfff;
            }

            .bt-tech-workspace{
                display:none;
                margin-top:8px;
                border:1px solid rgba(94,207,255,.16);
                border-radius:20px;
                padding:18px;
                background:linear-gradient(145deg,rgba(10,34,55,.96),rgba(7,27,46,.98));
                box-shadow:0 14px 34px rgba(0,0,0,.18);
            }

            .bt-tech-workspace.show{ display:block; }

            .bt-tech-workspace-title{
                display:flex;
                align-items:flex-start;
                justify-content:space-between;
                gap:12px;
                margin-bottom:16px;
            }

            .bt-tech-workspace-title strong{
                display:block;
                font-size:18px;
                font-weight:950;
                line-height:1.1;
            }

            .bt-tech-workspace-title span{
                display:block;
                margin-top:5px;
                color:#82a0b8;
                font-size:11px;
                line-height:1.4;
            }

            .bt-tech-gas-grid{
                display:grid;
                grid-template-columns:1fr 1fr;
                gap:12px;
            }

            .bt-tech-field{ min-width:0; }

            .bt-tech-field.full{ grid-column:1 / -1; }

            .bt-tech-field label{
                display:block;
                margin-bottom:6px;
                color:#b7cad9;
                font-size:10px;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.45px;
            }

            .bt-tech-field input,
            .bt-tech-field select{
                width:100%;
                min-height:48px;
                box-sizing:border-box;
                border:1px solid rgba(119,151,178,.24);
                border-radius:13px;
                background:#081f34;
                color:#fff;
                padding:0 13px;
                font-size:16px;
                outline:none;
            }

            .bt-tech-field input:focus,
            .bt-tech-field select:focus{
                border-color:rgba(94,207,255,.62);
                box-shadow:0 0 0 3px rgba(94,207,255,.07);
            }

            .bt-tech-calc-button{
                width:100%;
                min-height:48px;
                margin-top:14px;
                border:1px solid rgba(94,207,255,.38);
                border-radius:14px;
                background:linear-gradient(145deg,rgba(0,146,215,.34),rgba(10,55,82,.96));
                color:#fff;
                font-size:13px;
                font-weight:950;
                cursor:pointer;
            }

            .bt-tech-result{
                margin-top:14px;
                padding:15px;
                border-radius:15px;
                border:1px solid rgba(94,207,255,.14);
                background:rgba(3,19,32,.62);
            }

            .bt-tech-result-label{
                color:#78a0bb;
                font-size:9px;
                font-weight:900;
                text-transform:uppercase;
                letter-spacing:.55px;
            }

            .bt-tech-result-value{
                margin-top:5px;
                font-size:30px;
                line-height:1;
                font-weight:950;
                color:#fff;
            }

            .bt-tech-result-secondary{
                margin-top:8px;
                color:#a9c1d2;
                font-size:12px;
                line-height:1.5;
            }

            .bt-tech-info-note{
                margin-top:12px;
                padding:11px 12px;
                border-radius:12px;
                background:rgba(255,255,255,.035);
                color:#7894a9;
                font-size:10px;
                line-height:1.5;
            }

            @media(max-width:420px){
                .bt-tech-gas-grid{ grid-template-columns:1fr; }
                .bt-tech-field.full{ grid-column:auto; }
            }

            @media(min-width:760px){
                .bt-tech-shell{ padding-top:28px; }

                .bt-tech-actions{
                    height:268px;
                    margin-left:-34px;
                    margin-right:-34px;
                }

                .bt-tech-card{
                    width:260px;
                    min-height:236px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    const screen = document.createElement("section");
    screen.id = "btTechnicalAreaScreen";

    screen.innerHTML = `
        <div class="bt-tech-shell">

            <div class="bt-tech-top">
                <button
                    class="bt-tech-back"
                    type="button"
                    onclick="closeTechnicalArea()"
                    aria-label="Voltar para a página inicial"
                >‹</button>

                <div class="bt-tech-heading">
                    <small>BORATEC • FERRAMENTAS</small>
                    <strong>Área Técnica</strong>
                </div>
            </div>

            <div class="bt-tech-intro">
                <strong>Calculadoras</strong>
                <span>Deslize para os lados e escolha a ferramenta.</span>
            </div>

            <div class="bt-tech-actions" id="btTechnicalCarousel">

                <button class="bt-tech-card" type="button" onclick="openTechnicalCalculator('gases')">
                    <div class="bt-tech-card-icon">🧪</div>
                    <strong>Gases e saturação</strong>
                    <small>Consulte pressão e temperatura de saturação dos principais refrigerantes.</small>
                </button>

                <button class="bt-tech-card" type="button" onclick="openTechnicalCalculator('btu')">
                    <div class="bt-tech-card-icon">❄️</div>
                    <strong>Calculadora de BTU/h</strong>
                    <small>Dimensionamento de capacidade para ambientes.</small>
                </button>

                <button class="bt-tech-card" type="button" onclick="openTechnicalCalculator('superaquecimento')">
                    <div class="bt-tech-card-icon">🌡️</div>
                    <strong>Superaquecimento</strong>
                    <small>Calcule o superaquecimento do sistema de refrigeração.</small>
                </button>

                <button class="bt-tech-card" type="button" onclick="openTechnicalCalculator('subresfriamento')">
                    <div class="bt-tech-card-icon">🧊</div>
                    <strong>Sub-resfriamento</strong>
                    <small>Calcule o sub-resfriamento para análise do sistema.</small>
                </button>

                <button class="bt-tech-card" type="button" onclick="openTechnicalCalculator('pressao')">
                    <div class="bt-tech-card-icon">⏱️</div>
                    <strong>Conversão de pressão</strong>
                    <small>Converta PSI, bar, kPa e outras unidades de pressão.</small>
                </button>

                <button class="bt-tech-card" type="button" onclick="openTechnicalCalculator('temperatura')">
                    <div class="bt-tech-card-icon">🌡</div>
                    <strong>Conversão de temperatura</strong>
                    <small>Converta Celsius, Fahrenheit e Kelvin rapidamente.</small>
                </button>

                <button class="bt-tech-card" type="button" onclick="openTechnicalCalculator('eletrica')">
                    <div class="bt-tech-card-icon">⚡</div>
                    <strong>Elétrica</strong>
                    <small>Cálculos elétricos para uso técnico em campo.</small>
                </button>

            </div>

            <div class="bt-tech-carousel-controls">
                <button
                    id="btTechnicalCarouselPrev"
                    class="bt-tech-carousel-arrow"
                    type="button"
                    aria-label="Anterior"
                >‹</button>

                <div
                    id="btTechnicalCarouselDots"
                    class="bt-tech-carousel-dots"
                    aria-hidden="true"
                ></div>

                <button
                    id="btTechnicalCarouselNext"
                    class="bt-tech-carousel-arrow"
                    type="button"
                    aria-label="Próximo"
                >›</button>
            </div>

            <div id="btTechnicalWorkspace" class="bt-tech-workspace"></div>

        </div>
    `;

    document.body.appendChild(screen);
    setupTechnicalAreaCarousel();
}


function setupTechnicalAreaCarousel(){

    const screen =
        document.getElementById(
            "btTechnicalAreaScreen"
        );

    if(!screen){
        return;
    }

    const rail =
        document.getElementById(
            "btTechnicalCarousel"
        );

    const dotsBox =
        document.getElementById(
            "btTechnicalCarouselDots"
        );

    const prev =
        document.getElementById(
            "btTechnicalCarouselPrev"
        );

    const next =
        document.getElementById(
            "btTechnicalCarouselNext"
        );

    if(!rail || !dotsBox || !prev || !next){
        return;
    }

    const cards =
        Array.from(
            rail.querySelectorAll(
                ".bt-tech-card"
            )
        );

    if(cards.length < 2){
        return;
    }

    let current = 0;
    let pointerStartX = null;
    let dragged = false;

    dotsBox.innerHTML =
        cards
        .map(
            (_,index) =>
                `<span class="bt-tech-carousel-dot${index === 0 ? " active" : ""}"></span>`
        )
        .join("");

    const dots =
        Array.from(
            dotsBox.querySelectorAll(
                ".bt-tech-carousel-dot"
            )
        );

    function normalize(index){
        return ((index % cards.length) + cards.length) % cards.length;
    }

    function render(){

        const previous = normalize(current - 1);
        const following = normalize(current + 1);

        cards.forEach(
            (card,index) => {

                card.classList.remove(
                    "bt-tech-carousel-active",
                    "bt-tech-carousel-prev",
                    "bt-tech-carousel-next",
                    "bt-tech-carousel-hidden"
                );

                if(index === current){
                    card.classList.add("bt-tech-carousel-active");
                }
                else if(index === previous){
                    card.classList.add("bt-tech-carousel-prev");
                }
                else if(index === following){
                    card.classList.add("bt-tech-carousel-next");
                }
                else{
                    card.classList.add("bt-tech-carousel-hidden");
                }
            }
        );

        dots.forEach(
            (dot,index) =>
                dot.classList.toggle(
                    "active",
                    index === current
                )
        );
    }

    function move(direction){
        current = normalize(current + direction);
        render();
    }

    prev.onclick = () => move(-1);
    next.onclick = () => move(1);

    rail.addEventListener(
        "pointerdown",
        event => {

            if(
                event.pointerType === "mouse"
                &&
                event.button !== 0
            ){
                return;
            }

            pointerStartX = event.clientX;
            dragged = false;
        }
    );

    rail.addEventListener(
        "pointermove",
        event => {

            if(pointerStartX === null){
                return;
            }

            if(
                Math.abs(
                    event.clientX - pointerStartX
                ) > 10
            ){
                dragged = true;
            }
        }
    );

    rail.addEventListener(
        "pointerup",
        event => {

            if(pointerStartX === null){
                return;
            }

            const delta =
                event.clientX - pointerStartX;

            pointerStartX = null;

            if(Math.abs(delta) >= 42){

                if(delta < 0){
                    move(1);
                }
                else{
                    move(-1);
                }
            }

            window.setTimeout(
                () => {
                    dragged = false;
                },
                0
            );
        }
    );

    rail.addEventListener(
        "pointercancel",
        () => {
            pointerStartX = null;
            dragged = false;
        }
    );

    rail.addEventListener(
        "click",
        event => {

            if(!dragged){
                return;
            }

            event.preventDefault();
            event.stopPropagation();
        },
        true
    );

    render();
}


function openTechnicalArea(){

    createTechnicalArea();

    const screen =
        document.getElementById(
            "btTechnicalAreaScreen"
        );

    if(!screen){
        return;
    }

    screen.classList.add("show");
    document.body.style.overflow = "hidden";
}


function closeTechnicalArea(){

    document
    .getElementById(
        "btTechnicalAreaScreen"
    )
    ?.classList
    .remove(
        "show"
    );

    document.body.style.overflow = "";

    if(
        typeof window.openBoraTecHome
        ===
        "function"
    ){
        window.openBoraTecHome();
    }
}


const btRefrigerantPT = {
    r32:{label:"R32",safety:"A2L",kind:"single",sourceUnit:"psig",source:"Daikin / Hudson",data:[[-40,10.3],[-35,17.8],[-30,26.6],[-25,36.6],[-20,48.1],[-15,61.1],[-10,75.7],[-5,92.1],[0,110.3],[5,130.5],[10,152.8],[15,177.3],[20,204.1],[25,233.4],[30,265.3],[35,300],[40,337.5],[45,378.1],[50,421.8],[55,468.9],[60,519.5],[65,573.9]]},

    r404a:{
        label:"R404A",
        safety:"A1",
        kind:"blend",
        sourceUnit:"barAbs",
        bubble:[
            [-40,1.37],[-30,2.10],[-20,3.09],[-10,4.40],[0,6.11],[10,8.28],
            [15,9.56],[20,10.98],[25,12.55],[30,14.29],[35,16.20],[40,18.29],
            [45,20.58],[50,23.08],[55,25.80],[60,28.75]
        ],
        dew:[
            [-40,1.33],[-30,2.04],[-20,3.02],[-10,4.32],[0,6.01],[10,8.17],
            [15,9.44],[20,10.85],[25,12.42],[30,14.15],[35,16.06],[40,18.15],
            [45,20.44],[50,22.94],[55,25.66],[60,28.63]
        ]
    },
    r22:{label:"R22",safety:"A1",kind:"single",sourceUnit:"psig",source:"Hudson Technologies",data:[[-40,0.5],[-37.2,2.6],[-34.4,4.9],[-31.7,7.4],[-28.9,10.1],[-26.1,13.2],[-23.3,16.5],[-20.6,20.1],[-17.8,24],[-15,28.2],[-12.2,32.8],[-9.4,37.7],[-6.7,43],[-3.9,48.8],[-1.1,54.9],[1.7,61.5],[4.4,68.5],[7.2,76],[10,84],[12.8,92.6],[15.6,102],[18.3,111],[21.1,121],[23.9,132],[26.7,144],[29.4,156],[32.2,168],[35,182],[37.8,196],[40.6,211],[43.3,226],[46.1,243],[48.9,260],[51.7,278],[54.4,297],[57.2,317],[60,337],[62.8,359],[65.6,382]]},
    r410a:{label:"R410A",safety:"A1",kind:"single",sourceUnit:"psig",source:"Hudson Technologies",data:[[-40,11.6],[-37.2,14.9],[-34.4,18.5],[-31.7,22.5],[-28.9,26.9],[-26.1,31.7],[-23.3,36.8],[-20.6,42.5],[-17.8,48.6],[-15,55.2],[-12.2,62.3],[-9.4,70],[-6.7,78.3],[-3.9,87.3],[-1.1,96.8],[1.7,107],[4.4,118],[7.2,130],[10,142],[12.8,155],[15.6,170],[18.3,185],[21.1,201],[23.9,217],[26.7,235],[29.4,254],[32.2,274],[35,295],[37.8,317],[40.6,340],[43.3,365],[46.1,391],[48.9,418],[51.7,446],[54.4,476],[57.2,507],[60,539],[62.8,573],[65.6,608]]},
    r134a:{label:"R134a",safety:"A1",kind:"single",sourceUnit:"psig",source:"Hudson Technologies",data:[[-40,14.8],[-37.2,12.5],[-34.4,9.9],[-31.7,6.9],[-28.9,3.7],[-26.1,0.6],[-23.3,1.9],[-20.6,4],[-17.8,6.5],[-15,9.1],[-12.2,11.9],[-9.4,15],[-6.7,18.4],[-3.9,22.1],[-1.1,26.1],[1.7,30.4],[4.4,35],[7.2,40.1],[10,45.5],[12.8,51.3],[15.6,57.5],[18.3,64.1],[21.1,71.2],[23.9,78.8],[26.7,86.8],[29.4,95.4],[32.2,104],[35,114],[37.8,124],[40.6,135],[43.3,147],[46.1,159],[48.9,171],[51.7,185],[54.4,199],[57.2,214],[60,229],[62.8,246],[65.6,263]]},
    r507:{label:"R507",safety:"A1",kind:"single",sourceUnit:"psig",source:"Hudson Technologies",data:[[-40,5.5],[-37.2,8.2],[-34.4,11.1],[-31.7,14.3],[-28.9,17.8],[-26.1,21.7],[-23.3,25.8],[-20.6,30.3],[-17.8,35.2],[-15,40.5],[-12.2,46.1],[-9.4,52.2],[-6.7,58.8],[-3.9,65.8],[-1.1,73.3],[1.7,81.3],[4.4,89.8],[7.2,98.9],[10,109],[12.8,119],[15.6,130],[18.3,141],[21.1,154],[23.9,167],[26.7,180],[29.4,195],[32.2,210],[35,226],[37.8,244],[40.6,262],[43.3,281],[46.1,301],[48.9,322],[51.7,344],[54.4,368],[57.2,393],[60,419],[62.8,446],[65.6,475]]},
    r502:{label:"R502",safety:"A1",kind:"single",sourceUnit:"psig",source:"Hudson Technologies",data:[[-40,4.1],[-37.2,6.5],[-34.4,9.2],[-31.7,12.1],[-28.9,15.3],[-26.1,18.8],[-23.3,22.6],[-20.6,26.7],[-17.8,31.1],[-15,35.9],[-12.2,41],[-9.4,46.5],[-6.7,52.4],[-3.9,58.8],[-1.1,65.6],[1.7,72.8],[4.4,80.5],[7.2,88.7],[10,97.4],[12.8,107],[15.6,116],[18.3,127],[21.1,138],[23.9,149],[26.7,161],[29.4,174],[32.2,187],[35,201],[37.8,216],[40.6,232],[43.3,248],[46.1,265],[48.9,283],[51.7,301],[54.4,321],[57.2,341],[60,363]]},
    r402a:{label:"R402A",safety:"A1",kind:"single",sourceUnit:"psig",source:"Hudson Technologies",data:[[-40,6.3],[-37.2,9.1],[-34.4,12.1],[-31.7,15.4],[-28.9,18.9],[-26.1,22.9],[-23.3,27.1],[-20.6,31.7],[-17.8,36.7],[-15,42.1],[-12.2,48],[-9.4,54.2],[-6.7,60.9],[-3.9,68.1],[-1.1,75.8],[1.7,84],[4.4,92.8],[7.2,102],[10,112],[12.8,123],[15.6,134],[18.3,146],[21.1,158],[23.9,171],[26.7,185],[29.4,200],[32.2,215],[35,232],[37.8,249],[40.6,267],[43.3,286],[46.1,305],[48.9,326],[51.7,347],[54.4,370],[57.2,393],[60,418],[62.8,443],[65.6,470]]},
    r402b:{label:"R402B",safety:"A1",kind:"single",sourceUnit:"psig",source:"Hudson Technologies",data:[[-40,3.6],[-37.2,6],[-34.4,9],[-31.7,12],[-28.9,15.4],[-26.1,18.6],[-23.3,22.6],[-20.6,27],[-17.8,31],[-15,36],[-12.2,42],[-9.4,47],[-6.7,54],[-3.9,60],[-1.1,67],[1.7,75],[4.4,83.4],[7.2,91.6],[10,100],[12.8,110],[15.6,120],[18.3,133],[21.1,143],[23.9,155],[26.7,170],[29.4,183],[32.2,198],[35,213],[37.8,230],[40.6,247],[43.3,262],[46.1,283],[48.9,303],[51.7,323],[54.4,345]]},
    r408a:{label:"R408A",safety:"A1",kind:"single",sourceUnit:"psig",source:"Hudson Technologies",data:[[-40,2.8],[-37.2,5.1],[-34.4,7.6],[-31.7,10.4],[-28.9,13.5],[-26.1,16.8],[-23.3,20.4],[-20.6,24.4],[-17.8,28.7],[-15,33.3],[-12.2,38.3],[-9.4,43.7],[-6.7,49.5],[-3.9,55.8],[-1.1,62.5],[1.7,69.7],[4.4,77.4],[7.2,85.6],[10,94.3],[12.8,104],[15.6,114],[18.3,124],[21.1,135],[23.9,147],[26.7,159],[29.4,173],[32.2,186],[35,201],[37.8,217],[40.6,233],[43.3,250],[46.1,268],[48.9,287],[51.7,307],[54.4,327],[57.2,349],[60,372]]},
    r422a:{label:"R422A",safety:"A1",kind:"single",sourceUnit:"psig",source:"Hudson Technologies",data:[[-40,5.2],[-37.2,7.8],[-34.4,10.7],[-31.7,13.9],[-28.9,17.3],[-26.1,21.1],[-23.3,25.2],[-20.6,29.6],[-17.8,34.4],[-15,39.6],[-12.2,45.3],[-9.4,51.3],[-6.7,57.8],[-3.9,64.7],[-1.1,72.2],[1.7,80.1],[4.4,88.6],[7.2,97.7],[10,107.3],[12.8,117.5],[15.6,128.4],[18.3,139.9],[21.1,152.1],[23.9,165],[26.7,178.6],[29.4,193],[32.2,208.1],[35,224.1],[37.8,240.9],[40.6,258.5],[43.3,277.1],[46.1,296.6],[48.9,317.1],[51.7,338.6],[54.4,361.2],[57.2,384.9],[60,409.7],[62.8,435.8],[65.6,463.2]]},
    r407c:{label:"R407C",safety:"A1",kind:"blend",sourceUnit:"psig",source:"Hudson Technologies",bubble:[[-40,3],[-37.2,5.4],[-34.4,8],[-31.7,10.9],[-28.9,14.1],[-26.1,17.6],[-23.3,21.3],[-20.6,25.4],[-17.8,29.9],[-15,34.7],[-12.2,39.9],[-9.4,45.6],[-6.7,51.6],[-3.9,58.2],[-1.1,65.2],[1.7,72.6],[4.4,80.7],[7.2,89.2],[10,98.3],[12.8,108],[15.6,118],[18.3,129],[21.1,141],[23.9,153],[26.7,166],[29.4,180],[32.2,195],[35,210],[37.8,226],[40.6,243],[43.3,261],[46.1,280],[48.9,300],[51.7,321],[54.4,342],[57.2,365],[60,389]],dew:[[-40,4.4],[-37.2,0.6],[-34.4,1.8],[-31.7,4.1],[-28.9,6.6],[-26.1,9.4],[-23.3,12.5],[-20.6,15.9],[-17.8,19.6],[-15,23.6],[-12.2,28],[-9.4,32.8],[-6.7,38],[-3.9,43.6],[-1.1,49.6],[1.7,56.1],[4.4,63.1],[7.2,70.6],[10,78.7],[12.8,87.3],[15.6,96.8],[18.3,106],[21.1,117],[23.9,128],[26.7,140],[29.4,153],[32.2,166],[35,181],[37.8,196],[40.6,211],[43.3,229],[46.1,247],[48.9,266],[51.7,286],[54.4,307],[57.2,329],[60,353]]},
    r422d:{label:"R422D",safety:"A1",kind:"blend",sourceUnit:"psig",source:"Hudson Technologies",bubble:[[-40,2.4],[-37.2,4.6],[-34.4,7.1],[-31.7,9.9],[-28.9,12.9],[-26.1,16.2],[-23.3,19.8],[-20.6,23.7],[-17.8,27.9],[-15,32.5],[-12.2,37.5],[-9.4,42.8],[-6.7,48.5],[-3.9,54.7],[-1.1,61.3],[1.7,68.4],[4.4,75.9],[7.2,84],[10,92.6],[12.8,102],[15.6,111],[18.3,122],[21.1,133],[23.9,144],[26.7,156],[29.4,169],[32.2,183],[35,197],[37.8,212],[40.6,228],[43.3,245],[46.1,262],[48.9,281],[51.7,300],[54.4,320],[57.2,341],[60,364],[62.8,387],[65.6,411]],dew:[[-40,1.2],[-37.2,0.8],[-34.4,3],[-31.7,5.4],[-28.9,8.1],[-26.1,11],[-23.3,14.3],[-20.6,17.8],[-17.8,21.7],[-15,25.8],[-12.2,30.4],[-9.4,35.3],[-6.7,40.7],[-3.9,46.4],[-1.1,52.6],[1.7,59.3],[4.4,66.4],[7.2,74],[10,82.2],[12.8,90.9],[15.6,100],[18.3,110],[21.1,121],[23.9,132],[26.7,144],[29.4,156],[32.2,170],[35,184],[37.8,198],[40.6,214],[43.3,231],[46.1,248],[48.9,266],[51.7,286],[54.4,306],[57.2,327],[60,350],[62.8,373],[65.6,398]]},
    r448a:{label:"R448A",safety:"A1",kind:"blend",sourceUnit:"psig",source:"Hudson Technologies",bubble:[[-40,4.9],[-37.2,7.5],[-34.4,10.4],[-31.7,13.5],[-28.9,17],[-26.1,20.8],[-23.3,24.9],[-20.6,29.3],[-17.8,34.2],[-15,39.4],[-12.2,45.1],[-9.4,51.2],[-6.7,57.8],[-3.9,64.8],[-1.1,72.3],[1.7,80.4],[4.4,89],[7.2,98.2],[10,108],[12.8,118],[15.6,129],[18.3,141],[21.1,154],[23.9,167],[26.7,181],[29.4,195],[32.2,211],[35,227],[37.8,244],[40.6,262],[43.3,281],[46.1,300],[48.9,321],[51.7,343],[54.4,365],[57.2,389],[60,414],[62.8,440],[65.6,467]],dew:[[-40,0],[-37.2,2.1],[-34.4,4.4],[-31.7,7],[-28.9,9.8],[-26.1,13],[-23.3,16.4],[-20.6,20.2],[-17.8,24.3],[-15,28.8],[-12.2,33.6],[-9.4,38.9],[-6.7,44.6],[-3.9,50.7],[-1.1,57.3],[1.7,64.4],[4.4,72.1],[7.2,80.3],[10,89],[12.8,98.4],[15.6,108],[18.3,119],[21.1,130],[23.9,142],[26.7,155],[29.4,169],[32.2,183],[35,198],[37.8,214],[40.6,231],[43.3,249],[46.1,268],[48.9,288],[51.7,309],[54.4,331],[57.2,355],[60,379],[62.8,405],[65.6,433]]},
    r449a:{label:"R449A",safety:"A1",kind:"blend",sourceUnit:"psig",source:"Hudson Technologies",bubble:[[-40,4.8],[-37.2,7.4],[-34.4,10.2],[-31.7,13.3],[-28.9,16.7],[-26.1,20.5],[-23.3,24.6],[-20.6,29],[-17.8,33.8],[-15,39],[-12.2,44.6],[-9.4,50.6],[-6.7,57.1],[-3.9,64],[-1.1,71.5],[1.7,79.5],[4.4,88],[7.2,97.1],[10,107],[12.8,117],[15.6,128],[18.3,140],[21.1,152],[23.9,165],[26.7,179],[29.4,193],[32.2,208],[35,224],[37.8,241],[40.6,259],[43.3,278],[46.1,297],[48.9,318],[51.7,339],[54.4,362],[57.2,385],[60,410],[62.8,435],[65.6,462]],dew:[[-40,0],[-37.2,2],[-34.4,4.4],[-31.7,6.9],[-28.9,9.8],[-26.1,12.9],[-23.3,16.3],[-20.6,20.1],[-17.8,24.1],[-15,28.6],[-12.2,33.4],[-9.4,38.6],[-6.7,44.3],[-3.9,50.4],[-1.1,56.9],[1.7,64],[4.4,71.6],[7.2,79.7],[10,88.4],[12.8,97.7],[15.6,108],[18.3,118],[21.1,129],[23.9,141],[26.7,154],[29.4,167],[32.2,182],[35,197],[37.8,213],[40.6,229],[43.3,247],[46.1,266],[48.9,286],[51.7,307],[54.4,329],[57.2,352],[60,376],[62.8,402],[65.6,429]]},
    r450a:{label:"R450A",safety:"A1",kind:"blend",sourceUnit:"psig",source:"Hudson Technologies",bubble:[[-23.3,0],[-20.6,1.9],[-17.8,4],[-15,6.3],[-12.2,8.9],[-9.4,11.6],[-6.7,14.6],[-3.9,17.9],[-1.1,21.4],[1.7,25.2],[4.4,29.4],[7.2,33.8],[10,38.6],[12.8,43.7],[15.6,49.2],[18.3,55.1],[21.1,61.4],[23.9,68.1],[26.7,75.2],[29.4,82.8],[32.2,90.9],[35,99.4],[37.8,109],[40.6,118],[43.3,128],[46.1,139],[48.9,150],[51.7,162],[54.4,175],[57.2,188],[60,202]],dew:[[-23.3,0.8],[-20.6,1.5],[-17.8,3.6],[-15,5.8],[-12.2,8.3],[-9.4,11],[-6.7,13.9],[-3.9,17.1],[-1.1,20.6],[1.7,24.3],[4.4,28.4],[7.2,32.8],[10,37.5],[12.8,42.5],[15.6,47.9],[18.3,53.7],[21.1,59.9],[23.9,66.5],[26.7,73.5],[29.4,81],[32.2,89],[35,97.4],[37.8,106],[40.6,116],[43.3,126],[46.1,136],[48.9,148],[51.7,159],[54.4,172],[57.2,185],[60,199]]},
    r452a:{label:"R452A",safety:"A1",kind:"blend",sourceUnit:"psig",source:"Hudson Technologies",bubble:[[-40,5.7],[-37.2,8.5],[-34.4,11.4],[-31.7,14.7],[-28.9,18.2],[-26.1,22.1],[-23.3,26.4],[-20.6,31],[-17.8,35.9],[-15,41.3],[-12.2,47.1],[-9.4,53.4],[-6.7,60.1],[-3.9,67.3],[-1.1,75],[1.7,83.2],[4.4,92],[7.2,101],[10,111],[12.8,122],[15.6,133],[18.3,145],[21.1,157],[23.9,171],[26.7,185],[29.4,199],[32.2,215],[35,231],[37.8,248],[40.6,267],[43.3,286],[46.1,305],[48.9,326],[51.7,348],[54.4,371],[57.2,395],[60,420]],dew:[[-40,2.4],[-37.2,4.7],[-34.4,7.3],[-31.7,10.2],[-28.9,13.3],[-26.1,16.7],[-23.3,20.4],[-20.6,24.4],[-17.8,28.8],[-15,33.6],[-12.2,38.8],[-9.4,44.4],[-6.7,50.4],[-3.9,56.9],[-1.1,63.8],[1.7,71.3],[4.4,79.2],[7.2,87.8],[10,96.9],[12.8,107],[15.6,117],[18.3,128],[21.1,140],[23.9,152],[26.7,165],[29.4,179],[32.2,194],[35,209],[37.8,226],[40.6,243],[43.3,261],[46.1,281],[48.9,301],[51.7,322],[54.4,345],[57.2,369],[60,394]]}
};


function btPressureToPsig(value,unit){

    if(unit === "psig"){
        return value;
    }

    if(unit === "barg"){
        return value * 14.5037738;
    }

    if(unit === "kpag"){
        return value * 0.145037738;
    }

    return value;
}


function btDatasetPressurePsig(point,sourceUnit){

    const temp = point[0];
    const pressure = point[1];

    if(sourceUnit === "barAbs"){
        return [
            temp,
            (pressure - 1.01325) * 14.5037738
        ];
    }

    return [temp,pressure];
}


function btInterpolateTempFromPressure(dataset,sourceUnit,psig){

    const points = dataset
        .map(point => btDatasetPressurePsig(point,sourceUnit))
        .sort((a,b) => a[1] - b[1]);

    if(psig < points[0][1] || psig > points[points.length - 1][1]){
        return null;
    }

    for(let index = 0; index < points.length - 1; index++){

        const a = points[index];
        const b = points[index + 1];

        if(psig >= a[1] && psig <= b[1]){

            if(b[1] === a[1]){
                return a[0];
            }

            const ratio =
                (psig - a[1]) /
                (b[1] - a[1]);

            return a[0] + ratio * (b[0] - a[0]);
        }
    }

    return null;
}


function btFormatCelsius(value){
    return `${value.toFixed(1).replace(".",",")} °C`;
}


function btCelsiusToFahrenheit(value){
    return (value * 9 / 5) + 32;
}


function renderTechnicalGasTool(){

    const workspace =
        document.getElementById(
            "btTechnicalWorkspace"
        );

    if(!workspace){
        return;
    }

    workspace.innerHTML = `
        <div class="bt-tech-workspace-title">
            <div>
                <strong>Gases • Temperatura de saturação</strong>
                <span>Informe a pressão medida no manifold para consultar a temperatura de saturação.</span>
            </div>
        </div>

        <div class="bt-tech-gas-grid">
            <div class="bt-tech-field full">
                <label for="btTechGasSelect">Refrigerante</label>
                <select id="btTechGasSelect">
                    <option value="r32">R32</option>
                    <option value="r410a">R410A</option>
                    <option value="r22">R22</option>
                    <option value="r134a">R134a</option>
                    <option value="r404a">R404A</option>
                    <option value="r407c">R407C</option>
                    <option value="r448a">R448A</option>
                    <option value="r449a">R449A</option>
                    <option value="r450a">R450A</option>
                    <option value="r452a">R452A</option>
                    <option value="r507">R507</option>
                    <option value="r502">R502</option>
                    <option value="r402a">R402A</option>
                    <option value="r402b">R402B</option>
                    <option value="r408a">R408A</option>
                    <option value="r422a">R422A</option>
                    <option value="r422d">R422D</option>
                </select>
            </div>

            <div class="bt-tech-field">
                <label for="btTechGasPressure">Pressão</label>
                <input
                    id="btTechGasPressure"
                    type="number"
                    inputmode="decimal"
                    step="0.1"
                    placeholder="Ex.: 118"
                >
            </div>

            <div class="bt-tech-field">
                <label for="btTechGasUnit">Unidade</label>
                <select id="btTechGasUnit">
                    <option value="psig">PSI (g)</option>
                    <option value="barg">bar (g)</option>
                    <option value="kpag">kPa (g)</option>
                </select>
            </div>
        </div>

        <button
            id="btTechGasCalculate"
            class="bt-tech-calc-button"
            type="button"
        >CALCULAR SATURAÇÃO</button>

        <div id="btTechGasResult" class="bt-tech-result" style="display:none"></div>

        <div class="bt-tech-info-note">
            Pressões de entrada são manométricas (gauge). Para misturas com glide, o BoraTec mostra ponto de orvalho (dew) e ponto de bolha (bubble) separadamente. Base P-T validada em tabelas técnicas Hudson/Daikin.
        </div>
    `;

    workspace.classList.add("show");

    const button =
        document.getElementById(
            "btTechGasCalculate"
        );

    button?.addEventListener(
        "click",
        calculateTechnicalGasSaturation
    );
}


function calculateTechnicalGasSaturation(){

    const gasKey =
        document.getElementById(
            "btTechGasSelect"
        )?.value;

    const pressureRaw =
        document.getElementById(
            "btTechGasPressure"
        )?.value;

    const unit =
        document.getElementById(
            "btTechGasUnit"
        )?.value;

    const result =
        document.getElementById(
            "btTechGasResult"
        );

    if(!result){
        return;
    }

    const pressure =
        Number(
            String(pressureRaw || "")
            .replace(",",".")
        );

    if(!Number.isFinite(pressure) || pressure < 0){
        result.style.display = "block";
        result.innerHTML = `
            <div class="bt-tech-result-label">Verifique o valor</div>
            <div class="bt-tech-result-secondary">Informe uma pressão válida e maior ou igual a zero.</div>
        `;
        return;
    }

    const gas =
        btRefrigerantPT[gasKey];

    if(!gas){
        return;
    }

    const psig =
        btPressureToPsig(
            pressure,
            unit
        );

    result.style.display = "block";

    if(gas.kind === "blend"){

        const dew =
            btInterpolateTempFromPressure(
                gas.dew,
                gas.sourceUnit,
                psig
            );

        const bubble =
            btInterpolateTempFromPressure(
                gas.bubble,
                gas.sourceUnit,
                psig
            );

        if(dew === null || bubble === null){
            result.innerHTML = `
                <div class="bt-tech-result-label">Fora da faixa da tabela</div>
                <div class="bt-tech-result-secondary">A pressão informada está fora da faixa disponível nesta primeira versão.</div>
            `;
            return;
        }

        result.innerHTML = `
            <div class="bt-tech-result-label">${gas.label} • Saturação</div>
            <div class="bt-tech-result-value">${btFormatCelsius(dew)}</div>
            <div class="bt-tech-result-secondary">
                <strong>Dew / vapor:</strong> ${btFormatCelsius(dew)} (${btCelsiusToFahrenheit(dew).toFixed(1)} °F)<br>
                <strong>Bubble / líquido:</strong> ${btFormatCelsius(bubble)} (${btCelsiusToFahrenheit(bubble).toFixed(1)} °F)<br>
                Use <strong>dew</strong> para superaquecimento e <strong>bubble</strong> para sub-resfriamento.
            </div>
        `;

        return;
    }

    const saturation =
        btInterpolateTempFromPressure(
            gas.data,
            gas.sourceUnit,
            psig
        );

    if(saturation === null){
        result.innerHTML = `
            <div class="bt-tech-result-label">Fora da faixa da tabela</div>
            <div class="bt-tech-result-secondary">A pressão informada está fora da faixa disponível nesta primeira versão.</div>
        `;
        return;
    }

    const safetyText =
        gas.safety === "A2L"
        ? " • A2L"
        : "";

    result.innerHTML = `
        <div class="bt-tech-result-label">${gas.label}${safetyText} • Temperatura de saturação</div>
        <div class="bt-tech-result-value">${btFormatCelsius(saturation)}</div>
        <div class="bt-tech-result-secondary">
            ${btCelsiusToFahrenheit(saturation).toFixed(1)} °F • pressão informada: ${pressure.toLocaleString("pt-BR")} ${unit === "psig" ? "PSI(g)" : unit === "barg" ? "bar(g)" : "kPa(g)"}
        </div>
    `;
}


function btGetSuperheatSaturationC(gasKey,psig){

    const gas =
        btRefrigerantPT[gasKey];

    if(!gas){
        return null;
    }

    if(gas.kind === "blend"){
        return btInterpolateTempFromPressure(
            gas.dew,
            gas.sourceUnit,
            psig
        );
    }

    return btInterpolateTempFromPressure(
        gas.data,
        gas.sourceUnit,
        psig
    );
}


function renderTechnicalSuperheatTool(){

    const workspace =
        document.getElementById(
            "btTechnicalWorkspace"
        );

    if(!workspace){
        return;
    }

    const gasOptions =
        Object.entries(btRefrigerantPT)
        .map(([key,gas]) =>
            `<option value="${key}">${gas.label}</option>`
        )
        .join("");

    workspace.innerHTML = `
        <div class="bt-tech-workspace-title">
            <div>
                <strong>Superaquecimento</strong>
                <span>Informe a pressão de sucção e a temperatura real da linha de sucção.</span>
            </div>
        </div>

        <div class="bt-tech-gas-grid">
            <div class="bt-tech-field full">
                <label for="btTechSuperheatGas">Refrigerante</label>
                <select id="btTechSuperheatGas">
                    ${gasOptions}
                </select>
            </div>

            <div class="bt-tech-field">
                <label for="btTechSuperheatPressure">Pressão de sucção</label>
                <input
                    id="btTechSuperheatPressure"
                    type="number"
                    inputmode="decimal"
                    step="0.1"
                    placeholder="Ex.: 118"
                >
            </div>

            <div class="bt-tech-field">
                <label for="btTechSuperheatPressureUnit">Unidade</label>
                <select id="btTechSuperheatPressureUnit">
                    <option value="psig">PSI (g)</option>
                    <option value="barg">bar (g)</option>
                    <option value="kpag">kPa (g)</option>
                </select>
            </div>

            <div class="bt-tech-field full">
                <label for="btTechSuperheatLineTemp">Temperatura da linha de sucção (°C)</label>
                <input
                    id="btTechSuperheatLineTemp"
                    type="number"
                    inputmode="decimal"
                    step="0.1"
                    placeholder="Ex.: 12"
                >
            </div>
        </div>

        <button
            id="btTechSuperheatCalculate"
            class="bt-tech-calc-button"
            type="button"
        >CALCULAR SUPERAQUECIMENTO</button>

        <div
            id="btTechSuperheatResult"
            class="bt-tech-result"
            style="display:none"
        ></div>

        <div class="bt-tech-info-note">
            Fórmula: temperatura real da linha de sucção − temperatura de saturação. Em refrigerantes com glide, o BoraTec usa automaticamente o ponto <strong>Dew / vapor</strong> para o cálculo.
        </div>
    `;

    workspace.classList.add("show");

    document
    .getElementById(
        "btTechSuperheatCalculate"
    )
    ?.addEventListener(
        "click",
        calculateTechnicalSuperheat
    );
}


function calculateTechnicalSuperheat(){

    const gasKey =
        document.getElementById(
            "btTechSuperheatGas"
        )?.value;

    const pressureRaw =
        document.getElementById(
            "btTechSuperheatPressure"
        )?.value;

    const pressureUnit =
        document.getElementById(
            "btTechSuperheatPressureUnit"
        )?.value;

    const lineTempRaw =
        document.getElementById(
            "btTechSuperheatLineTemp"
        )?.value;

    const result =
        document.getElementById(
            "btTechSuperheatResult"
        );

    if(!result){
        return;
    }

    const pressure =
        Number(
            String(pressureRaw || "")
            .replace(",",".")
        );

    const lineTemp =
        Number(
            String(lineTempRaw || "")
            .replace(",",".")
        );

    if(
        !Number.isFinite(pressure)
        ||
        pressure < 0
        ||
        !Number.isFinite(lineTemp)
    ){
        result.style.display = "block";
        result.innerHTML = `
            <div class="bt-tech-result-label">Verifique os valores</div>
            <div class="bt-tech-result-secondary">Informe uma pressão válida e a temperatura medida na linha de sucção.</div>
        `;
        return;
    }

    const gas =
        btRefrigerantPT[gasKey];

    if(!gas){
        return;
    }

    const psig =
        btPressureToPsig(
            pressure,
            pressureUnit
        );

    const saturation =
        btGetSuperheatSaturationC(
            gasKey,
            psig
        );

    result.style.display = "block";

    if(saturation === null){
        result.innerHTML = `
            <div class="bt-tech-result-label">Fora da faixa da tabela</div>
            <div class="bt-tech-result-secondary">A pressão informada está fora da faixa P-T disponível para ${gas.label}.</div>
        `;
        return;
    }

    const superheat =
        lineTemp - saturation;

    const blendText =
        gas.kind === "blend"
        ? " • saturação Dew / vapor"
        : "";

    const negativeNote =
        superheat < 0
        ? `<br><strong>Atenção:</strong> o resultado ficou negativo. Confira pressão, refrigerante selecionado e posição/contato do sensor de temperatura.`
        : "";

    result.innerHTML = `
        <div class="bt-tech-result-label">${gas.label} • Superaquecimento</div>
        <div class="bt-tech-result-value">${btFormatCelsius(superheat)}</div>
        <div class="bt-tech-result-secondary">
            Temperatura de saturação: <strong>${btFormatCelsius(saturation)}</strong>${blendText}<br>
            Temperatura da linha: <strong>${btFormatCelsius(lineTemp)}</strong><br>
            Cálculo: ${lineTemp.toFixed(1).replace(".",",")} − ${saturation.toFixed(1).replace(".",",")} = <strong>${superheat.toFixed(1).replace(".",",")} °C</strong>${negativeNote}
        </div>
    `;
}



function btGetSubcoolingSaturationC(gasKey,psig){

    const gas =
        btRefrigerantPT[gasKey];

    if(!gas){
        return null;
    }

    if(gas.kind === "blend"){
        return btInterpolateTempFromPressure(
            gas.bubble,
            gas.sourceUnit,
            psig
        );
    }

    return btInterpolateTempFromPressure(
        gas.data,
        gas.sourceUnit,
        psig
    );
}


function renderTechnicalSubcoolingTool(){

    const workspace =
        document.getElementById(
            "btTechnicalWorkspace"
        );

    if(!workspace){
        return;
    }

    const gasOptions =
        Object.entries(btRefrigerantPT)
        .map(([key,gas]) =>
            `<option value="${key}">${gas.label}</option>`
        )
        .join("");

    workspace.innerHTML = `
        <div class="bt-tech-workspace-title">
            <div>
                <strong>Sub-resfriamento</strong>
                <span>Informe a pressão de alta e a temperatura real da linha de líquido.</span>
            </div>
        </div>

        <div class="bt-tech-gas-grid">
            <div class="bt-tech-field full">
                <label for="btTechSubcoolGas">Refrigerante</label>
                <select id="btTechSubcoolGas">
                    ${gasOptions}
                </select>
            </div>

            <div class="bt-tech-field">
                <label for="btTechSubcoolPressure">Pressão de alta</label>
                <input
                    id="btTechSubcoolPressure"
                    type="number"
                    inputmode="decimal"
                    step="0.1"
                    placeholder="Ex.: 360"
                >
            </div>

            <div class="bt-tech-field">
                <label for="btTechSubcoolPressureUnit">Unidade</label>
                <select id="btTechSubcoolPressureUnit">
                    <option value="psig">PSI (g)</option>
                    <option value="barg">bar (g)</option>
                    <option value="kpag">kPa (g)</option>
                </select>
            </div>

            <div class="bt-tech-field full">
                <label for="btTechSubcoolLineTemp">Temperatura da linha de líquido (°C)</label>
                <input
                    id="btTechSubcoolLineTemp"
                    type="number"
                    inputmode="decimal"
                    step="0.1"
                    placeholder="Ex.: 35"
                >
            </div>
        </div>

        <button
            id="btTechSubcoolCalculate"
            class="bt-tech-calc-button"
            type="button"
        >CALCULAR SUB-RESFRIAMENTO</button>

        <div
            id="btTechSubcoolResult"
            class="bt-tech-result"
            style="display:none"
        ></div>

        <div class="bt-tech-info-note">
            Fórmula: temperatura de saturação da condensação − temperatura real da linha de líquido. Em refrigerantes com glide, o BoraTec usa automaticamente o ponto <strong>Bubble / líquido</strong> para o cálculo.
        </div>
    `;

    workspace.classList.add("show");

    document
    .getElementById(
        "btTechSubcoolCalculate"
    )
    ?.addEventListener(
        "click",
        calculateTechnicalSubcooling
    );
}


function calculateTechnicalSubcooling(){

    const gasKey =
        document.getElementById(
            "btTechSubcoolGas"
        )?.value;

    const pressureRaw =
        document.getElementById(
            "btTechSubcoolPressure"
        )?.value;

    const pressureUnit =
        document.getElementById(
            "btTechSubcoolPressureUnit"
        )?.value;

    const lineTempRaw =
        document.getElementById(
            "btTechSubcoolLineTemp"
        )?.value;

    const result =
        document.getElementById(
            "btTechSubcoolResult"
        );

    if(!result){
        return;
    }

    const pressure =
        Number(
            String(pressureRaw || "")
            .replace(",",".")
        );

    const lineTemp =
        Number(
            String(lineTempRaw || "")
            .replace(",",".")
        );

    if(
        !Number.isFinite(pressure)
        ||
        pressure < 0
        ||
        !Number.isFinite(lineTemp)
    ){
        result.style.display = "block";
        result.innerHTML = `
            <div class="bt-tech-result-label">Verifique os valores</div>
            <div class="bt-tech-result-secondary">Informe uma pressão válida e a temperatura medida na linha de líquido.</div>
        `;
        return;
    }

    const gas =
        btRefrigerantPT[gasKey];

    if(!gas){
        return;
    }

    const psig =
        btPressureToPsig(
            pressure,
            pressureUnit
        );

    const saturation =
        btGetSubcoolingSaturationC(
            gasKey,
            psig
        );

    result.style.display = "block";

    if(saturation === null){
        result.innerHTML = `
            <div class="bt-tech-result-label">Fora da faixa da tabela</div>
            <div class="bt-tech-result-secondary">A pressão informada está fora da faixa P-T disponível para ${gas.label}.</div>
        `;
        return;
    }

    const subcooling =
        saturation - lineTemp;

    const blendText =
        gas.kind === "blend"
        ? " • saturação Bubble / líquido"
        : "";

    const negativeNote =
        subcooling < 0
        ? `<br><strong>Atenção:</strong> o resultado ficou negativo. Confira pressão, refrigerante selecionado e posição/contato do sensor de temperatura.`
        : "";

    result.innerHTML = `
        <div class="bt-tech-result-label">${gas.label} • Sub-resfriamento</div>
        <div class="bt-tech-result-value">${btFormatCelsius(subcooling)}</div>
        <div class="bt-tech-result-secondary">
            Temperatura de saturação: <strong>${btFormatCelsius(saturation)}</strong>${blendText}<br>
            Temperatura da linha de líquido: <strong>${btFormatCelsius(lineTemp)}</strong><br>
            Cálculo: ${saturation.toFixed(1).replace(".",",")} − ${lineTemp.toFixed(1).replace(".",",")} = <strong>${subcooling.toFixed(1).replace(".",",")} °C</strong>${negativeNote}
        </div>
    `;
}


function renderTechnicalPressureConverter(){

    const workspace =
        document.getElementById(
            "btTechnicalWorkspace"
        );

    if(!workspace){
        return;
    }

    workspace.innerHTML = `
        <div class="bt-tech-workspace-title">
            <div>
                <strong>Conversão de pressão</strong>
                <span>Converta rapidamente entre PSI, bar, kPa e MPa.</span>
            </div>
        </div>

        <div class="bt-tech-gas-grid">
            <div class="bt-tech-field full">
                <label for="btTechPressureValue">Valor</label>
                <input
                    id="btTechPressureValue"
                    type="number"
                    inputmode="decimal"
                    step="any"
                    placeholder="Ex.: 120"
                >
            </div>

            <div class="bt-tech-field">
                <label for="btTechPressureFrom">De</label>
                <select id="btTechPressureFrom">
                    <option value="psi">PSI</option>
                    <option value="bar">bar</option>
                    <option value="kpa">kPa</option>
                    <option value="mpa">MPa</option>
                </select>
            </div>

            <div class="bt-tech-field">
                <label for="btTechPressureTo">Para</label>
                <select id="btTechPressureTo">
                    <option value="bar">bar</option>
                    <option value="psi">PSI</option>
                    <option value="kpa">kPa</option>
                    <option value="mpa">MPa</option>
                </select>
            </div>
        </div>

        <button
            id="btTechPressureConvert"
            class="bt-tech-calc-button"
            type="button"
        >CONVERTER PRESSÃO</button>

        <div
            id="btTechPressureResult"
            class="bt-tech-result"
            style="display:none"
        ></div>

        <div class="bt-tech-info-note">
            Conversão matemática direta entre unidades de pressão. Esta ferramenta converte o valor informado e não altera entre pressão absoluta e pressão manométrica.
        </div>
    `;

    workspace.classList.add("show");

    document
    .getElementById(
        "btTechPressureConvert"
    )
    ?.addEventListener(
        "click",
        calculateTechnicalPressureConversion
    );
}


function btPressureUnitToPa(value,unit){

    const factors = {
        psi:6894.757293168,
        bar:100000,
        kpa:1000,
        mpa:1000000
    };

    const factor =
        factors[unit];

    if(!factor){
        return null;
    }

    return value * factor;
}


function btPressurePaToUnit(valuePa,unit){

    const factors = {
        psi:6894.757293168,
        bar:100000,
        kpa:1000,
        mpa:1000000
    };

    const factor =
        factors[unit];

    if(!factor){
        return null;
    }

    return valuePa / factor;
}


function btPressureUnitLabel(unit){

    const labels = {
        psi:"PSI",
        bar:"bar",
        kpa:"kPa",
        mpa:"MPa"
    };

    return labels[unit] || unit;
}


function btFormatPressureConversion(value){

    if(!Number.isFinite(value)){
        return "—";
    }

    const absolute =
        Math.abs(value);

    let decimals = 3;

    if(absolute >= 1000){
        decimals = 1;
    }
    else if(absolute >= 100){
        decimals = 2;
    }
    else if(absolute < 1){
        decimals = 4;
    }

    return value.toLocaleString(
        "pt-BR",
        {
            minimumFractionDigits:0,
            maximumFractionDigits:decimals
        }
    );
}


function calculateTechnicalPressureConversion(){

    const rawValue =
        document.getElementById(
            "btTechPressureValue"
        )?.value;

    const fromUnit =
        document.getElementById(
            "btTechPressureFrom"
        )?.value;

    const toUnit =
        document.getElementById(
            "btTechPressureTo"
        )?.value;

    const result =
        document.getElementById(
            "btTechPressureResult"
        );

    if(!result){
        return;
    }

    const value =
        Number(
            String(rawValue || "")
            .replace(",",".")
        );

    if(!Number.isFinite(value)){
        result.style.display = "block";
        result.innerHTML = `
            <div class="bt-tech-result-label">Verifique o valor</div>
            <div class="bt-tech-result-secondary">Informe uma pressão válida para converter.</div>
        `;
        return;
    }

    const valuePa =
        btPressureUnitToPa(
            value,
            fromUnit
        );

    const converted =
        btPressurePaToUnit(
            valuePa,
            toUnit
        );

    if(
        valuePa === null
        ||
        converted === null
        ||
        !Number.isFinite(converted)
    ){
        result.style.display = "block";
        result.innerHTML = `
            <div class="bt-tech-result-label">Não foi possível converter</div>
            <div class="bt-tech-result-secondary">Confira as unidades selecionadas.</div>
        `;
        return;
    }

    result.style.display = "block";
    result.innerHTML = `
        <div class="bt-tech-result-label">Conversão de pressão</div>
        <div class="bt-tech-result-value">${btFormatPressureConversion(converted)} ${btPressureUnitLabel(toUnit)}</div>
        <div class="bt-tech-result-secondary">
            ${btFormatPressureConversion(value)} ${btPressureUnitLabel(fromUnit)} = <strong>${btFormatPressureConversion(converted)} ${btPressureUnitLabel(toUnit)}</strong>
        </div>
    `;
}


function openTechnicalCalculator(type){

    if(type === "gases"){
        renderTechnicalGasTool();

        window.setTimeout(
            () => {
                document
                .getElementById(
                    "btTechnicalWorkspace"
                )
                ?.scrollIntoView({
                    behavior:"smooth",
                    block:"start"
                });
            },
            40
        );

        return;
    }

    if(type === "superaquecimento"){
        renderTechnicalSuperheatTool();

        window.setTimeout(
            () => {
                document
                .getElementById(
                    "btTechnicalWorkspace"
                )
                ?.scrollIntoView({
                    behavior:"smooth",
                    block:"start"
                });
            },
            40
        );

        return;
    }

    if(type === "subresfriamento"){
        renderTechnicalSubcoolingTool();

        window.setTimeout(
            () => {
                document
                .getElementById(
                    "btTechnicalWorkspace"
                )
                ?.scrollIntoView({
                    behavior:"smooth",
                    block:"start"
                });
            },
            40
        );

        return;
    }

    if(type === "pressao"){
        renderTechnicalPressureConverter();

        window.setTimeout(
            () => {
                document
                .getElementById(
                    "btTechnicalWorkspace"
                )
                ?.scrollIntoView({
                    behavior:"smooth",
                    block:"start"
                });
            },
            40
        );

        return;
    }

    const names = {
        btu:"Calculadora de BTU/h",
        superaquecimento:"Superaquecimento",
        subresfriamento:"Sub-resfriamento",
        pressao:"Conversão de pressão",
        temperatura:"Conversão de temperatura",
        eletrica:"Elétrica"
    };

    if(
        typeof window.showToast
        ===
        "function"
    ){
        window.showToast(
            `${names[type] || "Ferramenta"} em preparação`
        );
    }
}


window.openTechnicalArea =
    openTechnicalArea;

window.closeTechnicalArea =
    closeTechnicalArea;

window.openTechnicalCalculator =
    openTechnicalCalculator;


/* =========================================================
   INSTALAÇÃO DO APP
========================================================= */

let btInstallPrompt = null;


window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();

        btInstallPrompt =
            event;

        document
        .getElementById(
            "btInstallAppButton"
        )
        ?.classList
        .add(
            "show"
        );
    }
);


document.addEventListener(
    "click",
    async event => {

        if(
            event.target?.id
            !==
            "btInstallAppButton"
        ){
            return;
        }

        if(!btInstallPrompt){

            showToast(
                "No Chrome: toque em ⋮ e escolha Instalar app / Adicionar à tela inicial"
            );

            return;
        }

        btInstallPrompt.prompt();

        await btInstallPrompt.userChoice;

        btInstallPrompt =
            null;

        document
        .getElementById(
            "btInstallAppButton"
        )
        ?.classList
        .remove(
            "show"
        );
    }
);



function isBoraTecStandalone(){

    return (
        window.matchMedia(
            "(display-mode: standalone)"
        )
        .matches
        ||
        window.navigator.standalone
        ===
        true
    );
}


function createBoraTecSplash(){

    if(
        document.getElementById(
            "btAppSplash"
        )
    ){
        return;
    }

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "btAppSplashStyle";

    style.textContent = `
        #btAppSplash{
            position:fixed;
            inset:0;
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#06182b;
            opacity:1;
            transition:opacity .28s ease;
        }

        #btAppSplash.hide{
            opacity:0;
            pointer-events:none;
        }

        .bt-splash-inner{
            text-align:center;
            color:#fff;
        }

        .bt-splash-logo{
            width:112px;
            height:112px;
            margin:0 auto 16px;
            border-radius:26px;
            overflow:hidden;
            box-shadow:0 16px 45px rgba(0,0,0,.28);
        }

        .bt-splash-logo img{
            width:100%;
            height:100%;
            object-fit:cover;
            display:block;
        }

        .bt-splash-name{
            font-size:24px;
            font-weight:950;
            letter-spacing:.2px;
        }

        .bt-splash-tag{
            margin-top:5px;
            color:#8ea5b8;
            font-size:10px;
            letter-spacing:.9px;
            text-transform:uppercase;
        }
    `;

    document.head.appendChild(
        style
    );

    const splash =
        document.createElement(
            "div"
        );

    splash.id =
        "btAppSplash";

    splash.innerHTML = `
        <div class="bt-splash-inner">
            <div class="bt-splash-logo">
                <img
                    src="./icons/icon-512.png"
                    alt="BoraTec"
                >
            </div>

            <div class="bt-splash-name">
                BoraTec
            </div>

            <div class="bt-splash-tag">
                Profissionais conectando profissionais
            </div>
        </div>
    `;

    document.body.appendChild(
        splash
    );

    setTimeout(
        () => {

            splash.classList.add(
                "hide"
            );

            setTimeout(
                () =>
                    splash.remove(),
                320
            );
        },
        900
    );
}


function showInstallHelpIfNeeded(){

    if(
        isBoraTecStandalone()
    ){
        return;
    }

    const btn =
        document.getElementById(
            "btInstallAppButton"
        );

    if(btn){
        btn.classList.add(
            "show"
        );

        if(!btInstallPrompt){
            btn.textContent =
                "📲 Instalar / adicionar BoraTec à tela inicial";
        }
    }
}

function setupStandaloneBehavior(){

    if(
        isBoraTecStandalone()
    ){

        document.documentElement
        .classList
        .add(
            "bt-standalone"
        );

        document.body
        ?.classList
        .add(
            "bt-standalone"
        );
    }
    else{

        document.documentElement
        .classList
        .add(
            "bt-browser-mode"
        );
    }
}

window.openBoraTecHome =
    openBoraTecHome;

window.closeBoraTecHome =
    closeBoraTecHome;

window.btHomeOpenPublish =
    btHomeOpenPublish;

window.btHomeOpenProfessionals =
    btHomeOpenProfessionals;

window.openCommunityFromHome =
    openCommunityFromHome;

window.openMyBoraTecProfileFromHome =
    openMyBoraTecProfileFromHome;
/* =========================================================
   MENU V1.0
========================================================= */

const boraTecSelectNavBeforeV1 =
    window.selectNav
    ||
    selectNav;

selectNav =
function(
    button,
    page
){

    const normalized =
        String(page || "")
        .trim()
        .toLowerCase();

    if(
        normalized === "início"
        ||
        normalized === "inicio"
        ||
        normalized === "home"
    ){

        openBoraTecHome();
        return;
    }


    if(
        normalized === "comunidade"
        ||
        normalized === "community"
    ){

        closeBoraTecHome();
        openCommunity();
        return;
    }


    if(normalized === "perfil"){

        if(boraUser?.id){
            openPublicProfile(
                boraUser.id
            );
        }

        return;
    }

    if(
        normalized === "notificações"
        ||
        normalized === "notificacoes"
    ){
        openNotifications();
        return;
    }

    return boraTecSelectNavBeforeV1(
        button,
        page
    );
};


/* =========================================================
   INICIALIZAÇÃO V1.0
========================================================= */

async function initializeBoraTecV1(){

    setupBoraTecPWA();

    setupStandaloneBehavior();

    createBoraTecSplash();

    createBoraTecV1Interface();

    createCommunityInterface();

    createBoraTecHome();

    setupCommunityNav();

    setupBoraTecDeleteStyles();

    setupV14MainTabs();

    setupAvailabilityDateTimeField();

    setupHelperAvailabilityPublishOption();

    let attempts = 0;

    const waitForAuth =
        setInterval(
            async () => {

                attempts++;

                if(
                    boraSupabase
                    &&
                    boraUser
                ){

                    clearInterval(
                        waitForAuth
                    );

                    await refreshNotificationBadge();

                    listenNotificationsRealtime();

                    listenCommunityRealtime();

                    setupCommunityNav();

                    setupHelperAvailabilityPublishOption();

                    await loadBoraTecHome();

                    openBoraTecHome();

                    showInstallHelpIfNeeded();

                    return;
                }

                if(attempts >= 20){
                    clearInterval(
                        waitForAuth
                    );
                }

            },
            250
        );
}


/* =========================================================
   GLOBAL V1.0
========================================================= */

window.selectNav =
    selectNav;

window.openFeedFilters =
    openFeedFilters;

window.closeFeedFilters =
    closeFeedFilters;

window.applyFeedFiltersFromUI =
    applyFeedFiltersFromUI;

window.clearFeedFilters =
    clearFeedFilters;

window.openPublicProfile =
    openPublicProfile;

window.openInterestedProfile =
    openInterestedProfile;

window.chatFromPublicProfile =
    chatFromPublicProfile;

window.closePublicProfile =
    closePublicProfile;

window.saveOwnProfessionalProfile =
    saveOwnProfessionalProfile;

window.openInterestedProfessionals =
    openInterestedProfessionals;

window.closeInterestedProfessionals =
    closeInterestedProfessionals;

window.openInterestConversation =
    openInterestConversation;

window.openNotifications =
    openNotifications;

window.closeNotifications =
    closeNotifications;

window.markAllNotificationsRead =
    markAllNotificationsRead;

window.clearAllNotifications =
    clearAllNotifications;

window.openNotificationItem =
    openNotificationItem;


/* =========================================================
   DOM READY V1.0
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeBoraTecV1
);


function setupBoraTecV18HomeStyle(){

    if(document.getElementById("btV18HomeStyle")){
        return;
    }

    const style = document.createElement("style");
    style.id = "btV18HomeStyle";
    style.textContent = `
/* ===== BORATEC V1.8 HOME ===== */
#btHomeScreen{
    background:
        radial-gradient(circle at 85% -10%, rgba(22,123,190,.18), transparent 34%),
        linear-gradient(180deg,#06182b 0%,#071a2e 100%) !important;
}

#btHomeScreen .bt-home-shell{
    width:min(100%,680px) !important;
    margin:0 auto !important;
    padding:22px 18px 110px !important;
}

.bt-v18-top{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:14px;
    margin-bottom:24px;
}

.bt-v18-brand{
    display:flex;
    align-items:center;
    gap:11px;
}

.bt-v18-brand img{
    width:42px;
    height:42px;
    border-radius:12px;
    object-fit:cover;
    box-shadow:0 8px 22px rgba(0,0,0,.24);
}

.bt-v18-brand-name{
    color:#fff;
    font-size:20px;
    line-height:1;
    font-weight:950;
    letter-spacing:-.4px;
}

.bt-v18-brand-tag{
    color:#7890a7;
    font-size:9px;
    margin-top:5px;
    text-transform:uppercase;
    letter-spacing:.7px;
}

.bt-v18-user{
    width:42px;
    height:42px;
    border-radius:50%;
    border:2px solid rgba(255,132,0,.75);
    background:#0d2943;
    color:#fff;
    display:flex;
    align-items:center;
    justify-content:center;
    font-weight:900;
    overflow:hidden;
    cursor:pointer;
}

.bt-v18-user img{
    width:100%;
    height:100%;
    object-fit:cover;
}

.bt-v18-welcome{
    margin-bottom:22px;
}

.bt-v18-kicker{
    color:#7f98af;
    font-size:12px;
    font-weight:750;
    text-transform:uppercase;
    letter-spacing:.8px;
}

.bt-v18-title{
    margin-top:5px;
    color:#fff;
    font-size:27px;
    line-height:1.12;
    font-weight:950;
    letter-spacing:-.7px;
}

.bt-v18-title span{
    color:#ff8500;
}

.bt-v18-subtitle{
    margin-top:8px;
    color:#8da3b7;
    font-size:13px;
    line-height:1.45;
}

.bt-v18-section-title{
    color:#fff;
    font-size:14px;
    font-weight:900;
    margin:0 0 11px;
}

.bt-v18-actions{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:10px;
    margin-bottom:25px;
}

.bt-v18-action{
    min-height:122px;
    border:1px solid rgba(119,151,178,.18);
    border-radius:18px;
    padding:15px;
    text-align:left;
    color:#fff;
    background:linear-gradient(145deg,rgba(15,45,70,.94),rgba(9,35,58,.94));
    box-shadow:0 9px 24px rgba(0,0,0,.12);
    cursor:pointer;
    transition:transform .15s ease,border-color .15s ease;
}

.bt-v18-action:active{
    transform:scale(.98);
}

.bt-v18-action.primary{
    border-color:rgba(255,132,0,.34);
    background:
        linear-gradient(145deg,rgba(255,132,0,.13),rgba(11,38,62,.96));
}

.bt-v18-action-icon{
    width:38px;
    height:38px;
    border-radius:12px;
    display:flex;
    align-items:center;
    justify-content:center;
    font-size:20px;
    background:rgba(255,255,255,.06);
    margin-bottom:13px;
}

.bt-v18-action strong{
    display:block;
    font-size:14px;
    font-weight:900;
    margin-bottom:5px;
}

.bt-v18-action small{
    display:block;
    color:#8098ad;
    font-size:10.5px;
    line-height:1.35;
}

.bt-v18-recent-head{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    margin-bottom:10px;
}

.bt-v18-feed-link{
    border:0;
    background:transparent;
    color:#ff8500;
    font-size:11px;
    font-weight:900;
    cursor:pointer;
}

#btInstallAppButton{
    margin-top:24px !important;
}

html.bt-standalone #btInstallAppButton,
body.bt-standalone #btInstallAppButton{
    display:none !important;
}

@media (min-width:760px){
    #btHomeScreen .bt-home-shell{
        padding-top:28px !important;
    }

    .bt-v18-actions{
        grid-template-columns:repeat(4,1fr);
    }

    .bt-v18-action{
        min-height:142px;
    }
}
`;
    document.head.appendChild(style);
}


setupBoraTecV18HomeStyle();





window.openBoraTecFeedTab = function(tabName){

    closeBoraTecHome();

    setTimeout(() => {

        const candidates = [
            ...document.querySelectorAll(
                ".feed-tab, .tab, [data-tab]"
            )
        ];

        const target =
            candidates.find(
                element =>
                    String(element.textContent || "")
                    .trim()
                    .toLowerCase()
                    ===
                    String(tabName || "")
                    .trim()
                    .toLowerCase()
            );

        if(target){
            target.click();
            return;
        }

        if(typeof setFeedFilter === "function"){
            setFeedFilter(tabName);
        }

    },80);
};

window.openBoraTecHome = openBoraTecHome;


/* =========================================================
   BORATEC R10 — INDUSTRIAL TECH UI
   Override visual isolado. Não altera regras de negócio.
========================================================= */
(function(){

    if(document.getElementById("btIndustrialTechTheme")){
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "btIndustrialTechTheme";

    style.textContent = `
        :root{
            --bt-tech-bg:#090d10;
            --bt-tech-panel:#12191e;
            --bt-tech-panel2:#182127;
            --bt-tech-edge:#39454d;
            --bt-tech-edge-hi:#59656d;
            --bt-tech-blue:#08baf0;
            --bt-tech-blue2:#087eae;
            --bt-tech-red:#e34843;
            --bt-tech-text:#f3f6f8;
            --bt-tech-muted:#8f9ba3;
        }

        /* HOME */
        #btHomeScreen{
            background:
                radial-gradient(circle at 82% -12%,rgba(8,186,240,.11),transparent 30%),
                linear-gradient(180deg,#090d10 0%,#0b1013 100%) !important;
        }

        #btHomeScreen .bt-home-shell{
            max-width:680px;
        }

        #btHomeScreen .bt-v182-top{
            position:relative;
            padding:9px 10px 11px;
            border:1px solid #354149;
            border-radius:10px;
            background:
                linear-gradient(145deg,#151d22,#0c1114);
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.04),
                0 8px 20px rgba(0,0,0,.26);
        }

        #btHomeScreen .bt-v182-top::after{
            content:"";
            position:absolute;
            left:14px;
            right:38%;
            bottom:-1px;
            height:2px;
            background:linear-gradient(90deg,#08baf0,rgba(8,186,240,0));
            box-shadow:0 0 8px rgba(8,186,240,.18);
        }

        #btHomeScreen .bt-v182-brand img{
            border-radius:8px !important;
            border:1px solid #42505a;
            background:#0d1317;
        }

        #btHomeScreen .bt-v182-brand-name{
            color:#eef2f4;
            text-shadow:0 2px 10px rgba(0,0,0,.35);
        }

        #btHomeScreen .bt-v182-brand-name span,
        #btHomeScreen .bt-v182-title span{
            color:#08baf0 !important;
        }

        #btHomeScreen .bt-v182-brand-tag,
        #btHomeScreen .bt-v182-kicker,
        #btHomeScreen .bt-v182-subtitle{
            color:#88969f !important;
        }

        #btHomeScreen .bt-v182-avatar{
            border-radius:9px !important;
            border:1px solid #4a5962 !important;
            outline:1px solid rgba(8,186,240,.18);
            background:linear-gradient(145deg,#1b252b,#0e1418) !important;
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.04),
                0 4px 10px rgba(0,0,0,.25);
        }

        #btHomeScreen .bt-v182-user-button{
            border:1px solid #3c4850 !important;
            border-radius:9px !important;
            background:
                linear-gradient(145deg,#182127,#0d1317) !important;
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.035),
                0 4px 10px rgba(0,0,0,.24);
        }

        #btHomeScreen .bt-v182-user-button:active{
            transform:translateY(1px);
        }

        #btHomeScreen .bt-v182-user-data small{
            color:#47c8ee !important;
        }

        /* CARROSSEL ROBUSTO */
        #btHomeScreen .bt-v182-actions{
            height:322px !important;
            perspective:1050px;
            overflow:visible !important;
        }

        #btHomeScreen .bt-v182-action{
            width:min(70vw,245px) !important;
            min-height:285px !important;
            transition:
                transform .34s cubic-bezier(.22,.8,.22,1),
                opacity .28s ease,
                filter .28s ease,
                box-shadow .28s ease !important;
            border-radius:11px !important;
            border:1px solid #44515a !important;
            background:
                linear-gradient(145deg,#1a2329 0%,#10171b 50%,#0b1013 100%) !important;
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.045),
                inset 0 0 0 1px rgba(0,0,0,.32),
                0 14px 32px rgba(0,0,0,.34) !important;
        }

        #btHomeScreen .bt-v182-action::before{
            content:"";
            position:absolute;
            inset:7px;
            border:1px solid rgba(255,255,255,.028);
            border-radius:7px;
            pointer-events:none;
        }

        #btHomeScreen .bt-v182-action::after{
            content:"";
            position:absolute;
            top:0;
            left:18px;
            width:38%;
            height:3px;
            background:linear-gradient(90deg,#08baf0,rgba(8,186,240,0));
            box-shadow:0 0 10px rgba(8,186,240,.18);
            pointer-events:none;
        }

        #btHomeScreen .bt-v182-action.primary{
            border-color:#47717f !important;
            background:
                linear-gradient(145deg,#1a252b 0%,#10191e 48%,#0a1013 100%) !important;
        }

        #btHomeScreen .bt-v182-action.bt-carousel-active{
            filter:none !important;
            transform:translateX(-50%) scale(1.02) translateY(-2px) !important;
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.055),
                inset 0 0 0 1px rgba(0,0,0,.32),
                0 18px 38px rgba(0,0,0,.42),
                0 0 18px rgba(8,186,240,.08) !important;
        }

        #btHomeScreen .bt-v182-action.bt-carousel-prev{
            opacity:.27 !important;
            filter:brightness(.48) saturate(.66) !important;
            transform:translateX(-128%) scale(.76) rotateY(14deg) translateY(10px) !important;
        }

        #btHomeScreen .bt-v182-action.bt-carousel-next{
            opacity:.27 !important;
            filter:brightness(.48) saturate(.66) !important;
            transform:translateX(28%) scale(.76) rotateY(-14deg) translateY(10px) !important;
        }

        #btHomeScreen .bt-v182-action-icon{
            border-radius:9px !important;
            background:
                radial-gradient(circle at 50% 38%,rgba(8,186,240,.16),rgba(8,186,240,.04)) !important;
            border:1px solid rgba(8,186,240,.24);
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.04),
                0 0 16px rgba(8,186,240,.05);
        }

        #btHomeScreen .bt-v182-action strong{
            color:#f4f6f7;
        }

        #btHomeScreen .bt-v182-action small{
            color:#8e9ba4 !important;
        }

        #btHomeScreen .bt-home-carousel-arrow{
            border-radius:8px !important;
            border:1px solid #3e4b54 !important;
            background:
                linear-gradient(180deg,#1a2329,#0d1317) !important;
            color:#dfe7eb !important;
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.04),
                0 3px 8px rgba(0,0,0,.23);
        }

        #btHomeScreen .bt-home-carousel-dot{
            background:#364149 !important;
        }

        #btHomeScreen .bt-home-carousel-dot.active{
            background:#08baf0 !important;
            box-shadow:0 0 9px rgba(8,186,240,.35);
        }

        #btHomeScreen .bt-v182-feed-link{
            color:#31c7ef !important;
        }

        #btInstallAppButton{
            border-radius:8px !important;
            border:1px solid #3f4d55 !important;
            background:linear-gradient(180deg,#182127,#10161a) !important;
            color:#dfe7eb !important;
            box-shadow:inset 0 1px 0 rgba(255,255,255,.035);
        }

        /* FEED / CARDS DINÂMICOS */
        .job-card{
            border-radius:10px !important;
            background:
                linear-gradient(145deg,#192127 0%,#12191e 48%,#0d1317 100%) !important;
            border:1px solid #3a454d !important;
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.045),
                inset 0 0 0 1px rgba(0,0,0,.34),
                0 8px 22px rgba(0,0,0,.30) !important;
        }

        .job-card.urgent{
            border-color:#713632 !important;
        }

        .job-card.urgent::before{
            background:#e34843 !important;
            box-shadow:0 0 10px rgba(227,72,67,.30);
        }

        .action-btn,
        .action-btn.orange{
            border-radius:8px !important;
            border:1px solid #22c9f6 !important;
            background:
                linear-gradient(180deg,#0aaee0,#087fae) !important;
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.16),
                0 4px 11px rgba(0,0,0,.28),
                0 0 11px rgba(8,186,240,.08) !important;
        }

        /* OVERLAYS / TELAS GERADAS PELO APP */
        .bt-overlay,
        [class*="bt-"][class*="overlay"]{
            backdrop-filter:blur(7px);
        }

        .bt-sheet,
        .bt-modal-card,
        .bt-profile-card,
        .bt-conv-item,
        .bt-job-card,
        .bt-community-message,
        [class*="bt-"][class*="card"]{
            border-color:#39454d !important;
        }

        /* CONVERSAS / JOBS / COMUNIDADE */
        .bt-conv-item,
        .bt-job-card,
        .bt-community-message{
            background:
                linear-gradient(145deg,#182127,#10161a) !important;
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.035),
                0 5px 14px rgba(0,0,0,.21) !important;
            border-radius:9px !important;
        }

        .bt-chat-header,
        .bt-conv-header,
        .bt-jobs-header{
            background:
                linear-gradient(180deg,#151d22,#0b1013) !important;
            border-bottom:1px solid #39444c !important;
        }

        /* NAVEGAÇÃO */
        .bottom-nav{
            background:
                linear-gradient(180deg,rgba(16,22,26,.99),rgba(7,10,12,.995)) !important;
            border-top:1px solid #3a454d !important;
            box-shadow:
                0 -8px 26px rgba(0,0,0,.35),
                inset 0 1px 0 rgba(255,255,255,.03) !important;
        }

        .nav-button.active::after{
            background:#08baf0 !important;
            box-shadow:0 0 8px rgba(8,186,240,.48);
        }

        .publish-fab{
            border-radius:8px !important;
            border:1px solid #21c7f3 !important;
            background:
                linear-gradient(180deg,#0bb6e7,#087ca9) !important;
            box-shadow:
                inset 0 1px 0 rgba(255,255,255,.18),
                0 5px 13px rgba(0,0,0,.30),
                0 0 12px rgba(8,186,240,.15) !important;
        }


        @media(max-width:520px){
            #btHomeScreen .bt-v182-actions{
                height:316px !important;
            }

            #btHomeScreen .bt-v182-action{
                width:min(69vw,238px) !important;
                min-height:282px !important;
            }

            #btHomeScreen .bt-v182-action.bt-carousel-prev{
                transform:translateX(-130%) scale(.74) rotateY(15deg) translateY(12px) !important;
            }

            #btHomeScreen .bt-v182-action.bt-carousel-next{
                transform:translateX(30%) scale(.74) rotateY(-15deg) translateY(12px) !important;
            }
        }

        @media(min-width:800px){
            #btHomeScreen .bt-v182-actions{
                height:330px !important;
            }

            #btHomeScreen .bt-v182-action{
                width:248px !important;
                min-height:288px !important;
            }
        }
    `;

    document.head.appendChild(
        style
    );

})();


(function(){
    if(document.getElementById("btR11HomeAvatarOnlyStyle")) return;

    const style = document.createElement("style");
    style.id = "btR11HomeAvatarOnlyStyle";
    style.textContent = `
/* =========================================================
   R11 - HOME: SOMENTE FOTO DO PERFIL
   ALTERACAO VISUAL SOMENTE CSS
   Nao remove elementos, IDs ou eventos.
========================================================= */
#btHomeScreen .bt-v182-user-data{
    display:none !important;
}

#btHomeScreen .bt-v182-user-button{
    width:auto !important;
    min-width:0 !important;
    max-width:none !important;
    padding:0 !important;
    gap:0 !important;
    border:0 !important;
    background:transparent !important;
    box-shadow:none !important;
}

#btHomeScreen .bt-v182-user-button:hover,
#btHomeScreen .bt-v182-user-button:focus,
#btHomeScreen .bt-v182-user-button:active{
    background:transparent !important;
    box-shadow:none !important;
}

#btHomeScreen .bt-v182-user-button .bt-v182-avatar{
    margin:0 !important;
}
`;
    document.head.appendChild(style);
})();

