#!/usr/bin/env python3
"""Coleta demonstrativa limitada de editais reais do PNCP para o RadarTec.
Requer apenas Python da biblioteca padrão.
Executar a partir da raiz do projeto: python scripts/coletar.py
"""
import json
import re
import sys
import time
import unicodedata
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "data" / "licitacoes.json"
TZ = timezone(timedelta(hours=-3))
NOW = datetime.now(TZ)
UFS = ("RJ", "SP", "MG", "ES", "PR", "SC", "BA", "DF", "GO", "PE", "CE")
MODALIDADES = (8, 6)
MAX_PAGES = 2
PATTERN = re.compile(r"ar[\s-]?condicionado|climatiz|refriger|pmoc|c[aâ]mara\s+fria|chiller|fan[\s-]?coil|compressor\s+frigor|condensadora|evaporadora|\bsplit\b|\bvrf\b", re.I)
HEADERS = {"Accept": "application/json", "User-Agent": "RadarTec (projeto independente de refrigeração)"}


def norm(text):
    return "".join(x for x in unicodedata.normalize("NFKD", str(text or "")) if not unicodedata.combining(x)).lower()


def match(text):
    return bool(PATTERN.search(norm(text)))


def load(url):
    last = None
    for attempt in range(2):
        try:
            with urlopen(Request(url, headers=HEADERS), timeout=19) as res:
                if res.status == 204:
                    return {"data": [], "totalPaginas": 0}
                return json.load(res)
        except (HTTPError, URLError, TimeoutError, ValueError, OSError) as exc:
            last = str(exc)
            if isinstance(exc, HTTPError) and exc.code in (400, 401, 403, 404, 422):
                break
            time.sleep(1 + attempt)
    raise RuntimeError(str(last)[:170])


def expired(s):
    if not s:
        return False
    try:
        t = str(s)
        d = datetime.fromisoformat(t.replace("Z", "+00:00"))
        if d.tzinfo is None:
            d = d.replace(tzinfo=TZ)
        if len(t) == 10:
            d = d.replace(hour=23, minute=59, second=59)
        return d < NOW
    except ValueError:
        return False


def classify(text):
    s = norm(text)
    if re.search(r"pmoc|manutenc|reparo|higieniz|limpeza|corretiva|preventiva|conserto", s):
        return "manutencao"
    if re.search(r"instalac|montagem|desinstalac|implantac", s):
        return "instalacao"
    if re.search(r"fornec|aquisic|compra|pecas|equipamento", s):
        return "equipamentos"
    return "outros"


def convert(r):
    obj = r.get("objetoCompra") or ""
    extras = r.get("informacaoComplementar") or ""
    full = str(obj) + " " + str(extras)
    if not match(full):
        return None
    org = r.get("orgaoEntidade") or {}
    unidade = r.get("unidadeOrgao") or {}
    cnpj = re.sub(r"\D", "", str(org.get("cnpj") or ""))
    ano, seq = r.get("anoCompra"), r.get("sequencialCompra")
    if len(cnpj) != 14 or not ano or seq is None:
        return None
    deadline = r.get("dataEncerramentoProposta")
    if expired(deadline):
        return None
    control = r.get("numeroControlePNCP") or f"{cnpj}-{ano}-{seq}"
    url = f"https://pncp.gov.br/app/editais/{cnpj}/{ano}/{int(seq)}"
    raw_value = r.get("valorTotalEstimado")
    try:
        value = float(raw_value) if raw_value is not None else None
    except (TypeError, ValueError):
        value = None
    return dict(
        id=str(control), titulo=str(obj or "Contratação de refrigeração")[:185],
        objeto=full[:4000], uf=str(unidade.get("ufSigla") or "").upper(),
        municipio=str(unidade.get("municipioNome") or ""),
        orgao=str(org.get("razaoSocial") or ""),
        valor=value, encerramento=deadline,
        publicacao=r.get("dataPublicacaoPncp"),
        categoria=classify(full), modalidade=str(r.get("modalidadeNome") or ""),
        url=url,
    )


def previous():
    try:
        d = json.loads(DEST.read_text(encoding="utf8"))
        return d.get("items", []) if isinstance(d, dict) else []
    except (ValueError, OSError):
        return []


def main():
    found, errors, n = {}, [], 0
    limit = (NOW + timedelta(days=45)).strftime("%Y%m%d")
    for uf in UFS:
        for mod in MODALIDADES:
            for page in range(1, MAX_PAGES + 1):
                qs = urlencode(dict(dataFinal=limit, codigoModalidadeContratacao=mod, uf=uf, pagina=page, tamanhoPagina=50))
                url = "https://pncp.gov.br/api/consulta/v1/contratacoes/proposta?" + qs
                try:
                    raw = load(url)
                    rows = raw.get("data") or []
                    n += 1
                    for row in rows:
                        item = convert(row)
                        if item:
                            found[item["id"]] = item
                    print(f"{uf} mod={mod} pag={page}: {len(rows)} registros, {len(found)} úteis", flush=True)
                    if len(rows) < 50 or page >= int(raw.get("totalPaginas") or 1):
                        break
                except (RuntimeError, TypeError, AttributeError, ValueError) as exc:
                    msg = f"{uf}/{mod}/{page}: {str(exc)[:145]}"
                    errors.append(msg)
                    print("AVISO " + msg, file=sys.stderr, flush=True)
                    break
                time.sleep(.75)
    preserved = False
    if not found and errors:
        for x in previous():
            if x.get("url", "").startswith("https://pncp.gov.br/") and not expired(x.get("encerramento")):
                found[x["id"]] = x
        preserved = bool(found)
    rows = sorted(found.values(), key=lambda x: x.get("encerramento") or "9999")
    result = dict(
        atualizadoEm=NOW.isoformat(),
        items=rows, parcial=True,
        consultasRealizadas=n, erros=errors[:12], dadosPreservados=preserved,
        fonte="PNCP — Portal Nacional de Contratações Públicas",
        nota="Amostra limitada por estado, modalidade e página. Pode faltar edital. Confira sempre prazo e habilitação no PNCP.",
    )
    DEST.parent.mkdir(parents=True, exist_ok=True)
    DEST.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(f"Finalizado: {len(rows)} licitações relacionadas, {n} consultas, {len(errors)} erros.", flush=True)
    return 0 if n > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
