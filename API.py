from fastapi import FastAPI, HTTPException

app = FastAPI()

usuarios = []
medicos = []
agendamentos = []

@app.post("/usuarios")
def criar_usuario(nome: str, email: str, senha: str):
    for u in usuarios:
        if u["email"] == email:
            raise HTTPException(status_code=400, detail="Email já cadastrado")

    novo = {"id": len(usuarios) + 1, "nome": nome, "email": email, "senha": senha}
    usuarios.append(novo)
    return novo

@app.get("/usuarios")
def listar_usuarios():
    return usuarios


@app.post("/medicos")
def criar_medico(nome: str, especialidade: str):
    novo = {"id": len(medicos) + 1, "nome": nome, "especialidade": especialidade}
    medicos.append(novo)
    return novo

@app.get("/medicos")
def listar_medicos():
    return medicos


@app.post("/agendamentos")
def criar_agendamento(usuario_id: int, medico_id: int, data_hora: str, observacao: str = ""):
    if not any(u["id"] == usuario_id for u in usuarios):
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    if not any(m["id"] == medico_id for m in medicos):
        raise HTTPException(status_code=404, detail="Médico não encontrado")

    novo = {
        "id": len(agendamentos) + 1,
        "usuario_id": usuario_id,
        "medico_id": medico_id,
        "data_hora": data_hora,
        "observacao": observacao
    }
    agendamentos.append(novo)
    return novo

@app.get("/agendamentos")
def listar_agendamentos():
    return agendamentos


@app.get("/")
def root():
    return {"mensagem": "API de Agendamento funcionando 🚀"}
