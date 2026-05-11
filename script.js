const PROJECT_URL = 'https://upxkuvcwrpmafroqgmuf.supabase.co'; 
const ANON_KEY = 'sb_publishable_ZnFA_cJpNDy8DomvLcvWag_ZnCxPSUh'; 
const _supabase = supabase.createClient(PROJECT_URL, ANON_KEY);

let currentFilter = 'main';

async function loadMissions(typeFilter = currentFilter) {
    currentFilter = typeFilter;
    const board = document.getElementById('mission-board');
    const prereqDropdown = document.getElementById('task-prereq');
    board.innerHTML = 'RETRIEVING INTEL...';

    const { data: missions, error } = await _supabase.from('missions').select('*');

    if (error) {
        board.innerHTML = 'CONNECTION ERROR';
        return;
    }

    // Update the prerequisite dropdown for the creator form
    prereqDropdown.innerHTML = '<option value="">NO PREREQUISITE</option>';
    missions.forEach(m => {
        prereqDropdown.innerHTML += `<option value="${m.id}">${m.title}</option>`;
    });

    const completedIds = missions.filter(m => m.is_completed).map(m => m.id);

    board.innerHTML = missions
        .filter(m => m.type === typeFilter)
        .map(mission => {
            const isUnlocked = !mission.requirements || mission.requirements.every(reqId => completedIds.includes(reqId));
            const isFinished = mission.is_completed;
            
            return `
                <div class="mission-card ${isUnlocked ? '' : 'locked'} ${isFinished ? 'finished' : ''}">
                    <div class="card-header">
                        <h3>${isUnlocked ? mission.title : '?? [LOCKED] ??'}</h3>
                        ${isUnlocked ? `<button class="complete-btn" onclick="toggleComplete('${mission.id}', ${isFinished})">${isFinished ? 'REOPEN' : 'COMPLETE'}</button>` : ''}
                    </div>
                    <p>${isUnlocked ? (mission.description || 'No data.') : 'Complete prerequisites to unlock.'}</p>
                    <div class="card-footer">
                        <small>STATUS: ${isFinished ? 'CLEARED' : (isUnlocked ? 'ACTIVE' : 'REDACTED')}</small>
                        <button class="delete-btn" onclick="deleteMission('${mission.id}')">DISMISS</button>
                    </div>
                </div>
            `;
        }).join('');
}

async function deployMission() {
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const type = document.getElementById('task-type').value;
    const deadline = document.getElementById('task-deadline').value;
    const prereq = document.getElementById('task-prereq').value;

    if (!title) return alert("MISSION TITLE REQUIRED");

    const requirements = prereq ? [prereq] : [];

    const { error } = await _supabase.from('missions').insert([{ 
        title, description: desc, type, deadline: deadline || null, is_completed: false, requirements 
    }]);

    if (error) alert("DEPLOYMENT FAILED: " + error.message);
    else {
        toggleCreator();
        loadMissions(type);
    }
}

async function toggleComplete(id, currentStatus) {
    await _supabase.from('missions').update({ is_completed: !currentStatus }).eq('id', id);
    loadMissions();
}

async function deleteMission(id) {
    if (confirm("DISMISS THIS MISSION FROM RECORDS?")) {
        await _supabase.from('missions').delete().eq('id', id);
        loadMissions();
    }
}

function toggleCreator() {
    const creator = document.getElementById('mission-creator');
    creator.classList.toggle('hidden');
}

window.onload = () => loadMissions('main');
setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }, 1000);
