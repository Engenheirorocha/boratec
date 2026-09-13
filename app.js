/* =========================================================
   BORATEC
   APP.JS
   V0.3

   - Supabase
   - Sessão
   - Perfil real
   - Feed real
   - Publicação real
   - Interesse real
   - Conversa privada
   - Mensagens
   - Realtime
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

let messagesChannel = null;

let interestsChannel = null;


/* =========================================================
   START
========================================================= */

async function startBoraTec(){

    console.log(
        "🚀 BoraTec iniciando..."
    );


    if(
        typeof window.supabase ===
        "undefined"
    ){

        console.error(
            "Supabase não carregado."
        );

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


    console.log(
        "✅ BoraTec iniciado."
    );

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
        await boraSupabase
        .auth
        .getSession();


        if(error){

            console.error(
                error
            );

            redirectToLogin();

            return false;
        }


        if(
            !data?.session?.user
        ){

            redirectToLogin();

            return false;
        }


        boraUser =
            data.session.user;


        console.log(
            "👤 Logado:",
            boraUser.email
        );


        return true;


    }catch(error){

        console.error(
            error
        );


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
        .from(
            "profiles"
        )
        .select("*")
        .eq(
            "id",
            boraUser.id
        )
        .single();


        if(error){

            console.warn(
                "Perfil não encontrado:",
                error
            );


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
   INTERFACE DO USUÁRIO
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


    if(
        boraProfile?.photo_url
    ){

        avatar.innerHTML = `

            <img
                src="${escapeHtml(
                    boraProfile.photo_url
                )}"
                style="
                    width:100%;
                    height:100%;
                    border-radius:50%;
                    object-fit:cover;
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


    if(
        parts.length === 1
    ){

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
   EMAIL PARA NOME
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
   FEED REAL
========================================================= */

async function loadOpportunities(){

    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from(
            "opportunities"
        )
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

        console.error(
            error
        );

    }

}


/* =========================================================
   BANCO -> CARD
========================================================= */

function convertDatabaseOpportunity(item){

    const profile =
        item.profiles
        ||
        {};


    let uiType =
        item.type;


    if(
        item.type ===
        "technician_available"
        ||
        item.type ===
        "helper_available"
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


    if(
        item.neighborhood
    ){

        location +=
            item.neighborhood;

    }


    if(
        item.city
    ){

        if(location){

            location +=
                " • ";

        }


        location +=
            item.city;

    }


    if(
        item.state
    ){

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
   DATA
========================================================= */

function formatServiceDate(
    serviceDate
){

    if(!serviceDate){

        return "A combinar";

    }


    const date =
        new Date(
            serviceDate
        );


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


/* =========================================================
   TEMPO
========================================================= */

function timeAgo(dateString){

    if(!dateString){

        return "";

    }


    const created =
        new Date(
            dateString
        );


    const now =
        new Date();


    const seconds =
        Math.floor(
            (
                now
                -
                created
            )
            /
            1000
        );


    if(
        seconds < 60
    ){

        return "agora";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if(
        minutes < 60
    ){

        return `há ${minutes} min`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if(
        hours < 24
    ){

        return `há ${hours} h`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    return `há ${days} d`;

}


/* =========================================================
   CARD
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


    if(
        post.type ===
        "service"
    ){

        typeText =
            post.urgent
            ?
            "SERVIÇO URGENTE"
            :
            "SERVIÇO";

    }


    if(
        post.type ===
        "helper"
    ){

        typeText =
            "PRECISO DE AJUDANTE";

        typeClass =
            "helper";

        typeIcon =
            "👷";

        button =
            "Tenho interesse";

    }


    if(
        post.type ===
        "available"
    ){

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
            ${
                post.urgent
                ?
                "urgent"
                :
                ""
            }
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

                ${safe(
                    post.time
                )}

            </div>

        </div>


        <div class="job-title">

            ${safe(
                post.title
            )}

        </div>


        <div class="job-info">

            <span>

                📍
                ${safe(
                    post.location
                )}

            </span>


            <span>

                📅
                ${safe(
                    post.date
                )}

            </span>


            <span>

                ❄
                ${safe(
                    post.category
                )}

            </span>

        </div>


        <div class="job-description">

            ${safe(
                post.description
            )}

        </div>


        <div class="professional">

            <div class="prof-avatar">

                ${safe(
                    post.initials
                )}

            </div>


            <div class="prof-data">

                <div class="prof-name">

                    ${safe(
                        post.author
                    )}

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
   PUBLICAÇÃO
========================================================= */

publishPost =
async function(event){

    event.preventDefault();


    if(
        !boraUser
    ){

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


        if(
            uiType ===
            "available"
        ){

            databaseType =
                "technician_available";

        }


        let value =
            null;


        if(
            priceText
        ){

            const parsed =
                Number(
                    priceText
                );


            if(
                !Number.isNaN(
                    parsed
                )
            ){

                value =
                    parsed;

            }

        }


        const {
            error
        } =
        await boraSupabase
        .from(
            "opportunities"
        )
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
            "Erro ao publicar:",
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
   CONVERTER DATA
========================================================= */

function convertDateOption(option){

    const date =
        new Date();


    if(
        option ===
        "Amanhã"
    ){

        date.setDate(
            date.getDate() + 1
        );

    }


    if(
        option ===
        "Esta semana"
    ){

        date.setDate(
            date.getDate() + 3
        );

    }


    return date
    .toISOString();

}


/* =========================================================
   QUERO FAZER
========================================================= */

interest =
async function(opportunityId){

    if(
        !boraUser
    ){

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
        post.authorId ===
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


        const result =
            data[0];


        currentConversationId =
            result.conversation_id;


        currentConversationTitle =
            post.title;


        openChat(
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
   CRIAR INTERFACE DO CHAT
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

        height:68px;
        padding:0 16px;

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


    .bt-chat-messages{

        flex:1;

        overflow-y:auto;

        padding:18px 14px 110px;

        display:flex;

        flex-direction:column;

        gap:9px;

    }


    .bt-msg{

        max-width:78%;

        padding:
        10px 12px;

        border-radius:
        15px;

        font-size:12px;

        line-height:1.45;

        word-break:break-word;

    }


    .bt-msg.me{

        align-self:flex-end;

        background:
        #147ee8;

        color:white;

        border-bottom-right-radius:4px;

    }


    .bt-msg.other{

        align-self:flex-start;

        background:
        #132f4c;

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
    .appendChild(
        style
    );


    const html =
        document.createElement(
            "div"
        );


    html.innerHTML = `

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


    while(
        html.firstChild
    ){

        document.body
        .appendChild(
            html.firstChild
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


    await loadChatMessages();


    listenConversationMessages();

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

    if(
        !currentConversationId
    ){

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
        .from(
            "messages"
        )
        .select(
            "id, conversation_id, sender_id, content, created_at"
        )
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

                Não foi possível carregar as mensagens.

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
        message.sender_id ===
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

async function sendChatMessage(
    event
){

    event.preventDefault();


    if(
        !currentConversationId
    ){

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
        .from(
            "messages"
        )
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


        /*
        Realtime adicionará a mensagem
        automaticamente.
        */


    }catch(error){

        console.error(
            "Erro ao enviar:",
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
   REALTIME MENSAGENS
========================================================= */

function listenConversationMessages(){

    stopMessagesChannel();


    if(
        !currentConversationId
    ){

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
   PARAR CANAL
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
   ADICIONAR MENSAGEM
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
   SCROLL
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

    if(
        interestsChannel
    ){

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

            async payload => {

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


                if(
                    !ownOpportunity
                ){

                    return;

                }


                showToast(
                    "🔥 Novo profissional interessado!"
                );


                /*
                Pequeno atraso para a RPC terminar
                de criar a conversa.
                */

                setTimeout(
                    async () => {

                        const conversation =
                            await findConversationByInterest(
                                interestData.id
                            );


                        if(conversation){

                            console.log(
                                "Nova conversa:",
                                conversation.id
                            );

                        }

                    },
                    700
                );

            }
        )
        .subscribe();

}


/* =========================================================
   PROCURAR CONVERSA PELO INTERESSE
========================================================= */

async function findConversationByInterest(
    interestId
){

    const {
        data,
        error
    } =
    await boraSupabase
    .from(
        "conversations"
    )
    .select(
        "id, opportunity_id, interest_id, created_at"
    )
    .eq(
        "interest_id",
        interestId
    )
    .maybeSingle();


    if(error){

        console.error(
            error
        );


        return null;

    }


    return data;

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
        .from(
            "conversations"
        )
        .select(
            "id, opportunity_id, interest_id, created_at"
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
   DADOS DA CONVERSA
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
    .from(
        "opportunities"
    )
    .select(
        "id, title, author_id"
    )
    .eq(
        "id",
        conversation.opportunity_id
    )
    .maybeSingle();


    if(
        opportunity?.title
    ){

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
        .from(
            "interests"
        )
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


    if(
        otherUserId
    ){

        const {
            data:profile
        } =
        await boraSupabase
        .from(
            "profiles"
        )
        .select(
            "name, professional_name"
        )
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
   ESCAPE JS PARA ONCLICK
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
   BOTÃO ANTIGO "ABRIR CONVERSA"
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


    if(
        currentConversationId
    ){

        openChat(
            currentConversationId,
            currentConversationTitle
        );

    }

};


/* =========================================================
   MENU INFERIOR
========================================================= */

selectNav =
function(
    button,
    page
){

    if(
        page ===
        "Mensagens"
    ){

        openConversations();

        return;

    }


    if(
        page ===
        "Perfil"
    ){

        showToast(
            "Perfil será a próxima etapa"
        );

        return;

    }


    if(
        page ===
        "Início"
    ){

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

        console.error(
            error
        );

    }

}


/* =========================================================
   REDIRECT LOGIN
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


            if(
                session?.user
            ){

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

window.loadOpportunities =
    loadOpportunities;

window.getBoraTecUser =
    () =>
    boraUser;

window.getBoraTecProfile =
    () =>
    boraProfile;

window.getBoraTecSupabase =
    () =>
    boraSupabase;


/* =========================================================
   INICIAR
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function(){

        await startBoraTec();

    }
);
