// Use the URL from your Data API settings
const PROJECT_URL = 'https://upxkuvcwrpmafroqgmuf.supabase.co/rest/v1/'; 
// Use the 'sb_publishable' key you found
const ANON_KEY = 'sb_publishable_ZnFA_cJpNDy8DomvLcvWag_ZnCxPSUh'; 

const _supabase = supabase.createClient(PROJECT_URL, ANON_KEY);

async function loadMissions(typeFilter) {
    const board = document.getElementById('mission-board');
    board.innerHTML = 'RETRIEVING INTEL...';

    // Fetch all missions
    const { data: missions, error } = await supabase
        .from('missions')
        .select('*');

    if (error) {
        board.innerHTML = 'CONNECTION ERROR';
        return;
    }

    const completedIds = missions.filter(m => m.is_completed).map(m => m.id);

    board.innerHTML = missions
        .filter(m => m.type === typeFilter)
        .map(mission => {
            // Logic: Is mission unlocked?
            const isUnlocked = mission.requirements.every(reqId => completedIds.includes(reqId));
            
            return `
                <div class="mission-card ${isUnlocked ? '' : 'locked'}">
                    <h3>${isUnlocked ? mission.title : '?? [LOCKED] ??'}</h3>
                    <p>${isUnlocked ? mission.description : 'Complete prerequisite missions to unlock data.'}</p>
                    <small>Deadline: ${mission.deadline || 'NONE'}</small>
                </div>
            `;
        }).join('');
}

// Initial Load
loadMissions('main');

// Simple Clock Logic
setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);
