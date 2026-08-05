// ---- state ----
let currentUser = null;
let profiles = [];
let selectedProfileId = null;

// ---- element refs ----
const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const userBox = document.getElementById("userBox");
const userName = document.getElementById("userName");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginError = document.getElementById("loginError");
const registerError = document.getElementById("registerError");

const profileList = document.getElementById("profileList");
const profileForm = document.getElementById("profileForm");
const profileError = document.getElementById("profileError");

const recordsEmpty = document.getElementById("recordsEmpty");
const recordsPanel = document.getElementById("recordsPanel");
const recordsTitle = document.getElementById("recordsTitle");
const recordList = document.getElementById("recordList");
const recordForm = document.getElementById("recordForm");
const recordError = document.getElementById("recordError");

// ---- tabs (login / register) ----
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const showLogin = btn.dataset.tab === "login";
    loginForm.classList.toggle("hidden", !showLogin);
    registerForm.classList.toggle("hidden", showLogin);
  });
});

// ---- auth ----
function showError(el, message) {
  el.textContent = message;
  el.classList.remove("hidden");
}

function clearError(el) {
  el.textContent = "";
  el.classList.add("hidden");
}

function setSession(token, user) {
  localStorage.setItem("token", token);
  currentUser = user;
}

function clearSession() {
  localStorage.removeItem("token");
  currentUser = null;
  profiles = [];
  selectedProfileId = null;
}

function enterApp() {
  authSection.classList.add("hidden");
  appSection.classList.remove("hidden");
  userBox.classList.remove("hidden");
  userName.textContent = currentUser.name;
  loadProfiles();
}

function backToAuth() {
  authSection.classList.remove("hidden");
  appSection.classList.add("hidden");
  userBox.classList.add("hidden");
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(loginError);
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    const data = await api.login(email, password);
    setSession(data.token, { _id: data._id, name: data.name, email: data.email });
    enterApp();
  } catch (err) {
    showError(loginError, err.message);
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(registerError);
  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  try {
    const data = await api.register(name, email, password);
    setSession(data.token, { _id: data._id, name: data.name, email: data.email });
    enterApp();
  } catch (err) {
    showError(registerError, err.message);
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  backToAuth();
});

// ---- profiles ----
async function loadProfiles() {
  profiles = await api.listProfiles();
  renderProfiles();
}

function renderProfiles() {
  profileList.innerHTML = "";
  profiles.forEach((p) => {
    const li = document.createElement("li");
    li.className = "profile-item" + (p._id === selectedProfileId ? " selected" : "");
    li.innerHTML = `
      <div>
        <div class="profile-name">${escapeHtml(p.name)}</div>
        <div class="profile-relation">${escapeHtml(p.relation)}</div>
      </div>
      <button class="btn-danger" data-id="${p._id}">Delete</button>
    `;
    li.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;
      selectProfile(p._id);
    });
    li.querySelector("button").addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`Delete profile "${p.name}"? This does not delete their records.`)) return;
      await api.deleteProfile(p._id);
      if (selectedProfileId === p._id) {
        selectedProfileId = null;
        recordsPanel.classList.add("hidden");
        recordsEmpty.classList.remove("hidden");
      }
      loadProfiles();
    });
    profileList.appendChild(li);
  });
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(profileError);
  const name = document.getElementById("profileName").value;
  const relation = document.getElementById("profileRelation").value;
  try {
    await api.createProfile(name, relation);
    profileForm.reset();
    loadProfiles();
  } catch (err) {
    showError(profileError, err.message);
  }
});

function selectProfile(id) {
  selectedProfileId = id;
  renderProfiles();
  const profile = profiles.find((p) => p._id === id);
  recordsTitle.textContent = `${profile.name}'s records`;
  recordsEmpty.classList.add("hidden");
  recordsPanel.classList.remove("hidden");
  loadRecords(id);
}

// ---- records ----
async function loadRecords(profileId) {
  const records = await api.listRecords(profileId);
  renderRecords(records);
}

function renderRecords(records) {
  recordList.innerHTML = "";
  if (records.length === 0) {
    recordList.innerHTML = `<p class="empty-state">No records yet for this profile.</p>`;
    return;
  }
  records.forEach((r) => {
    const li = document.createElement("li");
    li.className = "record-item";
    const dateLabel = r.visitDate
      ? new Date(r.visitDate).toLocaleDateString()
      : new Date(r.createdAt).toLocaleDateString();
    const images = (r.images || [])
      .map((img) => `<img src="${img.url}" alt="record image">`)
      .join("");
    li.innerHTML = `
      <div class="record-item-head">
        <div>
          <div class="record-doctor">${escapeHtml(r.doctorName || "General visit")}</div>
          <div class="record-date">${dateLabel}</div>
        </div>
        <button class="btn-danger" data-id="${r._id}">Delete</button>
      </div>
      ${r.notes ? `<div class="record-notes">${escapeHtml(r.notes)}</div>` : ""}
      <div class="record-images">${images}</div>
    `;
    li.querySelector("button").addEventListener("click", async () => {
      if (!confirm("Delete this record?")) return;
      await api.deleteRecord(r._id);
      loadRecords(selectedProfileId);
    });
    recordList.appendChild(li);
  });
}

recordForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(recordError);
  if (!selectedProfileId) return;

  const doctorName = document.getElementById("recordDoctor").value;
  const visitDate = document.getElementById("recordDate").value;
  const notes = document.getElementById("recordNotes").value;
  const files = document.getElementById("recordImages").files;

  if (!files || files.length === 0) {
    showError(recordError, "Please select at least one image before uploading.");
    return;
  }

  const formData = new FormData();
  formData.append("profile", selectedProfileId);
  if (doctorName) formData.append("doctorName", doctorName);
  if (visitDate) formData.append("visitDate", visitDate);
  if (notes) formData.append("notes", notes);
  for (const file of files) formData.append("images", file);

  try {
    await api.createRecordWithImages(formData);
    recordForm.reset();
    loadRecords(selectedProfileId);
  } catch (err) {
    showError(recordError, err.message);
  }
});

// ---- helpers ----
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ---- boot ----
(async function init() {
  const token = getToken();
  if (!token) return;
  try {
    currentUser = await api.me();
    enterApp();
  } catch (err) {
    clearSession();
  }
})();
