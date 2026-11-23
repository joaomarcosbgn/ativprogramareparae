"""36 smoke tests HTTP em banco temporário, com bcrypt e python-jose reais.
Requer: pip install -r requirements.txt -r requirements-test.txt
Requer CREDENCIAIS_DEMONSTRACAO_PRIVADO.csv na pasta API.
Execute: python testar_api_integrada.py
"""
"""Smoke HTTP test with temporary bcrypt/jose compatibility shims due unavailable packages."""
import sys,os,tempfile,shutil,importlib
from pathlib import Path
from jose import jwt as pyjwt
from fastapi.testclient import TestClient
root=Path(__file__).resolve().parent
tmp=Path(tempfile.mkdtemp(prefix='reparae_http_'))
for p in root.glob('*.py'): shutil.copy2(p,tmp/p.name)
shutil.copy2(root/'reparae.db',tmp/'reparae.db')
os.environ['REPARAE_SECRET_KEY']='TEST-KEY-ONLY-'+'x'*55
os.environ['CHATBASE_IDENTITY_SECRET']='TEST-CHATBASE-'+'y'*45
sys.path.insert(0,str(tmp))
main=importlib.import_module('main')
client=TestClient(main.app)
count=0
def check(name,method,path,expected,**kw):
 global count
 r=getattr(client,method)(path,**kw)
 assert r.status_code==expected,(name,r.status_code,r.text[:300]);count+=1
 print('PASS',name,r.status_code)
 return r
try:
 check('root','get','/',200)
 cats=check('categories','get','/categorias',200).json();assert len(cats)>=5
 services=check('services','get','/servicos',200).json();assert len(services)>=15
 pros=check('professionals','get','/profissionais?limit=100',200).json();assert len(pros)>=30
 pag=check('pagination','get','/profissionais/paginados?pagina=2&por_pagina=6',200).json();assert len(pag['itens'])==6
 check('search by service','get','/profissionais?q=Higieniza%C3%A7%C3%A3o%20de%20Sof%C3%A1',200)
 assert len(client.get('/profissionais?q=Higieniza%C3%A7%C3%A3o%20de%20Sof%C3%A1').json())==2
 check('filter by category','get','/profissionais?categoria=Tecnologia',200)
 assert len(client.get('/profissionais?categoria=Tecnologia').json())==6
 check('filter by region','get','/profissionais?regiao=Eus%C3%A9bio',200)
 check('sort','get','/profissionais?ordenar=nome_desc',200)
 check('invalid sort','get','/profissionais?ordenar=foo',400)
 check('unauthorized list','get','/usuarios',401)
 check('unauthorized private','get','/me/profissional',401)
 # generate a temporary account via public signup and test login
 email='teste-http@reparae.example';password='SenhaSegura123!'
 new=check('signup','post','/usuarios',201,json={'nome':'Teste HTTP','email':email,'senha':password,'tipo':'cliente'})
 login=check('login','post','/login',200,json={'email':email,'senha':password}).json()
 h={'Authorization':'Bearer '+login['access_token']}
 check('client forbidden admin','get','/usuarios',403,headers=h)
 check('client forbidden professional','get','/me/profissional',403,headers=h)
 check('client own account','get',f"/usuarios/{new.json()['id']}",200,headers=h)
 check('client forbidden other','get','/usuarios/19',403,headers=h)
 check('client requests','get','/solicitacoes',200,headers=h)
 check('chatbase signed identity','get','/chatbase-token',200,headers=h)
 check('bad password','post','/login',401,json={'email':email,'senha':'wrongpass123'})
 # verify seeded professional login via separate credential file
 import csv
 with open(root/'CREDENCIAIS_DEMONSTRACAO_PRIVADO.csv',encoding='utf-8') as f: demo=next(csv.DictReader(f))
 token=check('demo professional login','post','/login',200,json=demo).json()['access_token']
 ph={'Authorization':'Bearer '+token}
 check('professional own profile','get','/me/profissional',200,headers=ph)
 check('professional own services','get','/me/servicos',200,headers=ph)
 check('professional forbidden client create','post','/solicitacoes',403,headers=ph,json={'profissional_id':3,'servico_id':2})
 # Admin access tests use a signed token for the existing admin (no known password).
 import sqlite3
 db=sqlite3.connect(tmp/'reparae.db')
 adminid=db.execute("select id from usuarios where tipo='admin' limit 1").fetchone()[0]
 ah={'Authorization':'Bearer '+pyjwt.encode({'sub':str(adminid),'exp':9999999999},os.environ['REPARAE_SECRET_KEY'],algorithm='HS256')}
 check('admin list users','get','/usuarios',200,headers=ah)
 newcat=check('admin create category','post','/categorias',201,headers=ah,json={'nome':'Categoria Teste HTTP','descricao':'Teste'})
 catid=newcat.json()['id']
 newserv=check('admin create service','post','/servicos',201,headers=ah,json={'categoria_id':catid,'nome':'Serviço HTTP','descricao':'Teste','preco':99})
 servid=newserv.json()['id']
 check('admin update service','put',f'/servicos/{servid}',200,headers=ah,json={'preco':101})
 check('admin delete service','delete',f'/servicos/{servid}',204,headers=ah)
 check('admin delete category','delete',f'/categorias/{catid}',204,headers=ah)
 # Valid request lifecycle on isolated DB: client -> professional -> accepted -> completed
 profid=db.execute('select id from profissionais where usuario_id=(select id from usuarios where email=?)',(demo['email'],)).fetchone()[0]
 sid=db.execute('select servico_id from profissional_servicos where profissional_id=?',(profid,)).fetchone()[0]
 req=check('client creates request','post','/solicitacoes',201,headers=h,json={'profissional_id':profid,'servico_id':sid})
 reqid=req.json()['id']
 check('professional sees request','get',f'/solicitacoes/{reqid}',200,headers=ph)
 check('professional accepts request','patch',f'/solicitacoes/{reqid}/status',200,headers=ph,json={'status':'Aceita'})
 check('professional completes request','patch',f'/solicitacoes/{reqid}/status',200,headers=ph,json={'status':'Concluída'})
 check('client cannot cancel completed','patch',f'/solicitacoes/{reqid}/status',409,headers=h,json={'status':'Cancelada'})
 db.close()
 print('HTTP_REAL_DEPENDENCIES_TESTS_PASSED',count)
finally: shutil.rmtree(tmp)
