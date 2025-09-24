# Exam Helper - Aplicação Web para Avaliação de Provas em PDF

Uma aplicação web completa para realizar provas com upload de PDF e gabarito, oferecendo dois modos de operação: **Temporizador** (com submissão automática) e **Cronômetro** (com submissão manual).

## 🚀 Funcionalidades

### Modo Temporizador
- ⏰ Configure um tempo limite para a prova
- 🔄 Submissão automática quando o tempo acabar
- ⚠️ Alertas visuais nos últimos 5 minutos e 1 minuto
- 📊 Barra de progresso visual do tempo

### Modo Cronômetro
- ⏱️ Cronometra o tempo de realização da prova
- 👤 Submissão manual pelo usuário
- 📈 Acompanhamento do tempo decorrido em tempo real

### Funcionalidades Gerais
- 📄 Upload de prova em PDF
- 📝 Upload de gabarito em formato TXT ou PDF
- ✅ Validação automática do formato do gabarito
- 📊 Correção automática com comparação das respostas
- 🎯 Relatório detalhado de resultados
- 📱 Interface responsiva para desktop e mobile
- 💾 Download dos resultados em JSON

## 🛠️ Tecnologias Utilizadas

### Backend
- **Go 1.21+** - Linguagem principal
- **Gin** - Framework web HTTP
- **Gorilla WebSocket** - Para comunicação em tempo real
- **UUID** - Geração de identificadores únicos

### Frontend
- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **CSS3** - Estilização com gradientes e animações
- **Axios** - Cliente HTTP

## 📋 Pré-requisitos

- **Go 1.21 ou superior**
- **Node.js 16 ou superior**
- **npm ou yarn**

## 🚀 Como Executar

### 1. Clone o repositório
```bash
git clone <repository-url>
cd exam-helper
```

### 2. Configure e execute o backend
```bash
# Instale as dependências do Go
go mod tidy

# Execute o servidor
go run main.go
```

O servidor será iniciado na porta `8080` por padrão.

### 3. Configure e execute o frontend
```bash
# Entre no diretório do frontend
cd web

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm start
```

O frontend será iniciado na porta `3000` e se conectará automaticamente ao backend.

### 4. Acesse a aplicação
Abra seu navegador e vá para: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
exam-helper/
├── main.go                 # Ponto de entrada da aplicação
├── go.mod                  # Dependências do Go
├── internal/
│   ├── api/
│   │   └── server.go       # Configuração do servidor HTTP
│   ├── config/
│   │   └── config.go       # Configurações da aplicação
│   ├── handlers/
│   │   ├── exam_handler.go # Handlers para endpoints de prova
│   │   └── file_handler.go # Handlers para upload de arquivos
│   ├── models/
│   │   └── exam.go         # Modelos de dados
│   └── services/
│       ├── exam_service.go # Lógica de negócio das provas
│       └── pdf_service.go  # Processamento de PDFs e gabaritos
└── web/
    ├── package.json        # Dependências do React
    ├── public/
    │   └── index.html      # Template HTML
    └── src/
        ├── components/     # Componentes React
        ├── services/       # Serviços de API
        ├── types/          # Definições TypeScript
        └── App.tsx         # Componente principal
```

## 📝 Formato do Gabarito

O gabarito deve ser um arquivo TXT ou PDF seguindo o formato:

```
1. A
2. B
3. C
4. D
5. E
...
```

Formatos aceitos:
- `1. A` ou `1) A` ou `1: A`
- `Q1. A` ou `Question 1: A`
- `1 A` (espaço simples)

## 🔧 Configuração

### Variáveis de Ambiente

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `PORT` | Porta do servidor | `8080` |
| `UPLOAD_DIR` | Diretório para uploads | `./uploads` |
| `MAX_FILE_SIZE` | Tamanho máximo dos arquivos (bytes) | `10485760` (10MB) |
| `FRONTEND_URL` | URL do frontend para CORS | `http://localhost:3000` |
| `DEBUG` | Modo de depuração | `true` |

### Exemplo de arquivo `.env`
```bash
PORT=8080
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
FRONTEND_URL=http://localhost:3000
DEBUG=true
```

## 📊 API Endpoints

### Provas
- `POST /api/v1/exams` - Criar nova prova
- `GET /api/v1/exams/:id` - Obter detalhes da prova
- `POST /api/v1/exams/:id/start` - Iniciar prova
- `POST /api/v1/exams/:id/submit` - Submeter respostas
- `GET /api/v1/exams/:id/status` - Status da prova
- `GET /api/v1/exams/:id/answer-key-preview` - Preview do gabarito

### Outros
- `GET /health` - Health check
- `GET /uploads/*` - Servir arquivos (apenas em modo debug)

## 🧪 Como Usar

### 1. Criar uma Nova Prova
1. Acesse a aplicação no navegador
2. Escolha o modo (Temporizador ou Cronômetro)
3. Se escolher Temporizador, defina a duração em minutos
4. Faça upload da prova (PDF)
5. Faça upload do gabarito (TXT ou PDF)
6. Clique em "Criar Prova"

### 2. Realizar a Prova
1. Leia as instruções na tela de preparação
2. Clique em "Iniciar Prova"
3. Responda às questões marcando A, B, C, D ou E
4. Acompanhe o tempo no canto superior direito
5. No modo Cronômetro, clique em "Submeter Prova" quando terminar
6. No modo Temporizador, a prova será submetida automaticamente

### 3. Ver Resultados
1. Após a submissão, veja sua pontuação e estatísticas
2. Clique em "Ver Detalhes" para análise questão por questão
3. Use os filtros para ver apenas acertos ou erros
4. Baixe o resultado em JSON se desejar

## 🔒 Segurança

- Validação de tipos de arquivo nos uploads
- Limite de tamanho de arquivos
- Sanitização de nomes de arquivos
- Validação de entrada em todos os endpoints
- CORS configurado adequadamente

## 🚀 Deploy em Produção

### Backend
```bash
# Build da aplicação
go build -o exam-helper main.go

# Execute
./exam-helper
```

### Frontend
```bash
# Build de produção
cd web
npm run build

# Os arquivos estarão em web/build/
```

### Docker (Opcional)
Crie um `Dockerfile` para containerização:

```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

# Runtime stage
FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
COPY --from=builder /app/web/build ./web/build
CMD ["./main"]
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🐛 Problemas Conhecidos

- O parsing de PDF está simplificado e espera formato de texto
- Para PDFs complexos, recomenda-se converter para TXT primeiro
- Em produção, considere usar uma biblioteca robusta de parsing de PDF

## 📞 Suporte

Para dúvidas ou problemas:
1. Abra uma issue no GitHub
2. Verifique os logs do servidor para erros
3. Confirme que os formatos de arquivo estão corretos

---

**Desenvolvido com ❤️ para facilitar a correção de provas**