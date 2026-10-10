<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { reloadCatalog } from '../stores/catalog'
import { optimizeImage } from '../lib/cloudinary'
import VoxLogo from '../components/VoxLogo.vue'
import AdminRecordForm from '../components/admin/AdminRecordForm.vue'

const STATUSES = ['Available', 'In Rent', 'Coming Soon']

const session = ref(null)
const isAdmin = ref(null) // null = checking
const authReady = ref(false)

// Sign-in form
const email = ref('')
const password = ref('')
const signingIn = ref(false)
const authError = ref('')

// Records
const records = ref([])
const loading = ref(false)
const search = ref('')
const editing = ref(undefined) // undefined = list view, null = new record, object = editing
const saving = ref(false)
const toast = ref({ text: '', error: false })
let toastTimer

function notify(text, error = false) {
  toast.value = { text, error }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = { text: '', error: false }), error ? 6000 : 3000)
}

async function checkAdmin() {
  isAdmin.value = null
  const { data, error } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', session.value.user.id)
    .maybeSingle()
  isAdmin.value = !error && !!data
  if (isAdmin.value) loadRecords()
}

async function signIn() {
  signingIn.value = true
  authError.value = ''
  const { error } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value })
  signingIn.value = false
  if (error) authError.value = error.message
  else password.value = ''
}

async function signOut() {
  await supabase.auth.signOut()
  records.value = []
  editing.value = undefined
}

async function loadRecords() {
  loading.value = true
  const { data, error } = await supabase.from('records').select('*').order('created_at', { ascending: false })
  loading.value = false
  if (error) notify(`Couldn't load records: ${error.message}`, true)
  else records.value = data
}

const genres = computed(() => [...new Set(records.value.flatMap((r) => r.genres ?? []))].sort())

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return records.value
  return records.value.filter((r) => `${r.title} ${r.artist} ${r.artist_alt ?? ''} ${(r.genres ?? []).join(' ')} ${r.year ?? ''}`.toLowerCase().includes(q))
})

const counts = computed(() =>
  STATUSES.map((s) => ({ status: s, n: records.value.filter((r) => r.status === s).length })),
)

