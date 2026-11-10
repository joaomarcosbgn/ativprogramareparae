"use strict";
(() => {
  const estado = document.getElementById("estado");
  let usuario;
  try { usuario = JSON.parse(sessionStorage.getItem("usuario") || "null"); } catch (_) {}
  const token = sessionStorage.getItem("token");
  if (!token || usuario?.tipo !== "admin") { location.replace("login.html"); return; }
  const auth = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
  const avisar = (msg) => { estado.textContent = msg; };
  async function api(path, options = {}) {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: auth });
    if (res.status === 401 || res.status === 403) { avisar("Sessão sem autorização. Faça login novamente."); throw new Error("Sem autorização"); }
    const data = res.status === 204 ? null : await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Erro HTTP ${res.status}`);
    return data;
  }
  function button(text, fn) { const b = document.createElement("button"); b.type="button"; b.textContent=text; b.addEventListener("click", fn); return b; }
  function item(container, label, actions) {
    const row = document.createElement("div"); row.className="item";
    const span=document.createElement("span"); span.textContent=label; row.append(span);
    actions.forEach(([text,fn])=>row.append(button(text,fn)));
    container.append(row);
  }
  async function loadUsers() {
    const list = document.getElementById("usuarios"); list.replaceChildren();
    const users=await api("/usuarios?limit=100");
    if (!users.length) { list.textContent="Nenhum usuário."; return; }
    for (const u of users) item(list, `${u.id} — ${u.nome} (${u.email}) — ${u.tipo}`, [
      ["Editar",async()=>{const nome=prompt("Nome:",u.nome);if(nome===null)return;const email=prompt("E-mail:",u.email);if(email===null)return;try{await api(`/usuarios/${u.id}`,{method:"PUT",body:JSON.stringify({nome,email})});avisar("Usuário atualizado.");await loadUsers();}catch(e){avisar(e.message);} }],
      ["Excluir",async()=>{if(!confirm(`Excluir ${u.nome}? Esta ação não pode ser desfeita.`))return;try{await api(`/usuarios/${u.id}`,{method:"DELETE"});avisar("Usuário excluído.");await loadUsers();}catch(e){avisar(e.message);} }]
    ]);
  }
  async function loadCategories() {
    const list=document.getElementById("categorias");list.replaceChildren();
    const cats=await api("/categorias?limit=100");
    const select=document.getElementById("categoriaServico");select.replaceChildren();
    for(const c of cats){const o=document.createElement("option");o.value=c.id;o.textContent=c.nome;select.append(o);
      item(list,`${c.id} — ${c.nome}`,[
        ["Editar",async()=>{const nome=prompt("Nome da categoria:",c.nome);if(nome===null)return;try{await api(`/categorias/${c.id}`,{method:"PUT",body:JSON.stringify({nome})});avisar("Categoria atualizada.");await loadCategories();}catch(e){avisar(e.message);}}],
        ["Excluir",async()=>{if(!confirm(`Excluir categoria ${c.nome}?`))return;try{await api(`/categorias/${c.id}`,{method:"DELETE"});avisar("Categoria excluída.");await loadCategories();}catch(e){avisar(e.message);}}]
      ]);
    }
  }
  async function loadServices() {
    const list=document.getElementById("servicos");list.replaceChildren();
    const servicos=await api("/servicos?limit=100");
    if(!servicos.length){list.textContent="Nenhum serviço cadastrado.";return;}
    for(const s of servicos) item(list,`${s.id} — ${s.nome} — R$ ${Number(s.preco).toFixed(2)} — categoria ${s.categoria_id}`,[
      ["Editar",async()=>{const nome=prompt("Nome:",s.nome);if(nome===null)return;const preco=prompt("Preço:",s.preco);if(preco===null)return;const categoria_id=prompt("ID da categoria:",s.categoria_id);if(categoria_id===null)return;try{await api(`/servicos/${s.id}`,{method:"PUT",body:JSON.stringify({nome,preco:Number(preco),categoria_id:Number(categoria_id)})});avisar("Serviço atualizado.");await loadServices();}catch(e){avisar(e.message);}}],
      ["Excluir",async()=>{if(!confirm(`Excluir serviço ${s.nome}?`))return;try{await api(`/servicos/${s.id}`,{method:"DELETE"});avisar("Serviço excluído.");await loadServices();}catch(e){avisar(e.message);}}]
    ]);
  }
  document.getElementById("novoUsuario").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);const tipo=f.get("tipo");const dados={nome:f.get("nome"),email:f.get("email"),senha:f.get("senha"),tipo};if(tipo==="profissional"){dados.especialidade=f.get("especialidade");dados.telefone=f.get("telefone");}try{await api("/usuarios",{method:"POST",body:JSON.stringify(dados)});e.target.reset();avisar("Usuário cadastrado.");await loadUsers();}catch(err){avisar(err.message);}});
  document.getElementById("novaCategoria").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);try{await api("/categorias",{method:"POST",body:JSON.stringify({nome:f.get("nome")})});e.target.reset();avisar("Categoria criada.");await loadCategories();}catch(err){avisar(err.message);}});
  document.getElementById("novoServico").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.target);try{await api("/servicos",{method:"POST",body:JSON.stringify({nome:f.get("nome"),preco:Number(f.get("preco")),categoria_id:Number(f.get("categoria_id")),descricao:f.get("descricao")||null})});e.target.reset();avisar("Serviço criado.");await loadServices();}catch(err){avisar(err.message);}});
  document.getElementById("sair").addEventListener("click",()=>{sessionStorage.removeItem("token");sessionStorage.removeItem("usuario");location.replace("login.html");});
  Promise.all([loadUsers(),loadCategories(),loadServices()]).catch(e=>avisar(e.message));
})();