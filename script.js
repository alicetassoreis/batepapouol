// Atualizando a seleção separada para participantes e visibilidade
let uuid = crypto.randomUUID();
let username = "";
let selectedUser = "Todos";  // Enviar para 'Todos' por padrão
let visibility = 'public';  // Mensagens são públicas por padrão

// Pedir nome do usuário
function askUsername() {
    username = prompt("Qual é o seu nome?");
    if (username) enterRoom();
}

// Entrar na sala
async function enterRoom() {
    try {
        await fetch(`https://mock-api.driven.com.br/api/v6/uol/participants/${uuid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: username })
        });
        setInterval(keepConnection, 5000);
        fetchMessages();
    } catch (err) {
        alert("Nome já em uso, tente outro!");
        askUsername();
    }
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
    const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/messages/${uuid}`);
    const messages = await response.json();
    renderMessages(messages);
    setTimeout(fetchMessages, 3000);
}

// Renderizar mensagens
function renderMessages(messages) {
    const messagesList = document.getElementById('messages');
    messagesList.innerHTML = "";
    messages.forEach(msg => {
        if (msg.type === "private_message" && msg.to !== username && msg.from !== username) {
            return;
        }
        const li = document.createElement('li');
        li.className = msg.type;
        const to = msg.to === 'Todos' ? '<strong>Todos</strong>' : `<strong>${msg.to}</strong>`;
        li.innerHTML = `<span class='time'>(${msg.time})</span> <strong>${msg.from}</strong> para ${to}: ${msg.text}`;
        messagesList.appendChild(li);
    });
    messagesList.scrollTop = messagesList.scrollHeight;
}

// Buscar participantes
async function getParticipants() {
    const response = await fetch(`https://mock-api.driven.com.br/api/v6/uol/participants`);
    const participants = await response.json();
    renderParticipants(participants);
}

// Renderizar lista de participantes
function renderParticipants(participants) {
    const participantsList = document.getElementById('participants-list');
    participantsList.innerHTML = "";
    participants.forEach(participant => {
        const li = document.createElement('li');
        li.textContent = participant.name;
        li.addEventListener('click', () => selectParticipant(participant.name));
        participantsList.appendChild(li);
    });

    // Adicionar a opção "Todos"
    const allOption = document.createElement('li');
    allOption.textContent = "Todos";
    allOption.addEventListener('click', () => selectParticipant('Todos'));
    participantsList.prepend(allOption);
}

// Selecionar participante
function selectParticipant(name) {
    selectedUser = name;
    document.getElementById('selected-participant').textContent = `Enviando para: ${selectedUser}`;
}

// Seleção de visibilidade
document.querySelector('#public-option').addEventListener('click', () => {
    visibility = 'public';
    document.getElementById('selected-visibility').textContent = "Visibilidade: Pública";
});

document.querySelector('#private-option').addEventListener('click', () => {
    visibility = 'private';
    document.getElementById('selected-visibility').textContent = "Visibilidade: Reservadamente";
});

// Enviar mensagem
document.getElementById('send-btn').addEventListener('click', async () => {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value;
    if (message.trim() !== "") {
        await fetch(`https://mock-api.driven.com.br/api/v6/uol/messages/${uuid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: username, 
                to: selectedUser, 
                text: message, 
                type: visibility === 'public' ? 'message' : 'private_message'
            })
        });
        messageInput.value = "";
    }
});

// Exibir participantes
document.getElementById('participants-btn').addEventListener('click', () => {
    getParticipants();
    const participantsDiv = document.getElementById('participants');
    participantsDiv.classList.toggle('hidden');
    participantsDiv.classList.toggle('visible');
});

askUsername();
