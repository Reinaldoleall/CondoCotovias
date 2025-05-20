// Registrar encomenda
async function registrarEncomenda(bloco, apartamento, quantidade, descricao, porteiroId, porteiroNome) {
    try {
        const encomendaData = {
            bloco: bloco,
            apartamento: apartamento,
            blocoApto: `${bloco}/${apartamento}`,
            quantidade: quantidade,
            descricao: descricao || '',
            porteiroId: porteiroId,
            porteiroNome: porteiroNome,
            data: firebase.database.ServerValue.TIMESTAMP,
            status: 'pendente'
        };
        
        const newEncomendaRef = database.ref('encomendas').push();
        await newEncomendaRef.set(encomendaData);
        
        // Envia notificação para o morador
        const moradorSnapshot = await database.ref('users')
            .orderByChild('bloco')
            .equalTo(bloco)
            .once('value');
        
        let morador = null;
        moradorSnapshot.forEach(child => {
            const user = child.val();
            if (user.apartamento === apartamento && user.tipo === 'morador') {
                morador = {
                    id: child.key,
                    ...user
                };
            }
        });
        
        if (morador) {
            await database.ref('notifications/' + morador.id).push().set({
                titulo: 'Nova encomenda',
                mensagem: `Você tem ${quantidade} encomenda(s) na portaria`,
                tipo: 'encomenda',
                encomendaId: newEncomendaRef.key,
                data: firebase.database.ServerValue.TIMESTAMP,
                lida: false
            });
        }
        
        return newEncomendaRef.key;
    } catch (error) {
        console.error("Erro ao registrar encomenda:", error);
        throw error;
    }
}

// Obter encomendas por morador
async function getEncomendasPorMorador(bloco, apartamento) {
    try {
        const blocoApto = `${bloco}/${apartamento}`;
        const snapshot = await database.ref('encomendas')
            .orderByChild('blocoApto')
            .equalTo(blocoApto)
            .once('value');
        
        if (!snapshot.exists()) {
            return [];
        }
        
        const encomendas = [];
        snapshot.forEach(child => {
            encomendas.push({
                id: child.key,
                ...child.val()
            });
        });
        
        return encomendas;
    } catch (error) {
        console.error("Erro ao buscar encomendas:", error);
        throw error;
    }
}

// Confirmar retirada de encomenda
async function confirmarRetirada(encomendaId, retiradoPor) {
    try {
        // Atualiza a encomenda
        const updates = {
            status: 'retirado',
            retiradoPor: retiradoPor,
            dataRetirada: firebase.database.ServerValue.TIMESTAMP
        };
        
        await database.ref('encomendas/' + encomendaId).update(updates);
        
        // Move para o histórico
        const encomendaSnapshot = await database.ref('encomendas/' + encomendaId).once('value');
        const encomendaData = encomendaSnapshot.val();
        
        await database.ref('historico/' + encomendaId).set(encomendaData);
        await database.ref('encomendas/' + encomendaId).remove();
        
        // Envia notificação para o porteiro
        await database.ref('notifications/' + encomendaData.porteiroId).push().set({
            titulo: 'Encomenda retirada',
            mensagem: `Encomenda para ${encomendaData.blocoApto} foi retirada`,
            tipo: 'retirada',
            encomendaId: encomendaId,
            data: firebase.database.ServerValue.TIMESTAMP,
            lida: false
        });
        
        return encomendaData;
    } catch (error) {
        console.error("Erro ao confirmar retirada:", error);
        throw error;
    }
}

// Obter histórico de encomendas
async function getHistoricoEncomendas() {
    try {
        const snapshot = await database.ref('historico')
            .orderByChild('data')
            .limitToLast(50)
            .once('value');
        
        if (!snapshot.exists()) {
            return [];
        }
        
        const historico = [];
        snapshot.forEach(child => {
            historico.push({
                id: child.key,
                ...child.val()
            });
        });
        
        return historico.reverse(); // Mais recente primeiro
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        throw error;
    }
}

// Obter notificações do usuário
async function getNotificacoesUsuario(userId) {
    try {
        const snapshot = await database.ref('notifications/' + userId)
            .orderByChild('data')
            .limitToLast(20)
            .once('value');
        
        if (!snapshot.exists()) {
            return [];
        }
        
        const notificacoes = [];
        snapshot.forEach(child => {
            notificacoes.push({
                id: child.key,
                ...child.val()
            });
        });
        
        return notificacoes.reverse(); // Mais recente primeiro
    } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        throw error;
    }
}

// Marcar notificação como lida
async function marcarNotificacaoComoLida(userId, notificacaoId) {
    try {
        await database.ref(`notifications/${userId}/${notificacaoId}/lida`).set(true);
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        throw error;
    }
}

// Limpar histórico antigo
async function limparHistorico() {
    try {
        const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 dias atrás
        const snapshot = await database.ref('historico')
            .orderByChild('data')
            .endAt(cutoff)
            .once('value');
        
        if (!snapshot.exists()) {
            return 0;
        }
        
        const updates = {};
        snapshot.forEach(child => {
            updates[child.key] = null;
        });
        
        await database.ref('historico').update(updates);
        return snapshot.numChildren();
    } catch (error) {
        console.error("Erro ao limpar histórico:", error);
        throw error;
    }
}