"""Testes HTTP reais, banco novo temporário; nunca usa DATABASE_URL externo."""
import os, sys, tempfile, shutil, subprocess
from pathlib import Path

def executar():
    from fastapi.testclient import TestClient
    from jose import jwt
    from datetime import datetime, timedelta, timezone
    import main, models, security
    from database import SessionLocal
    c = TestClient(main.app)
    total = 0
    def check(method, path, expected, **kwargs):
        nonlocal total
        r = c.request(method, path, **kwargs)
        assert r.status_code == expected, (method, path, r.status_code, expected)
        total += 1
        print('OK', method, path, expected)
        return r.json() if r.content else None
    password = 'TesteSeguro123!'
    with SessionLocal() as db:
        db.add(models.Usuario(nome='Admin Teste',email='admin@example.com',senha=security.hash_senha(password),tipo='admin')); db.commit()
    def login(email):
        return {'Authorization':'Bearer '+check('POST','/login',200,json={'email':email,'senha':password})['access_token']}
    def signup(email, nome, tipo='cliente'):
        d=dict(email=email,nome=nome,tipo=tipo,senha=password)
        if tipo=='profissional': d.update(telefone='85999999999',especialidade='Tecnologia')
        return check('POST','/usuarios',201,json=d)
    ah=login('admin@example.com')
    u=signup('cliente@example.com','Cliente Teste'); h=login('cliente@example.com')
    v=signup('outro@example.com','Outro Cliente'); vh=login('outro@example.com')
    check('GET','/usuarios',401); check('GET','/usuarios',403,headers=h); check('GET','/usuarios',200,headers=ah)
    check('GET',f'/usuarios/{v["id"]}',403,headers=h)
    check('PUT',f'/usuarios/{u["id"]}',400,headers=h,json={'tipo':'profissional'})
    check('POST','/usuarios',422,json=dict(nome='Admin Falso',email='fake@example.com',senha=password,tipo='admin'))
    check('POST','/usuarios',422,json=dict(nome='Senha Longa',email='long@example.com',senha='é'*40,tipo='cliente'))
    for token in ['invalido',jwt.encode({'sub':str(u['id'])},security.SECRET_KEY,algorithm='HS256'),jwt.encode({'sub':str(u['id']),'exp':datetime.now(timezone.utc)-timedelta(seconds=10)},security.SECRET_KEY,algorithm='HS256')]:
        check('GET','/usuarios',401,headers={'Authorization':'Bearer '+token})
    cat=check('POST','/categorias',201,headers=ah,json={'nome':'Tecnologia'})
    def service(nome): return check('POST','/servicos',201,headers=ah,json={'nome':nome,'categoria_id':cat['id'],'preco':80})['id']
    sid=service('Manutenção'); sid2=service('Formatação')
    check('POST','/servicos',403,headers=h,json={'nome':'Teste','categoria_id':cat['id'],'preco':80})
    check('PUT',f'/servicos/{sid2}',200,headers=ah,json={'preco':90})
    pros=[]
    for i,nome in enumerate(['Ana','Bruno','Carla','Diego']):
        email=f'prof{i}@example.com'; signup(email,nome,'profissional'); ph=login(email)
        p=check('GET','/me/profissional',200,headers=ph); pros.append((p['id'],ph))
        check('PUT','/me/profissional',200,headers=ph,json={'nome':nome,'regiao':'Eusébio'})
        if i<3: check('POST',f'/me/servicos/{sid}',201,headers=ph)
    pid,ph=pros[0]; other,oh=pros[1]; empty,eh=pros[3]
    check('GET','/me/servicos',403,headers=h); check('GET','/usuarios',403,headers=ph)
    check('POST',f'/me/servicos/{sid}',409,headers=ph)
    check('POST',f'/me/servicos/{sid2}',201,headers=ph)
    check('DELETE',f'/me/servicos/{sid2}',204,headers=ph)
    assert [x['id'] for x in check('GET',f'/profissionais/{pid}/servicos',200)]==[sid]
    assert check('GET',f'/profissionais/{empty}/servicos',200)==[]
    a=check('GET','/profissionais/paginados?por_pagina=2&pagina=1',200); b=check('GET','/profissionais/paginados?por_pagina=2&pagina=2',200)
    assert a['total']==4 and a['total_paginas']==2 and len({x['id'] for x in a['itens']+b['itens']})==4
    assert [x['nome'] for x in check('GET','/profissionais?ordenar=nome_desc',200)]==['Diego','Carla','Bruno','Ana']
    assert len(check('GET','/profissionais',200,params={'q':'Manutenção','categoria':'Tecnologia','regiao':'Eusébio'}))==3
    check('GET','/profissionais/paginados?pagina=0',400); check('GET','/profissionais?ordenar=invalid',400)
    def request(p,s,headers=h,expected=201): return check('POST','/solicitacoes',expected,headers=headers,json={'profissional_id':p,'servico_id':s})
    request(empty,sid,expected=400); request(pid,sid2,expected=400); request(pid,sid,ph,403)
    rid=request(pid,sid)['id']; path=f'/solicitacoes/{rid}'
    check('GET',path,403,headers=vh); check('GET',path,403,headers=oh); check('GET',path,200,headers=ph)
    check('PATCH',path+'/status',409,headers=h,json={'status':'Aceita'})
    check('PATCH',path+'/status',200,headers=ph,json={'status':'Aceita'})
    check('PATCH',path+'/status',200,headers=ph,json={'status':'Concluída'})
    check('PATCH',path+'/status',409,headers=h,json={'status':'Cancelada'})
    rid2=request(pid,sid)['id']; check('PATCH',f'/solicitacoes/{rid2}/status',200,headers=h,json={'status':'Cancelada'})
    check('DELETE',f'/servicos/{sid2}',204,headers=ah)
    print(f'{total} verificações HTTP aprovadas, além das asserções de conteúdo.')

if __name__=='__main__':
    if '--isolado' in sys.argv:
        if os.getenv('DATABASE_URL'): raise SystemExit('Banco externo proibido nos testes')
        executar()
    else:
        with tempfile.TemporaryDirectory() as tmp:
            for p in Path(__file__).parent.glob('*.py'): shutil.copy2(p,tmp)
            env=os.environ.copy(); env.pop('DATABASE_URL',None); env['REPARAE_SECRET_KEY']='chave-exclusiva-de-teste-'+ 'x'*48
            subprocess.run([sys.executable,str(Path(tmp)/Path(__file__).name),'--isolado'],cwd=tmp,env=env,check=True)
