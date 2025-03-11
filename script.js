// Variáveis globais
let uuid = localStorage.getItem("chat_uuid") || crypto.randomUUID();
localStorage.setItem("chat_uuid", uuid);
let username = "";
let selectedUser = "Todos";
let visibility = 'public';
let users = [];
const participantsList = document.getElementById('participants-list');

// Pedir o nome do usuário
async function askUsername() {
    while (true) {
        username = prompt("Qual é o seu nome?");
        if (!username) continue;

        try {
            const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/participants/${uuid}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: username })
            });
            if (response.ok) {
                enterRoom();
                break;
            }
        } catch (err) {
            alert("Nome já em uso, tente outro!");
        }
    }
}

// Entrar na sala de chat
async function enterRoom() {
    setInterval(keepConnection, 5000);
    fetchMessages();
    setInterval(getParticipants, 10000);
}

// Manter a conexão ativa
async function keepConnection() {
    await fetch(`https://mock-api.driven.com.br/api/v6/uol/status/${uuid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username })
    });
}

// Buscar mensagens
async function fetchMessages() {
    try {
        const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/messages/${uuid}`);
        const messages = await response.json();
        
        renderMessages(messages); // Agora as mensagens serão exibidas corretamente

        setTimeout(fetchMessages, 3000);
    } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
    }
}


// Renderizar mensagens no chat
function renderMessages(messages) {
    const messagesList = document.getElementById('messages');

    messages.forEach(msg => {
        // Filtrar mensagens privadas corretamente
        if (msg.type === "private_message" && msg.to !== username && msg.from !== username) {
            return;
        }

        // 🔄 Verifica se a mensagem já foi adicionada antes de renderizar
        const existingMessage = Array.from(messagesList.children).some(
            li => li.dataset.id === msg.time + msg.from + msg.text
        );
        if (existingMessage) return; // Se já existe, não adiciona de novo

        const li = document.createElement('li');
        li.classList.add(msg.type);
        li.dataset.id = msg.time + msg.from + msg.text; // ID único para evitar duplicação

        const to = msg.to === "Todos" ? "<strong>Todos</strong>" : `<strong>${msg.to}</strong>`;

        li.innerHTML = `<span class='time'>(${msg.time})</span> <strong>${msg.from}</strong> para ${to}: ${msg.text}`;

        messagesList.appendChild(li);
        messagesList.scrollTop = messagesList.scrollHeight; // Rolar para o final
    });
}



// Buscar participantes
async function getParticipants() {
    const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/participants/${uuid}`);
    const participants = await response.json();
    users = participants.map(p => p.name);
    renderParticipants(participants);
}

// Renderizar lista de participantes
function renderParticipants(participants) {
    participantsList.innerHTML = "";

    // Criar a opção "Todos"
    const allOption = document.createElement('li');
    allOption.classList.add("participant");
    allOption.dataset.name = "Todos";
    allOption.textContent = "Todos";
    allOption.addEventListener("click", () => selectParticipant("Todos"));
    participantsList.appendChild(allOption);

    // Adicionar os participantes dinâmicos
    participants.forEach(participant => {
        const li = document.createElement("li");
        li.classList.add("participant");
        li.dataset.name = participant.name;
        li.textContent = participant.name;

        li.addEventListener("click", () => selectParticipant(participant.name));
        participantsList.appendChild(li);
    });

    // Atualizar visualmente a seleção (garantindo que "Todos" começa selecionado)
    updateSelection();
}

// Selecionar participante
function selectParticipant(name) {
    selectedUser = name;

    // Atualiza a interface para refletir a seleção
    const selectedParticipantElement = document.getElementById("selected-destination");
    if (selectedParticipantElement) {
        selectedParticipantElement.textContent = `Enviando para: ${selectedUser}`;
    }

    updateSelection();
}

// Atualizar visualmente a seleção
function updateSelection() {
    document.querySelectorAll(".participant").forEach(el => {
        if (el.dataset.name === selectedUser) {
            el.classList.add("selected");
        } else {
            el.classList.remove("selected");
        }
    });
}

// Configurar visibilidade
const publicOption = document.querySelector('#public-option');
const privateOption = document.querySelector('#private-option');

publicOption.addEventListener('click', () => {
    visibility = 'public';
    document.getElementById('selected-visibility').textContent = "Visibilidade: Pública";

    // Remover a seleção de "Reservadamente"
    privateOption.classList.remove("selected-visibility");

    // Adicionar a seleção a "Público"
    publicOption.classList.add("selected-visibility");

    updateSelection();
});

privateOption.addEventListener('click', () => {
    if (selectedUser === "Todos") {
        alert("Selecione um participante para enviar a mensagem privada.");
        return;
    }
    visibility = 'private';
    document.getElementById('selected-visibility').textContent = "Visibilidade: Reservada";

    // Remover a seleção de "Público"
    publicOption.classList.remove("selected-visibility");

    // Adicionar a seleção a "Reservadamente"
    privateOption.classList.add("selected-visibility");

    updateSelection();
});


// Enviar mensagem
document.getElementById('send-btn').addEventListener('click', async () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();

    if (message !== "") {
        const messageData = {
            from: username,
            to: selectedUser,
            text: message,
            type: visibility === 'public' ? 'message' : 'private_message',
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        try {
            // Adicionar a mensagem na tela imediatamente
            addMessageToChat(messageData, true);

            await fetch("https://mock-api.driven.com.br/api/v6/uol/messages", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            // Limpar input
            messageInput.value = "";

            // Buscar novas mensagens apenas se for pública
            if (visibility === "public") {
                setTimeout(fetchMessages, 1000);
            }

        } catch (err) {
            console.error("Erro ao enviar mensagem:", err);
        }
    }
});

// Adicionar mensagem na interface
function addMessageToChat(messageData, isLocal = false) {
    const messagesList = document.getElementById('messages');
    const li = document.createElement('li');

    li.classList.add(messageData.type);
    if (isLocal) li.classList.add("local-message");

    const to = messageData.to === "Todos" ? "<strong>Todos</strong>" : `<strong>${messageData.to}</strong>`;

    li.innerHTML = `<span class='time'>(${messageData.time})</span> <strong>${messageData.from}</strong> para ${to}: ${messageData.text}`;

    messagesList.appendChild(li);
    messagesList.scrollTop = messagesList.scrollHeight;
}

// Controle do menu lateral
const participantsBtn = document.getElementById('participants-btn'); // Botão que abre a sidebar
const participantsDiv = document.getElementById('participants'); // A própria sidebar

// ✅ Abrir sidebar ao clicar no botão
participantsBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    participantsDiv.classList.add('visible');
});

// ✅ Fechar sidebar ao clicar fora
document.addEventListener('click', (event) => {
    if (!participantsDiv.contains(event.target) && !participantsBtn.contains(event.target)) {
        participantsDiv.classList.remove('visible');
    }
});

// ✅ Evitar que cliques dentro da sidebar a fechem
participantsDiv.addEventListener('click', (event) => {
    event.stopPropagation();
});


askUsername();
