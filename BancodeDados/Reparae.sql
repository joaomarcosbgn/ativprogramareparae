BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "profissionais" (
	"id"	INTEGER,
	"usuario_id"	INTEGER NOT NULL,
	"especialidade"	TEXT NOT NULL,
	"telefone"	TEXT NOT NULL,
	"disponivel"	INTEGER NOT NULL DEFAULT 1,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("usuario_id") REFERENCES "usuarios"("id")
);
CREATE TABLE IF NOT EXISTS "servicos" (
	"id"	INTEGER,
	"nome"	TEXT NOT NULL,
	"descricao"	TEXT,
	"preco"	REAL NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "solicitacoes" (
	"id"	INTEGER,
	"usuario_id"	INTEGER NOT NULL,
	"profissional_id"	INTEGER NOT NULL,
	"servico_id"	INTEGER NOT NULL,
	"status"	TEXT NOT NULL DEFAULT 'Pendente',
	"data"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("profissional_id") REFERENCES "profissionais"("id"),
	FOREIGN KEY("servico_id") REFERENCES "servicos"("id"),
	FOREIGN KEY("usuario_id") REFERENCES "usuarios"("id")
);
CREATE TABLE IF NOT EXISTS "usuarios" (
	"id"	INTEGER,
	"nome"	TEXT NOT NULL,
	"email"	TEXT NOT NULL,
	"senha"	TEXT NOT NULL,
	"tipo"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
INSERT INTO "profissionais" VALUES (1,3,'Técnico de Informática','85999999999',1);
INSERT INTO "servicos" VALUES (1,'Manutenção de Computador','Diagnóstico e manutenção de computadores.',80.0);
INSERT INTO "solicitacoes" VALUES (1,1,1,1,'Pendente','2026-08-30 23:00:00');
INSERT INTO "usuarios" VALUES (1,'Pedro','pedro@email.com','123456','cliente');
INSERT INTO "usuarios" VALUES (2,'Pedro Silva','pedro@email.com','123456','cliente');
INSERT INTO "usuarios" VALUES (3,'João Souza','joao@email.com','123456','cliente');
INSERT INTO "usuarios" VALUES (4,'Carlos Técnico','carlos@email.com','123456','profissional');
COMMIT;


