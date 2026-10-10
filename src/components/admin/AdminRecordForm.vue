<script setup>
import { computed, reactive, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { uploadImage, optimizeImage, MAX_UPLOAD_MB } from '../../lib/cloudinary'

// Must match the check constraint / enum in supabase/schema.sql
const FORMATS = ['LP', '2xLP', '3xLP', 'EP', '7"', '10"', '12"']
const STATUSES = ['Available', 'In Rent', 'Coming Soon']

const props = defineProps({
  record: { type: Object, default: null }, // a `records` row, or null for a new record
  genres: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['save', 'cancel'])

const isNew = computed(() => !props.record)

// Setlist JSON → editable sides ({ label, text } with one track per line)
function toSides(setlist) {
  if (!Array.isArray(setlist) || !setlist.length) {
    return [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
    ]
  }
  const sides = []
  let loose = null
  for (const item of setlist) {
    if (typeof item === 'string') {
      if (!loose) sides.push((loose = { label: '', text: '' }))
      loose.text += (loose.text ? '\n' : '') + item
    } else if (item && Array.isArray(item.tracks)) {
      loose = null
      sides.push({ label: item.side == null ? '' : String(item.side), text: item.tracks.join('\n') })
    }
  }
  return sides
}

const r = props.record
const form = reactive({
  title: r?.title ?? '',
  artist: r?.artist ?? '',
  artist_alt: r?.artist_alt ?? '',
  genres: [...(r?.genres ?? (r?.genre ? [r.genre] : []))],
  year: r?.year ?? '',
  format: r?.format ?? 'LP',
  status: r?.status ?? 'Available',
  description: r?.description ?? '',
  reviewer: r?.reviewer ?? '',
  cover_url: r?.cover_url ?? '',
  sides: toSides(r?.setlist),
})

// ─── Genres (tag input) ─────────────────────────────────────────
const MAX_GENRES = 8 // matches the database limit
const genreDraft = ref('')

const genreSuggestions = computed(() => {
  const chosen = form.genres.map((g) => g.toLowerCase())
  return props.genres.filter((g) => !chosen.includes(g.toLowerCase()))
})

function addGenre(raw = genreDraft.value) {
  const name = raw.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
  genreDraft.value = ''
  if (!name || form.genres.length >= MAX_GENRES) return
  // Reuse the existing spelling if this genre is already used elsewhere
  const existing = props.genres.find((g) => g.toLowerCase() === name.toLowerCase())
  const value = existing ?? name
  if (!form.genres.some((g) => g.toLowerCase() === value.toLowerCase())) form.genres.push(value)
}

function onGenreKey(e) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    addGenre()
  } else if (e.key === 'Backspace' && !genreDraft.value && form.genres.length) {
    form.genres.pop()
  }
}

// Picking a suggestion from the list adds it straight away
function onGenreInput(e) {
  if (e.inputType === 'insertReplacementText' || !e.inputType) {
    if (props.genres.includes(genreDraft.value)) addGenre()
  }
}

// ─── Cover upload ───────────────────────────────────────────────
const fileInput = ref(null)
const uploading = ref(false)
const progress = ref(0)
const uploadError = ref('')
const dragging = ref(false)

const coverPreview = computed(() => optimizeImage(form.cover_url.trim(), 400))