function openNew() {
  editing.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function openEdit(record) {
  editing.value = record
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function save(payload) {
  saving.value = true
  const isNew = editing.value === null
  const query = isNew
    ? supabase.from('records').insert(payload).select().single()
    : supabase.from('records').update(payload).eq('id', editing.value.id).select().single()
  const { data, error } = await query
  saving.value = false

  if (error) return notify(`Couldn't save: ${error.message}`, true)
  if (!data) return notify("Couldn't save — you may not have permission.", true)

  notify(isNew ? `Added “${data.title}”` : `Saved “${data.title}”`)
  editing.value = undefined
  await loadRecords()
  reloadCatalog()
}

async function setStatus(record, status) {
  const previous = record.status
  record.status = status
  const { data, error } = await supabase.from('records').update({ status }).eq('id', record.id).select().single()
  if (error || !data) {
    record.status = previous
    notify(`Couldn't update status${error ? `: ${error.message}` : ''}`, true)
  } else {
    notify(`“${record.title}” is now ${status}`)
    reloadCatalog()
  }
}

async function remove(record) {
  if (!confirm(`Delete “${record.title}” by ${record.artist}? This can't be undone.`)) return
  const { error, count } = await supabase.from('records').delete({ count: 'exact' }).eq('id', record.id)
  if (error || count === 0) return notify(`Couldn't delete${error ? `: ${error.message}` : ''}`, true)
  notify(`Deleted “${record.title}”`)
  if (editing.value?.id === record.id) editing.value = undefined
  await loadRecords()
  reloadCatalog()
}

let authSub
onMounted(async () => {
  if (!supabase) {
    authReady.value = true
    return
  }
  const { data } = await supabase.auth.getSession()
  session.value = data.session
  authReady.value = true
  if (session.value) checkAdmin()

  authSub = supabase.auth.onAuthStateChange((event, newSession) => {
    const userChanged = newSession?.user?.id !== session.value?.user?.id
    session.value = newSession
    if (newSession && userChanged) checkAdmin()
    if (!newSession) isAdmin.value = null
  }).data.subscription
})

onUnmounted(() => {
  authSub?.unsubscribe()
  clearTimeout(toastTimer)
})
</script>

<template>
  <div class="admin">
    <header class="bar">
      <div class="wrap bar-inner">
        <RouterLink to="/" class="brand" aria-label="Back to the VOX site">
          <VoxLogo ink="#f3eee6" hole="#131313" />
          <span>Admin</span>
        </RouterLink>
        <div v-if="session" class="who">
          <span class="email">{{ session.user.email }}</span>
          <button class="link-btn" @click="signOut">Sign out</button>
        </div>
      </div>
    </header>

    <main class="wrap main">
      <!-- Supabase not configured -->
      <section v-if="!supabase" class="card narrow">
        <h1>Admin unavailable</h1>
        <p>Supabase isn't connected. Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_KEY</code> to <code>.env</code> (see README).</p>
      </section>

      <p v-else-if="!authReady" class="muted">Loading…</p>

      <!-- Sign in -->
      <section v-else-if="!session" class="card narrow">
        <h1>Sign in</h1>
        <p class="muted">For VOX staff only.</p>
        <form class="signin" @submit.prevent="signIn">
          <label>
            Email
            <input v-model="email" type="email" autocomplete="username" required />
          </label>
          <label>
            Password
            <input v-model="password" type="password" autocomplete="current-password" required />
          </label>
          <p v-if="authError" class="error" role="alert">{{ authError }}</p>
          <button class="btn btn--red" :disabled="signingIn">{{ signingIn ? 'Signing in…' : 'Sign in' }}</button>
        </form>
      </section>

      <p v-else-if="isAdmin === null" class="muted">Checking access…</p>

      <!-- Signed in but not an admin -->
      <section v-else-if="!isAdmin" class="card narrow">
        <h1>No admin access</h1>
        <p>
          You're signed in as <strong>{{ session.user.email }}</strong>, but this account isn't on the admin list.
          Ask the owner to add you.
        </p>
        <button class="btn btn--ghost" @click="signOut">Sign out</button>
      </section>

      <!-- Admin -->
      <template v-else>
        <AdminRecordForm
          v-if="editing !== undefined"
          :key="editing?.id ?? 'new'"
          :record="editing"
          :genres="genres"
          :saving="saving"
          @save="save"
          @cancel="editing = undefined"
        />

        <section v-else class="list">
          <div class="list-head">
            <div>
              <h1>Records</h1>
              <p class="muted">
                {{ records.length }} total ·
                <template v-for="(c, i) in counts" :key="c.status">{{ c.n }} {{ c.status }}<template v-if="i < counts.length - 1"> · </template></template>
              </p>
            </div>
            <button class="btn btn--red" @click="openNew">+ New record</button>
          </div>

          <input v-model="search" class="search" type="search" placeholder="Search title, artist, genre, year…" aria-label="Search records" />

          <p v-if="loading" class="muted">Loading records…</p>
          <p v-else-if="!records.length" class="empty">No records yet. Add your first one.</p>
          <p v-else-if="!filtered.length" class="empty">No records match “{{ search }}”.</p>

          <ul v-else class="rows">
            <li v-for="r in filtered" :key="r.id" class="row">
              <div class="thumb" :class="{ 'no-cover': !r.cover_url }">
                <img v-if="r.cover_url" :src="optimizeImage(r.cover_url, 120)" alt="" loading="lazy" />
                <span v-else title="No cover yet">♪</span>
              </div>
              <div class="info">
                <strong>{{ r.title }}</strong>
                <span>{{ r.artist }}<template v-if="r.artist_alt"> · {{ r.artist_alt }}</template></span>
                <small>
                  {{ [(r.genres ?? []).join(' / '), r.year, r.format].filter(Boolean).join(' · ') }}
                  <template v-if="!r.setlist"> · no setlist</template>
                  <template v-if="!r.description"> · no review</template>
                </small>
              </div>
              <select
                class="status"
                :class="`s-${r.status.replace(' ', '-').toLowerCase()}`"
                :value="r.status"
                :aria-label="`Status of ${r.title}`"
                @change="setStatus(r, $event.target.value)"
              >
                <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
              </select>
              <div class="row-actions">
                <button class="btn btn--ghost small" @click="openEdit(r)">Edit</button>
                <button class="icon-btn" :aria-label="`Delete ${r.title}`" title="Delete" @click="remove(r)">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                  </svg>
                </button>
              </div>
            </li>
          </ul>
        </section>
      </template>
    </main>

    <Transition name="toast">
      <p v-if="toast.text" class="toast" :class="{ error: toast.error }" role="status">{{ toast.text }}</p>
    </Transition>
  </div>
</template>

<style scoped>
.admin {
  min-height: 100vh;
}

.bar {
  background: var(--ink);
  color: var(--paper);
}

.bar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}

.brand svg {
  height: 24px;
  width: auto;
}

.brand span {
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--red);
  color: #fff;
}

