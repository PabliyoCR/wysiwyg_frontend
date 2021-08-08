<template lang="pug">
    q-scroll-area.fit
        Container(@drop="onDrop")
            Draggable(v-for="section in sections" :key="section.node.id")
                q-item(clickable v-ripple :active="select === section.node.id" @click="selectSection(section.node.id)" active-class="section-link-selected" refs="itemSection")
                    q-item-section {{section.node.title}}
                    q-menu(context-menu)
                        q-list(dense style="min-width: 100px")
                            q-item(clickable v-close-popup)
                                q-item-section(@click="promptRename(section.node.id, section.node.title)") Rename
                            q-item(clickable v-close-popup)
                                q-item-section(@click="promptDelete(section.node.id, section.node.title)") Delete
                   
        .row.justify-center.q-mt-sm
            q-btn(round size="6px" icon="fas fa-plus" @click="promptSection = true")
                q-tooltip(:offset="[10, 10]") New Section
                
        q-dialog(v-model="promptSection")
            q-card(style="min-width: 350px")
                q-card-section
                    .text-h6 Section`s Name
                q-card-section(class="q-pt-none")
                    q-input(v-model="titleSection" dense autofocus @keyup.enter="createSection(); promptSection = false; titleSection = ''")
                q-card-actions(align="right" class="text-primary")
                    q-btn(flat label="Cancel" v-close-popup @click="titleSection = ''")
                    q-btn(flat label="Add Section" v-close-popup @click="createSection" :disabled="titleSection.length == 0")

        q-dialog(v-model="promptRenameSection")
            q-card(style="min-width: 350px")
                q-card-section
                    .text-h6 Rename
                q-card-section(class="q-pt-none")
                    q-input(v-model="titleSection" dense autofocus @keyup.enter="renameSection(); promptRenameSection = false")
                q-card-actions(align="right" class="text-primary")
                    q-btn(flat label="Cancel" v-close-popup @click="titleSection = ''")
                    q-btn(flat label="Rename Section" v-close-popup @click="renameSection" :disabled="titleSection.length == 0")
        
        q-dialog(v-model="confirmDeleteSection")
            q-card
                q-card-section
                    .row.justify-center.q-mt-sm
                        q-icon(name="fas fa-exclamation-triangle" size="md")
                q-card-section
                    .text-h6 Delete {{clickedSectionTitle}} Section?
                q-card-actions(align="right")
                    q-btn(flat label="Cancel" color="primary" v-close-popup)
                    q-btn(flat label="Delete" color="negative" v-close-popup @click="deleteSection")
</template>

<script>
import axios from "axios";

import { Container, Draggable } from "vue-smooth-dnd";
import { applyDrag, generateItems } from "./utils/helpers";

const endpoint = "http://206.189.176.175/graphql/";

export default {
  name: "SidebarSections",
  components: { Container, Draggable },
  props: ["sectionsOrder"],
  data() {
    return {
      drawerLeftt: true,
      sections: null,
      select: null,
      titleSection: "",
      clickedSection: null,
      clickedSectionTitle: null,
      promptSection: false,
      promptRenameSection: false,
      confirmDeleteSection: false
    };
  },
  methods: {
    async getSections() {
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `{
                        allSections(notebook:"${this.$route.params.id}"){
                            edges{
                                node{
                                    id
                                    title
                                    notebook{
                                        id
                                    }
                                }
                            }
                        }
                    }`
        }
      })
        .then(result => {
          this.sections = result.data.data.allSections.edges;
          // Orden las secciones
          this.sections.sort((a, b) => {
            return (
              this.sectionsOrder.order.indexOf(a.node.id) -
              this.sectionsOrder.order.indexOf(b.node.id)
            );
          });
          if (this.sectionsOrder.selected) {
            this.selectSection(this.sectionsOrder.selected);
          }
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    async selectSection(sectionID) {
      this.select = sectionID;
      if (this.$root.$refs.Note.show) {
        this.$root.$refs.Note.saveEditor();
      }
      this.$root.$refs.SidebarNotes.getNotes(sectionID);
      // Actualizar sección seleccionada
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        updateSectionSelected(input:{notebookID:"${this.$route.params.id}" selected:"${sectionID}"}){
                            notebook {
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
      this.sections = applyDrag(this.sections, dropResult);
      // Actualizar posición secciones
      let selected = this.sections.map(a => a.node.id);
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        updateSectionsOrder(input:{notebookID:"${
                          this.$route.params.id
                        }" order:${'["' + selected.join('","') + '"]'}}){
                            notebook {
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
    async createSection() {
      // Crear sección
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        createSection(input:{title:"${this.titleSection}" notebookID:"${this.$route.params.id}"}) {
                            section {
                                id
                            }
                        }
                    }`
        }
      })
        .then(result => {
          this.getSections();
          this.sectionsOrder.selected =
            result.data.data.createSection.section.id;
          this.titleSection = "";
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    promptRename(sectionID, sectionTitle) {
      this.titleSection = sectionTitle;
      this.clickedSection = sectionID;
      this.clickedSectionTitle = sectionTitle;
      this.promptRenameSection = true;
    },
    async renameSection() {
      // Crear sección
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        renameSection(input:{sectionID:"${this.clickedSection}" title:"${this.titleSection}"}) {
                            section {
                                id
                            }
                        }
                    }`
        }
      })
        .then(result => {
          this.getSections();
          this.titleSection = "";
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    },
    promptDelete(sectionID, sectionTitle) {
      this.clickedSection = sectionID;
      this.clickedSectionTitle = sectionTitle;
      this.confirmDeleteSection = true;
    },
    async deleteSection() {
      // Crear sección
      await axios({
        method: "POST",
        url: endpoint,
        data: {
          query: `mutation{
                        deleteSection(input:{sectionID:"${this.clickedSection}" notebookID:"${this.$route.params.id}"}) {
                            section {
                                id
                            }
                        }
                    }`
        }
      })
        .then(result => {
          if (this.sectionsOrder.selected == this.clickedSection) {
            this.sectionsOrder.selected = "";
          }
          this.getSections();
        })
        .catch(error => {
          alert("Error");
          console.error(error);
        });
    }
  },
  mounted() {
    this.getSections();
  }
};
</script>

<style lang="sass" scoped>
.section-link-selected
    color: white
    background: gray
</style>