async function handleFile(file) {
  if (!file) return
  uploadError.value = ''
  uploading.value = true
  progress.value = 0
  try {
    form.cover_url = await uploadImage(supabase, file, (p) => (progress.value = p))
  } catch (err) {
    uploadError.value = err.message
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function onDrop(e) {
  dragging.value = false
  handleFile(e.dataTransfer?.files?.[0])
}

const tracksIn = (text) =>
  text
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean)

function nextLabel() {
  const last = form.sides.at(-1)?.label.trim() ?? ''
  if (/^\d+$/.test(last)) return String(Number(last) + 1)
  if (/^[A-Ya-y]$/.test(last)) return String.fromCharCode(last.charCodeAt(0) + 1).toUpperCase()
  if (!form.sides.length) return 'A'
  return ''
}

function addSide() {
  form.sides.push({ label: nextLabel(), text: '' })
}

function removeSide(i) {
  form.sides.splice(i, 1)
}

// Editable sides → setlist JSON for Supabase
function toSetlist() {
  const sides = form.sides
    .map((s) => ({ label: s.label.trim(), tracks: tracksIn(s.text) }))
    .filter((s) => s.tracks.length)
  if (!sides.length) return null
  if (sides.length === 1 && !sides[0].label) return sides[0].tracks
  return sides.map((s) => (s.label ? { side: s.label, tracks: s.tracks } : { tracks: s.tracks }))
}

const trackCount = computed(() => form.sides.reduce((n, s) => n + tracksIn(s.text).length, 0))

function submit() {
  addGenre() // include a genre that was typed but not yet added
  emit('save', {
    title: form.title.trim(),
    artist: form.artist.trim(),
    artist_alt: form.artist_alt.trim() || null,
    genres: [...form.genres],
    year: form.year === '' || form.year === null ? null : Number(form.year),
    format: form.format,
    status: form.status,
    description: form.description.trim() || null,
    reviewer: form.reviewer.trim() || null,
    cover_url: form.cover_url.trim() || null,
    setlist: toSetlist(),
  })
}
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <header class="form-head">
      <h2>{{ isNew ? 'New record' : `Edit “${record.title}”` }}</h2>
    </header>

    <!-- Cover -->
    <section class="cover">
      <div class="cover-preview" :class="{ empty: !coverPreview }">
        <img v-if="coverPreview" :src="coverPreview" alt="Cover preview" />
        <span v-else>No cover</span>
        <div v-if="uploading" class="cover-progress">
          <span :style="{ width: `${Math.round(progress * 100)}%` }" />
        </div>
      </div>

      <div class="cover-controls">
        <span class="label">Cover image</span>
        <button
          type="button"
          class="dropzone"
          :class="{ dragging }"
          :disabled="uploading"
          @click="fileInput.click()"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
        >
          <template v-if="uploading">Uploading… {{ Math.round(progress * 100) }}%</template>
          <template v-else>
            <strong>{{ form.cover_url ? 'Replace image' : 'Upload image' }}</strong>
            <span>Click or drag a file here · JPG, PNG, WebP · up to {{ MAX_UPLOAD_MB }} MB · square works best</span>
          </template>
        </button>
        <input ref="fileInput" type="file" accept="image/*" hidden @change="handleFile($event.target.files[0])" />
        <p v-if="uploadError" class="error" role="alert">{{ uploadError }}</p>

        <div class="cover-url">
          <input v-model="form.cover_url" type="url" placeholder="…or paste an image link" aria-label="Cover image link" :disabled="uploading" />
          <button v-if="form.cover_url" type="button" class="text-btn" :disabled="uploading" @click="form.cover_url = ''">Remove</button>
        </div>
      </div>
    </section>

    <div class="grid">
      <label class="field">
        <span>Title <b>*</b></span>
        <input v-model="form.title" required maxlength="200" autocomplete="off" />
      </label>
      <label class="field">
        <span>Artist <b>*</b></span>
        <input v-model="form.artist" required maxlength="200" autocomplete="off" placeholder="e.g. Mariya Takeuchi" />
        <input
          v-model="form.artist_alt"
          class="alt-input"
          maxlength="200"
          autocomplete="off"
          lang="ja"
          placeholder="Original language (optional), e.g. 竹内まりや"
          aria-label="Artist name in original language"
        />
      </label>
      <div class="field">
        <label for="genre-input">Genres <small class="count">{{ form.genres.length }}/{{ MAX_GENRES }}</small></label>
        <div class="tags" @click="$refs.genreInput.focus()">
          <span v-for="(g, i) in form.genres" :key="g" class="tag">
            {{ g }}
            <button type="button" :aria-label="`Remove ${g}`" @click.stop="form.genres.splice(i, 1)">×</button>
          </span>
          <input
            id="genre-input"
            ref="genreInput"
            v-model="genreDraft"
            list="genre-options"
            maxlength="60"
            autocomplete="off"
            :placeholder="form.genres.length ? 'Add another…' : 'e.g. Rock — press Enter to add'"
            :disabled="form.genres.length >= MAX_GENRES"
            @keydown="onGenreKey"
            @input="onGenreInput"
            @blur="addGenre()"
          />
        </div>
        <datalist id="genre-options">
          <option v-for="g in genreSuggestions" :key="g" :value="g" />
        </datalist>
      </div>
      <label class="field">
        <span>Year</span>
        <input v-model="form.year" type="number" min="1900" max="2100" step="1" placeholder="e.g. 1971" />
      </label>
      <label class="field">
        <span>Format</span>
        <select v-model="form.format">
          <option v-for="f in FORMATS" :key="f" :value="f">{{ f }}</option>
        </select>
      </label>
      <label class="field">
        <span>Status</span>
        <select v-model="form.status">
          <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>

    <!-- Setlist -->
    <fieldset class="setlist">
      <legend>
        Setlist <small>{{ trackCount }} track{{ trackCount === 1 ? '' : 's' }}</small>
      </legend>
      <p class="hint">One track per line. Leave the side name blank if the record has no sides.</p>

      <div class="sides">
        <div v-for="(side, i) in form.sides" :key="i" class="side">
          <div class="side-head">
            <label class="side-label">
              <span>Side</span>
              <input v-model="side.label" maxlength="20" placeholder="—" :aria-label="`Side ${i + 1} name`" />
            </label>
            <span class="side-count">{{ tracksIn(side.text).length }}</span>
            <button type="button" class="icon-btn" :aria-label="`Remove side ${side.label || i + 1}`" @click="removeSide(i)">×</button>
          </div>
          <textarea
            v-model="side.text"
            rows="7"
            :placeholder="'Track one\nTrack two\nTrack three'"
            :aria-label="`Tracks for side ${side.label || i + 1}`"
          />
        </div>
        <button type="button" class="add-side" @click="addSide">+ Add side</button>
      </div>
    </fieldset>

    <!-- Review -->
    <label class="field">
      <span>The VOX review</span>
      <textarea v-model="form.description" rows="7" placeholder="What do you think of this record?" />
      <small class="hint">Leave a blank line to start a new paragraph.</small>
    </label>

    <label class="field reviewer">
      <span>Reviewer</span>
      <input v-model="form.reviewer" maxlength="80" autocomplete="off" placeholder="e.g. Aiman" />
      <small class="hint">
        Shown as “— {{ form.reviewer.trim() ? `${form.reviewer.trim()} from the VOX Crew` : 'The VOX Crew' }}”. Leave empty to sign it from the whole crew.
      </small>
    </label>

    <footer class="actions">
      <button type="button" class="btn btn--ghost" :disabled="saving" @click="emit('cancel')">Cancel</button>
      <button type="submit" class="btn btn--red" :disabled="saving || uploading">
        {{ saving ? 'Saving…' : isNew ? 'Add record' : 'Save changes' }}
      </button>
    </footer>
  </form>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  background: var(--card);
  border: 1.5px solid var(--line);
  border-radius: 20px;
  padding: 32px;
}

