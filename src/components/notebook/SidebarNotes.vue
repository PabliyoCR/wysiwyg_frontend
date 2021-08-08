<template lang="pug">
    q-scroll-area.fit
        Container(@drop="onDrop")
            Draggable(v-for="note in notes" :key="note.node.id")
                q-item(clickable v-ripple :active="select === note.node.id" @click="selectNote(note.node.id)" active-class="note-link-selected")
                    q-item-section {{note.node.title}}
                    q-menu(touch-position context-menu)
                        q-list(dense style="min-width: 100px")
                            q-item(clickable v-close-popup)
                                q-item-section(@click="promptRename(note.node.id, note.node.title)") Rename
                            q-item(clickable v-close-popup)
                                q-item-section(@click="showEditor()") Edit
                            q-item(clickable v-close-popup)
                                q-item-section(@click="promptDelete(note.node.id, note.node.title)") Delete

        .row.justify-center.q-mt-sm
            q-btn(round size="6px" icon="fas fa-plus" @click="promptNote = true")
                q-tooltip(:offset="[10, 10]") New Note

        q-dialog(v-model="promptNote")
            q-card(style="min-width: 350px")
                q-card-section
                    .text-h6 Note`s Name
                q-card-section(class="q-pt-none")
                    q-input(v-model="titleNote" dense autofocus @keyup.enter="createNote(); promptNote = false")
                q-card-actions(align="right" class="text-primary")
                    q-btn(flat label="Cancel" v-close-popup)
                    q-btn(flat label="Add Note" v-close-popup @click="createNote" :disabled="titleNote.length == 0")
        
        q-dialog(v-model="alertNote")
            q-card
                q-card-section
                    .text-h6 You must select a section
                q-card-actions(align="right")
                    q-btn(flat label="OK" v-close-popup)
        
        q-dialog(v-model="promptRenameNote")
            q-card(style="min-width: 350px")
                q-card-section
                    .text-h6 Rename
                q-card-section(class="q-pt-none")
                    q-input(v-model="titleNote" dense autofocus @keyup.enter="renameNote(); promptRenameNote = false")
                q-card-actions(align="right" class="text-primary")
                    q-btn(flat label="Cancel" v-close-popup @click="titleNote = ''")
                    q-btn(flat label="Rename Note" v-close-popup @click="renameNote" :disabled="titleNote.length == 0")
        
        q-dialog(v-model="confirmDeleteNote")
            q-card
                q-card-section
                    .row.justify-center.q-mt-sm
                        q-icon(name="fas fa-exclamation-triangle" size="md")
                q-card-section
                    .text-h6 Delete {{clickedNoteTitle}} Note?
                q-card-actions(align="right")
                    q-btn(flat label="Cancel" color="primary" v-close-popup)
                    q-btn(flat label="Delete" color="negative" v-close-popup @click="deleteNote")
</template>

<script>
import axios from "axios";

import { Container, Draggable } from "vue-smooth-dnd";
import { applyDrag, generateItems } from "./utils/helpers";

const endpoint = "http://206.189.176.175/graphql/";

export default {
  name: "SidebarNote",
  components: { Container, Draggable },
  data() {
    return {
      drawerRight: true,
      notes: null,
      select: null,
      sectionID: null,
      titleNote: "",
      clickedNote: null,
      clickedNoteTitle: null,
      promptNote: false,
      alertNote: false,
      promptRenameNote: false,
      confirmDeleteNote: false
    };
  },
  methods: {
    async getNotes(sectionID) {
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `{
                        allNotes(section:"${sectionID}"){
                            edges{
                                node{
                                    id
                                    title
                                }
                            }
                        }
                    }`
        }
      })
        .then(result => {
          this.notes = result.data.data.allNotes.edges;
          this.getNotesOrder(sectionID);
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    async getNotesOrder(sectionID) {
      this.sectionID = sectionID;
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `{
                        section(id:"${sectionID}") {
                            id
                            notesOrder
                        }
                    }`
        }
      })
        .then(result => {
          // Orden las notas
          this.notes.sort((a, b) => {
            return (
              result.data.data.section.notesOrder.order.indexOf(a.node.id) -
              result.data.data.section.notesOrder.order.indexOf(b.node.id)
            );
          });
          if (result.data.data.section.notesOrder.selected) {
            this.selectNote(result.data.data.section.notesOrder.selected);
          } else {
            this.$root.$refs.Note.removeEditorContent();
          }
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    async selectNote(noteID) {
      this.select = noteID;
      if (this.$root.$refs.Note.show) {
        this.$root.$refs.Note.saveEditor();
      }
      this.$root.$refs.Note.getNote(noteID);
      // Actualizar sección seleccionada
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        updateNoteSelected(input:{sectionID:"${this.sectionID}" selected:"${noteID}"}){
                            section {
                                id
                            }
                        }
                    }`
        }
      }).catch(error => {
        alert("Error");
        console.error(error);
      });
    },
    async onDrop(dropResult) {
      this.notes = applyDrag(this.notes, dropResult);
      // Actualizar posición notas
      let selected = this.notes.map(a => a.node.id);
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        updateNotesOrder(input:{sectionID:"${
                          this.sectionID
                        }" order:${'["' + selected.join('","') + '"]'}}){
                            section {
                                id
                            }
                        }
                    }`
        }
      }).catch(error => {
        alert("Error");
        console.error(error);
      });
    },
    async createNote() {
      if (!this.sectionID) {
        this.alertNote = true;
        return;
      }
      // Crear sección
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        createNote(input:{title:"${this.titleNote}" sectionID:"${this.sectionID}"}) {
                            note {
                                id
                            }
                        }
                    }`
        }
      })
        .then(result => {
          this.getNotes(this.sectionID);
          this.selectNote(result.data.data.createNote.note.id);
          this.titleNote = "";
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    promptRename(noteID, noteTitle) {
      this.titleNote = noteTitle;
      this.clickedNote = noteID;
      this.clickedNoteTitle = noteTitle;
      this.promptRenameNote = true;
    },
    async renameNote() {
      // Crear sección
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        renameNote(input:{noteID:"${this.clickedNote}" title:"${this.titleNote}"}) {
                            note {
                                id
                            }
                        }
                    }`
        }
      })
        .then(result => {
          this.getNotes(this.sectionID);
          this.titleNote = "";
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    promptDelete(noteID, noteTitle) {
      this.clickedNote = noteID;
      this.clickedNoteTitle = noteTitle;
      this.confirmDeleteNote = true;
    },
    async deleteNote() {
      // Crear sección
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        deleteNote(input:{noteID:"${this.clickedNote}" sectionID:"${this.sectionID}"}) {
                            note {
                                id
                            }
                        }
                    }`
        }
      })
        .then(result => {
          this.getNotes(this.sectionID);
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    showEditor() {
      this.$root.$refs.Note.showEditor(true);
    }
  },
  mounted() {
    this.$root.$refs.SidebarNotes = this;
  }
};
</script>

<style lang="sass" scoped>
.note-link-selected
    color: white
    background: gray
</style>
