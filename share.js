/* BoraTec promotional sharing: all sends require the user's own confirmation. */
(() => {
    const appUrl = 'https://engenheirorocha.github.io/boratec/';
    const imageUrl = new URL('./images/boratec-compartilhar.png', document.baseURI).href;
    const caption = `🔧 BoraTec — Profissionais conectando profissionais

Trabalha com refrigeração ou ar-condicionado? Tenha uma rede de profissionais e ferramentas úteis para o seu dia a dia.

🤝 Recebeu um serviço e não consegue atender? Compartilhe a oportunidade com outro profissional.

👷 Precisa de ajudante ou está procurando serviço? Encontre profissionais e divulgue sua disponibilidade.

🧰 Acesse calculadora de BTU, ferramentas de refrigeração e consultas a manuais de controladores.

📅 Organize sua agenda e seus atendimentos.

💬 Troque experiências e tire dúvidas com outros profissionais na comunidade.

Conheça o BoraTec e faça parte dessa conexão!
👇 Acesse:
${appUrl}`;
    let dialog, file, loading, previousFocus;

    function prepareImage() {
        if (file) return Promise.resolve(file);
        if (!loading) loading = (async () => {
            try {
                const response = await fetch(imageUrl, {signal:AbortSignal.timeout(10000)});
                if (!response.ok) throw new Error('Image unavailable');
                const blob = await response.blob();
                file = new File([blob], 'BoraTec.png', {type:'image/png'});
                return file;
            } catch (_) {
                return null;
            } finally {
                loading = null;
            }
        })();
        return loading;
    }

    function supportsImage() {
        try { return !!(file && navigator.share && navigator.canShare?.({files:[file]})); }
        catch (_) { return false; }
    }

    function createDialog() {
        const style = document.createElement('style');
        style.textContent = `
#btShareDialog{position:fixed;inset:0;margin:auto;width:min(94vw,520px);max-height:90dvh;overflow:auto;border:1px solid #20738a;border-radius:18px;padding:20px;background:#071b2c;color:#fff;box-shadow:0 18px 70px #0009;font:16px/1.5 system-ui;z-index:2147483647}
#btShareDialog::backdrop{background:#000b}
#btShareDialog [hidden]{display:none}
#btShareDialog .bt-share-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
#btShareDialog h2{font-size:20px;margin:0}
#btShareDialog img{display:block;width:100%;height:auto;border-radius:10px}
#btShareDialog textarea{display:block;box-sizing:border-box;width:100%;height:190px;margin:14px 0;padding:12px;background:#102d42;color:#fff;border:1px solid #37627b;border-radius:10px;font:16px/1.5 system-ui;resize:vertical}
#btShareDialog button,#btShareDialog a{display:block;padding:12px;border:1px solid #397089;border-radius:10px;background:#103c56;color:#fff;text-align:center;text-decoration:none;font:600 16px/1.3 system-ui;cursor:pointer}
#btShareDialog .bt-share-actions{display:grid;gap:10px}
#btShareDialog #btShareSend{background:#007eaa}
#btShareDialog button:disabled{opacity:.6;cursor:wait}
#btShareDialog p{font-size:14px;color:#b9cedc;margin:12px 0}
#btShareDialog :focus-visible{outline:3px solid #30ccff;outline-offset:3px}`;
        document.head.appendChild(style);
        dialog = document.createElement('dialog');
        dialog.id = 'btShareDialog';
        dialog.setAttribute('aria-labelledby','btShareTitle');
        dialog.innerHTML = `<div class="bt-share-top"><h2 id="btShareTitle">Compartilhar BoraTec</h2><button type="button" id="btShareClose" aria-label="Fechar">×</button></div>
<img alt="BoraTec — Profissionais conectando profissionais. Serviços, técnicos e ajudantes, ferramentas e manuais, agenda.">
<textarea id="btShareCaption" aria-label="Legenda e link para compartilhar" readonly></textarea>
<div class="bt-share-actions"><button type="button" id="btShareSend" disabled>Preparando imagem…</button><button type="button" id="btShareCopy">Copiar legenda e link</button><a id="btShareDownload" download="BoraTec.png">Baixar imagem</a></div>
<p id="btShareStatus" role="status" aria-live="polite"></p>`;
        dialog.querySelector('img').src = imageUrl;
        dialog.querySelector('textarea').value = caption;
        dialog.querySelector('#btShareDownload').href = imageUrl;
        dialog.querySelector('#btShareClose').onclick = () => dialog.close();
        dialog.addEventListener('close', () => previousFocus?.focus());
        dialog.querySelector('#btShareCopy').onclick = async () => {
            try {
                await navigator.clipboard.writeText(caption);
                status('Legenda e link copiados. Cole junto com a imagem no aplicativo escolhido.');
            } catch (_) {
                const field = dialog.querySelector('textarea');
                field.focus(); field.select();
                status('Texto selecionado. Use a opção Copiar do seu dispositivo.');
            }
        };
        dialog.querySelector('#btShareSend').onclick = async () => {
            const button = dialog.querySelector('#btShareSend');
            const withImage = supportsImage();
            button.disabled = true;
            try {
                // File is already loaded, so share runs directly on the user's tap.
                const data = {title:'BoraTec', text:caption};
                if (withImage) data.files = [file];
                await navigator.share(data);
                status('Confira no aplicativo escolhido se a legenda e o link acompanharam a imagem.');
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    status('Não foi possível compartilhar. Baixe a imagem e copie a legenda pelos botões abaixo.');
                }
            } finally { button.disabled = false; }
        };
        document.body.appendChild(dialog);
    }

    function status(text) { dialog.querySelector('#btShareStatus').textContent = text; }

    window.openBoraTecShare = async function() {
        if (!dialog) createDialog();
        if (dialog.open) return;
        previousFocus = document.activeElement;
        dialog.showModal();
        const send = dialog.querySelector('#btShareSend');
        send.disabled = true;
        send.textContent = 'Preparando imagem…';
        await prepareImage();
        const withImage = supportsImage();
        send.hidden = typeof navigator.share !== 'function';
        send.disabled = false;
        send.textContent = withImage ? 'Compartilhar imagem e legenda' : 'Compartilhar legenda e link';
        status(withImage
            ? 'O aplicativo escolhido pode separar a imagem da legenda. Se precisar, use “Copiar legenda e link”.'
            : 'Para enviar a arte, baixe a imagem e cole a legenda no aplicativo escolhido.');
    };
})();