.form-head h2 {
  font-size: 30px;
}

.hint {
  font-size: 14px;
  color: var(--muted);
  margin-top: 6px;
}

/* Cover */
.cover {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 20px;
  align-items: start;
}

.cover-preview {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: var(--ink);
  box-shadow: 4px 6px 16px rgba(0, 0, 0, 0.15);
}

.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-preview.empty {
  display: grid;
  place-items: center;
  background: var(--paper);
  border: 1.5px dashed var(--line);
  box-shadow: none;
  color: var(--muted);
  font-size: 14px;
}

.cover-progress {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  overflow: hidden;
}

.cover-progress span {
  display: block;
  height: 100%;
  background: var(--red);
  transition: width 0.15s ease;
}

.cover-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.label {
  font-weight: 700;
  font-size: 15px;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 92px;
  padding: 14px;
  border: 1.5px dashed var(--line);
  border-radius: 12px;
  background: var(--paper);
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dropzone span {
  font-size: 13px;
  color: var(--muted);
}

.dropzone:hover:not(:disabled),
.dropzone.dragging {
  border-color: var(--red);
  background: #fdeeee;
}

.dropzone:disabled {
  cursor: progress;
  font-weight: 700;
}

.cover-url {
  display: flex;
  gap: 10px;
  align-items: center;
}

.cover-url input {
  height: 40px;
  font-size: 14px;
}

.text-btn {
  border: 0;
  background: none;
  font-weight: 700;
  color: var(--red-dark);
  cursor: pointer;
  white-space: nowrap;
}

.error {
  color: var(--red-dark);
  font-size: 14px;
  font-weight: 600;
}

.reviewer {
  max-width: 420px;
}

.alt-input {
  height: 38px;
  font-size: 15px;
  background: var(--paper);
}

/* Genre tags */
.count {
  font-family: var(--mono);
  font-weight: 400;
  font-size: 12px;
  color: var(--muted);
  margin-left: 6px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 5px 6px;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: #fff;
  cursor: text;
}

.tags:focus-within {
  border-color: var(--ink);
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px 4px 4px 12px;
  border-radius: 999px;
  background: var(--ink);
  color: var(--paper);
  font-size: 14px;
  font-weight: 600;
}

.tag button {
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}

.tag button:hover {
  background: var(--red);
}

.tags input {
  flex: 1;
  min-width: 140px;
  width: auto;
  height: 30px;
  border: 0;
  padding: 0 6px;
}

.tags input:disabled {
  background: transparent;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field > span,
.field > label,
legend {
  font-weight: 700;
  font-size: 15px;
}

.field b {
  color: var(--red);
}

input,
select,
textarea {
  width: 100%;
  border: 1.5px solid var(--line);
  border-radius: 10px;
  background: #fff;
  font-size: 16px;
}

input,
select {
  height: 44px;
  padding: 0 12px;
}

textarea {
  padding: 10px 12px;
  line-height: 1.5;
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--ink);
}

/* Setlist editor */
.setlist {
  border: 0;
  margin: 0;
  padding: 0;
}

legend {
  padding: 0;
}

legend small {
  font-family: var(--mono);
  font-weight: 400;
  font-size: 12px;
  color: var(--muted);
  margin-left: 8px;
}

.sides {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 14px;
}

.side {
  border: 1.5px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  background: var(--paper);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.side-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.side-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 800;
  flex: 1;
}

.side-label input {
  width: 72px;
  height: 34px;
  font-weight: 700;
}

.side-count {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--muted);
}

.icon-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 0;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  color: var(--muted);
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--card);
  color: var(--red-dark);
}

.add-side {
  min-height: 120px;
  border: 1.5px dashed var(--line);
  border-radius: 14px;
  background: transparent;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
}

.add-side:hover {
  border-color: var(--ink);
  color: var(--ink);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.actions .btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 640px) {
  .form {
    padding: 20px;
  }
  .cover {
    grid-template-columns: 110px 1fr;
    gap: 14px;
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
