/* =========================================================
   BORATEC
   APP.JS
   V0.1

   Responsabilidades iniciais:
   - Conectar ao Supabase
   - Verificar sessão
   - Proteger index.html
   - Buscar perfil real
   - Mostrar nome e iniciais reais
   - Logout

   Depois entraremos aqui com:
   - Feed
   - Publicações
   - Interesses
   - Chat
   - Jobs
   - Avaliações
========================================================= */


/* =========================================================
   CONFIGURAÇÃO SUPABASE
========================================================= */

const BORATEC_SUPABASE_URL =
    "https://kgagljuutvlpdeqjgqsj.supabase.co";

const BORATEC_SUPABASE_KEY =
    "sb_publishable_dToKktNJesqf1N_fHs4uUQ_Q3th_tCs";


/* =========================================================
   ESTADO GLOBAL
========================================================= */

let boraSupabase = null;

let boraUser = null;

let boraProfile = null;


/* =========================================================
   INICIAR BORATEC
========================================================= */

async function startBoraTec(){

    console.log(
        "🚀 BoraTec iniciando..."
    );


    /*
    Verifica se a biblioteca do Supabase
    foi carregada no index.html.
    */

    if(
        typeof window.supabase ===
        "undefined"
    ){

        console.error(
            "Supabase JS não foi carregado."
        );

        return;
    }


    /*
    Cria cliente Supabase.
    */

    boraSupabase =
        window.supabase.createClient(
            BORATEC_SUPABASE_URL,
            BORATEC_SUPABASE_KEY
        );


    /*
    Verifica login.
    */

    const logged =
        await checkBoraTecSession();


    if(!logged){

        return;
    }


    /*
    Carrega perfil.
    */

    await loadBoraTecProfile();


    /*
    Atualiza interface.
    */

    updateBoraTecUserInterface();


    console.log(
        "✅ BoraTec conectado."
    );

}


/* =========================================================
   VERIFICAR SESSÃO
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
                "Erro ao verificar sessão:",
                error
            );

            redirectToLogin();

            return false;

        }


        if(
            !data ||
            !data.session ||
            !data.session.user
        ){

            console.log(
                "Usuário não autenticado."
            );

            redirectToLogin();

            return false;

        }


        boraUser =
            data.session.user;


        console.log(
            "👤 Usuário autenticado:",
            boraUser.email
        );


        return true;


    }catch(error){

        console.error(
            "Erro inesperado na sessão:",
            error
        );

        redirectToLogin();

        return false;

    }

}


/* =========================================================
   CARREGAR PERFIL
========================================================= */

async function loadBoraTecProfile(){

    if(!boraUser){

        return null;

    }


    try{

        const {
            data,
            error
        } =
        await boraSupabase
        .from("profiles")
        .select(`
            id,
            name,
            professional_name,
            phone,
            photo_url,
            state,
            city,
            neighborhoods,
            specialties,
            bio,
            created_at,
            updated_at
        `)
        .eq(
            "id",
            boraUser.id
        )
        .single();


        /*
        Se houver algum problema com o perfil,
        usamos os dados básicos do Auth
        como fallback.
        */

        if(error){

            console.warn(
                "Não foi possível carregar o perfil:",
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

                phone:null,

                photo_url:null,

                state:null,

                city:null,

                neighborhoods:[],

                specialties:[],

                bio:null

            };


            return boraProfile;

        }


        boraProfile =
            data;


        console.log(
            "✅ Perfil carregado:",
            boraProfile
        );


        return boraProfile;


    }catch(error){

        console.error(
            "Erro ao buscar perfil:",
            error
        );


        boraProfile = {

            id:
                boraUser.id,

            name:
                getEmailName(
                    boraUser.email
                )

        };


        return boraProfile;

    }

}


/* =========================================================
   ATUALIZAR INTERFACE
========================================================= */

function updateBoraTecUserInterface(){

    if(!boraProfile){

        return;

    }


    updateGreeting();

    updateAvatar();

}


/* =========================================================
   SAUDAÇÃO
========================================================= */

function updateGreeting(){

    const helloElement =
        document.querySelector(
            ".hello"
        );


    if(!helloElement){

        return;

    }


    const name =
        boraProfile.name
        ||
        boraProfile.professional_name
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
        hour >= 5 &&
        hour < 12
    ){

        greeting =
            "BOM DIA";

    }else if(
        hour >= 12 &&
        hour < 18
    ){

        greeting =
            "BOA TARDE";

    }else{

        greeting =
            "BOA NOITE";

    }


    helloElement.textContent =
        greeting +
        ", " +
        firstName.toUpperCase();

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


    /*
    Se futuramente existir foto,
    usaremos a foto.
    */

    if(
        boraProfile.photo_url
    ){

        avatar.innerHTML = `

            <img
                src="${escapeHtml(
                    boraProfile.photo_url
                )}"
                alt="Foto do perfil"
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


    const displayName =
        boraProfile
        .professional_name
        ||
        boraProfile.name
        ||
        "Profissional";


    avatar.textContent =
        getInitials(
            displayName
        );

}


/* =========================================================
   GERAR INICIAIS
========================================================= */

function getInitials(name){

    if(!name){

        return "BT";

    }


    const words =
        String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);


    if(words.length === 0){

        return "BT";

    }


    if(words.length === 1){

        return words[0]
        .substring(0,2)
        .toUpperCase();

    }


    return (
        words[0][0] +
        words[
            words.length - 1
        ][0]
    )
    .toUpperCase();

}


/* =========================================================
   NOME PELO EMAIL
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
   LOGOUT
========================================================= */

async function logoutBoraTec(){

    if(!boraSupabase){

        redirectToLogin();

        return;

    }


    try{

        const {
            error
        } =
        await boraSupabase.auth
        .signOut();


        if(error){

            throw error;

        }


        window.location.replace(
            "login.html"
        );


    }catch(error){

        console.error(
            "Erro ao sair:",
            error
        );

        alert(
            "Não foi possível sair. Tente novamente."
        );

    }

}


/* =========================================================
   REDIRECIONAR LOGIN
========================================================= */

function redirectToLogin(){

    /*
    replace evita voltar ao index protegido
    usando botão Voltar do navegador.
    */

    window.location.replace(
        "login.html"
    );

}


/* =========================================================
   ESCAPE HTML
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
   ESCUTAR MUDANÇAS DE LOGIN
========================================================= */

function listenAuthChanges(){

    if(!boraSupabase){

        return;

    }


    boraSupabase.auth
    .onAuthStateChange(
        (
            event,
            session
        ) => {

            console.log(
                "Auth:",
                event
            );


            /*
            Se a sessão desaparecer,
            volta para login.
            */

            if(
                event ===
                "SIGNED_OUT"
            ){

                window.location.replace(
                    "login.html"
                );

            }


            /*
            Atualiza usuário caso token
            seja renovado.
            */

            if(
                session &&
                session.user
            ){

                boraUser =
                    session.user;

            }

        }
    );

}


/* =========================================================
   FUNÇÕES DISPONÍVEIS PARA O RESTO DO APP
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


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function(){

        await startBoraTec();

        if(boraSupabase){

            listenAuthChanges();

        }

    }
);
