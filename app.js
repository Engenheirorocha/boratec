/* =========================================================
   BORATEC
   APP.JS
   V0.2

   - Supabase
   - Sessão
   - Perfil real
   - Logout
   - Feed real
   - Publicação real
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
   INICIAR BORATEC
========================================================= */

async function startBoraTec(){

    console.log(
        "🚀 Iniciando BoraTec..."
    );


    if(
        typeof window.supabase ===
        "undefined"
    ){

        console.error(
            "Biblioteca Supabase não carregada."
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


    /*
       Agora substituímos os posts
       de demonstração pelos posts reais.
    */

    await loadOpportunities();


    listenAuthChanges();


    console.log(
        "✅ BoraTec conectado ao Supabase."
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
        await boraSupabase.auth
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
            "Erro de sessão:",
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
        .from("profiles")
        .select("*")
        .eq(
            "id",
            boraUser.id
        )
        .single();


        if(error){

            console.error(
                "Erro ao carregar perfil:",
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
                    null

            };


            return;
        }


        boraProfile =
            data;


        console.log(
            "👤 Perfil:",
            boraProfile
        );


    }catch(error){

        console.error(
            "Erro inesperado no perfil:",
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
        new Date().getHours();


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


    if(
        parts.length === 1
    ){

        return parts[0]
        .substring(0,2)
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
   ESCAPE HTML
========================================================= */

function escapeHtml(value){

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value ?? "";


    return element.innerHTML;

}


/* =========================================================
   CARREGAR OPORTUNIDADES REAIS
========================================================= */

async function loadOpportunities(){

    console.log(
        "📡 Buscando oportunidades..."
    );


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
                "Erro ao carregar oportunidades:",
                error
            );


            showToast(
                "Erro ao carregar oportunidades"
            );


            return;
        }


        /*
           IMPORTANTE

           'posts' já existe no index.html.

           Aqui substituímos os posts falsos
           pelos dados reais do Supabase.
        */

        posts =
            data.map(
                convertDatabaseOpportunity
            );


        console.log(
            "📋 Oportunidades:",
            posts
        );


        renderFeed();


    }catch(error){

        console.error(
            "Erro inesperado:",
            error
        );

    }

}


/* =========================================================
   CONVERTER BANCO → CARD
========================================================= */

function convertDatabaseOpportunity(item){

    const profile =
        item.profiles
        ||
        {};


    let uiType =
        item.type;


    /*
       Banco:
       technician_available

       Interface atual:
       available
    */

    if(
        item.type ===
        "technician_available"
    ){

        uiType =
            "available";
    }


    if(
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

        /*
           NÃO vamos inventar reputação.

           Usuário novo:
           NOVO
           0 serviços.
        */

        rating:
            null,

        jobs:
            0,

        time:
            timeAgo(
                item.created_at
            ),

        urgent:
            item.urgency
            === true,

        createdAt:
            item.created_at

    };

}


/* =========================================================
   DATA DO SERVIÇO
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
   TEMPO DA PUBLICAÇÃO
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
   NOVO CARD REAL

   Substitui o card antigo do index.html
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


    let reputationHTML = `

        <span
            style="
                color:#ff9a42;
                font-weight:900;
            "
        >
            NOVO
        </span>

        &nbsp;•&nbsp;

        0 serviços BoraTec

    `;


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


    /*
       Não mostra Quero Fazer
       na própria publicação.
    */

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
                cursor:default;
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
                ${safe(post.time)}
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
   PUBLICAR NO SUPABASE

   Substitui publishPost() do index.html
========================================================= */

publishPost =
async function(event){

    event.preventDefault();


    if(
        !boraUser
        ||
        !boraProfile
    ){

        showToast(
            "Usuário não carregado"
        );

        return;
    }


    const submitButton =
        event.target
        .querySelector(
            ".submit"
        );


    const oldButtonText =
        submitButton
        .textContent;


    submitButton.disabled =
        true;


    submitButton.textContent =
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


        const description =
            document
            .getElementById(
                "postDescription"
            )
            .value
            .trim();


        /* =================================================
           VALIDAÇÃO
        ================================================= */

        if(
            !title
            ||
            !location
            ||
            !description
        ){

            showToast(
                "Preencha os dados obrigatórios"
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


        /* =================================================
           TIPO PARA O BANCO
        ================================================= */

        let databaseType =
            uiType;


        if(
            uiType ===
            "available"
        ){

            databaseType =
                "technician_available";
        }


        /* =================================================
           DATA
        ================================================= */

        const serviceDate =
            convertDateOption(
                dateOption
            );


        /* =================================================
           LOCAL

           Por enquanto o campo digitado entra como cidade.

           Depois separaremos:
           estado / cidade / bairro.
        ================================================= */

        const city =
            location;


        /* =================================================
           VALOR
        ================================================= */

        let value =
            null;


        if(
            priceText
        ){

            const number =
                Number(
                    priceText
                );


            if(
                !Number.isNaN(
                    number
                )
            ){

                value =
                    number;
            }

        }


        /* =================================================
           INSERT
        ================================================= */

        const {
            data,
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
                boraProfile.state
                ||
                "RJ",

            city:
                city,

            neighborhood:
                null,

            service_date:
                serviceDate,

            value:
                value,

            value_negotiable:
                value === null,

            urgency:
                dateOption ===
                "Agora",

            status:
                "open"

        })
        .select()
        .single();


        if(error){

            console.error(
                "Erro ao publicar:",
                error
            );


            throw error;
        }


        console.log(
            "✅ Publicado:",
            data
        );


        /*
           Limpa formulário.
        */

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
            tab =>
            tab
            .classList
            .remove(
                "active"
            )
        );


        const allTab =
            document
            .querySelector(
                '[data-filter="all"]'
            );


        if(allTab){

            allTab
            .classList
            .add(
                "active"
            );

        }


        /*
           Recarrega feed direto
           do banco.
        */

        await loadOpportunities();


        window.scrollTo({

            top:0,

            behavior:"smooth"

        });


        showToast(
            "Oportunidade publicada!"
        );


    }catch(error){

        console.error(
            error
        );


        showToast(
            "Não foi possível publicar"
        );


    }finally{

        submitButton.disabled =
            false;


        submitButton.textContent =
            oldButtonText;

    }

};


/* =========================================================
   CONVERTER "HOJE / AMANHÃ"
========================================================= */

function convertDateOption(
    option
){

    const date =
        new Date();


    if(
        option ===
        "Amanhã"
    ){

        date.setDate(
            date.getDate()
            +
            1
        );

    }


    if(
        option ===
        "Esta semana"
    ){

        date.setDate(
            date.getDate()
            +
            3
        );

    }


    return date
    .toISOString();

}


/* =========================================================
   INTERESSE

   Por enquanto só prepara a próxima etapa.
========================================================= */

interest =
async function(id){

    const post =
        posts.find(
            item =>
            String(item.id)
            ===
            String(id)
        );


    if(!post){

        return;
    }


    if(
        post.authorId ===
        boraUser.id
    ){

        showToast(
            "Esta publicação é sua"
        );

        return;
    }


    document
    .getElementById(
        "interestText"
    )
    .innerHTML = `

        Você demonstrou interesse em

        <strong
            style="color:white"
        >
            ${safe(
                post.title
            )}
        </strong>.

        Na próxima etapa vamos criar
        a conversa privada entre vocês.

    `;


    document
    .getElementById(
        "interestOverlay"
    )
    .classList
    .add(
        "show"
    );


    document.body.style.overflow =
        "hidden";

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
   FUNÇÕES GLOBAIS
========================================================= */

window.logoutBoraTec =
    logoutBoraTec;


window.getBoraTecUser =
    function(){

        return boraUser;

    };


window.getBoraTecProfile =
    function(){

        return boraProfile;

    };


window.getBoraTecSupabase =
    function(){

        return boraSupabase;

    };


window.loadOpportunities =
    loadOpportunities;


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function(){

        await startBoraTec();

    }
);
