const PROJECT_URL = 'https://upxkuvcwrpmafroqgmuf.supabase.co';
const ANON_KEY = 'sb_publishable_ZnFA_cJpNDy8DomvLcvWag_ZnCxPSUh';
const _supabase = supabase.createClient(PROJECT_URL, ANON_KEY);

let state = {
    type: 'main',
    status: 'active', // active, cleared, trash
    sortBy: 'created_at'
};

async function loadMissions() {
    const board = document.getElementById('mission-board');
    board.innerHTML = 'FETCHING DATA...';

    const { data: missions, error } = await _supabase.from('missions').select('*');
    if (error) return board.innerHTML = "ERROR: " + error.message;

    // Update Prereq Dropdown
    const prereqSelect = document.getElementById('task-prereq');
    prereqSelect.innerHTML = '<option value="">NO PREREQUISITE</option>' + 
        missions.map(m => `<option value="${m.id}">${m.title}</option>`).join('');

    const completedIds = missions.filter(m => m.is_completed).map(m => m.id);

    // FILTERING LOGIC
    let filtered = missions.filter(m => {
        const typeMatch = m.type === state.type;
        if (state.status === 'trash') return m.is_deleted && typeMatch;
        if (state.status === 'cleared') return m.is_completed && !m.is_deleted && typeMatch;
        return !m.is_completed && !m.is_deleted && typeMatch;
    });

    // SORTING LOGIC
    filtered.sort((a, b) => (a[state.sortBy] > b[state.sortBy] ? 1 : -1));

    board.innerHTML = filtered.map(m => {
        const isUnlocked = !m.requirements || m.requirements.every(id => completedIds.includes(id));
        const subtasks = Array.isArray(m.subtasks) ? m.subtasks : [];

        return `
            <div class="mission-card ${m.is_completed ? 'cleared' : ''} ${!isUnlocked ? 'locked' : ''}">
                <div class="card-header">
                    <h3 class="${m.is_completed ? 'strike' : ''}">${isUnlocked ? m.title : '?? [LOCKED] ??'}</h3>
                    <div class="card-controls">
                        <button onclick="editMission('${m.id}')">EDIT</button>
                        <button onclick="updateStatus('${m.id}', 'is_completed', ${!m.is_completed})">${m.is_completed ? 'REOPEN' : 'COMPLETE'}</button>
                    </div>
                </div>
                <div class="subtasks">
                    ${subtasks.map((s, i) => `
                        <div class="sub-item">
                            <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="toggleSubtask('${m.id}', ${i})">
                            <span class="${s.completed ? 'strike' : ''}">${s.text}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="card-footer">
                    <small>DUE: ${m.deadline || 'NO DATE'}</small>
                    <button class="trash-btn" onclick="updateStatus('${m.id}', 'is_deleted', ${!m.is_deleted})">
                        ${m.is_deleted ? 'RESTORE' : 'DISMISS'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function deployMission() {
    const id = document.getElementById('edit-id').value;
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const subRaw = document.getElementById('task-sub-input').value;
    const prereq = document.getElementById('task-prereq').value;

    const subtasks = subRaw.split(',').filter(t => t.trim()).map(t => ({ text: t.trim(), completed: false }));
    const payload = { 
        title, 
        description: desc, 
        type: document.getElementById('task-type').value,
        deadline: document.getElementById('task-deadline').value || null,
        requirements: prereq ? [prereq] : [],
        subtasks
    };

    const { error } = id ? await _supabase.from('missions').update(payload).eq('id', id) 
                          : await _supabase.from('missions').insert([payload]);

    if (!error) {
        resetForm();
        loadMissions();
    }
}

async function updateStatus(id, field, value) {
    await _supabase.from('missions').update({ [field]: value }).eq('id', id);
    loadMissions();
}

async function toggleSubtask(missionId, index) {
    const { data } = await _supabase.from('missions').select('subtasks').eq('id', missionId).single();
    let subs = [...data.subtasks];
    subs[index].completed = !subs[index].completed;
    await _supabase.from('missions').update({ subtasks: subs }).eq('id', missionId);
    loadMissions();
}

async function editMission(id) {
    const { data } = await _supabase.from('missions').select('*').eq('id', id).single();
    document.getElementById('edit-id').value = data.id;
    document.getElementById('task-title').value = data.title;
    document.getElementById('task-desc').value = data.description;
    document.getElementById('task-sub-input').value = data.subtasks.map(s => s.text).join(', ');
    document.getElementById('form-title').innerText = "EDIT INTEL";
    toggleCreator();
}

function setFilter(key, val) { state[key] = val; loadMissions(); }
function setSort(val) { state.sortBy = val; loadMissions(); }
function resetForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('task-title').value = '';
    document.getElementById('task-sub-input').value = '';
    document.getElementById('form-title').innerText = "SUBMIT INTEL";
}
function toggleCreator() { document.getElementById('mission-creator').classList.toggle('hidden'); }

window.onload = loadMissions;
setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }, 1000);