.who {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  min-width: 0;
}

.email {
  color: #b9b3aa;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.link-btn {
  border: 0;
  background: none;
  color: var(--paper);
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;
}

.main {
  padding-block: 40px 96px;
}

h1 {
  font-size: 36px;
}

.muted {
  color: var(--muted);
  margin-top: 6px;
}

code {
  font-family: var(--mono);
  font-size: 14px;
}

.card {
  background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: 20px;
  padding: 32px;
}

.card p + .btn,
.card p + p {
  margin-top: 16px;
}

.narrow {
  max-width: 440px;
  margin: 40px auto 0;
}

.signin {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 24px;
}

.signin label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 700;
  font-size: 15px;
}

.signin input,
.search {
  height: 46px;
  padding: 0 14px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: #fff;
  font-size: 16px;
  font-weight: 400;
}

.signin input:focus,
.search:focus {
  outline: none;
  border-color: var(--ink);
}

.signin .btn {
  justify-content: center;
  margin-top: 6px;
}

.error {
  color: var(--red-dark);
  font-size: 14px;
  font-weight: 600;
}

/* List */
.list-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.search {
  width: 100%;
  margin: 24px 0 16px;
}

.empty {
  padding: 48px 0;
  text-align: center;
  color: var(--muted);
}

.rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: grid;
  grid-template-columns: 52px 1fr auto auto;
  align-items: center;
  gap: 16px;
  padding: 10px 12px;
  background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: 14px;
}

.thumb {
  width: 52px;
  height: 52px;
  border-radius: 6px;
  overflow: hidden;
  background: var(--ink);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb.no-cover {
  display: grid;
  place-items: center;
  background: var(--paper);
  color: var(--muted);
  font-size: 20px;
}

.info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.info strong,
.info span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info span {
  color: var(--muted);
}

.info small {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}

.status {
  height: 36px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1.5px solid var(--line);
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  background: #fff;
}

.status.s-available {
  background: var(--ink);
  border-color: var(--ink);
  color: var(--paper);
}

.status.s-coming-soon {
  border-color: var(--red);
  color: var(--red-dark);
}

.row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn.small {
  padding: 8px 16px;
  font-size: 14px;
}

.icon-btn {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
}

.icon-btn:hover {
  background: #fde6e6;
  color: var(--red-dark);
}

/* Toast */
.toast {
  position: fixed;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  max-width: calc(100% - 32px);
  padding: 12px 20px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  font-weight: 600;
  box-shadow: 0 12px 30px -10px rgba(0, 0, 0, 0.4);
  z-index: 50;
}

.toast.error {
  background: var(--red-dark);
  border-radius: 14px;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

@media (max-width: 640px) {
  .row {
    grid-template-columns: 44px 1fr auto;
    grid-template-areas:
      'thumb info info'
      'status status actions';
    gap: 10px 12px;
  }
  .thumb {
    grid-area: thumb;
    width: 44px;
    height: 44px;
  }
  .info {
    grid-area: info;
  }
  .status {
    grid-area: status;
    justify-self: start;
  }
  .row-actions {
    grid-area: actions;
  }
  .card {
    padding: 24px;
  }
}
</style>
